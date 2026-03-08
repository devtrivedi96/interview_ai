import logging
from datetime import datetime
from decimal import Decimal
from typing import Optional, Any, List, Tuple

try:
    import boto3
    from boto3.dynamodb.conditions import Attr
except Exception:
    boto3 = None

from src.utils.config import settings

AWS_AVAILABLE = True if boto3 is not None else False

logger = logging.getLogger(__name__)


class Collections:
    USERS = "users"
    SESSIONS = "sessions"
    SESSION_QUESTIONS = "session_questions"
    ANSWERS = "answers"
    EVALUATIONS = "evaluations"
    QUESTIONS = "questions"


_db_client: Optional[object] = None


class _MissingDoc:
    exists = False

    def to_dict(self):
        return {}


class _Doc:
    def __init__(self, doc_id: str, data: dict):
        self.id = doc_id
        self._data = data
        self.exists = True

    def to_dict(self):
        return self._data


def _is_desc(direction: Any) -> bool:
    val = str(direction or "").upper()
    return "DESC" in val


def _compare(left: Any, op: str, right: Any) -> bool:
    if op == "==":
        return left == right
    if op == "in":
        if right is None:
            return False
        try:
            return left in right
        except TypeError:
            return False
    if op == ">=":
        return left is not None and left >= right
    if op == "<=":
        return left is not None and left <= right
    if op == ">":
        return left is not None and left > right
    if op == "<":
        return left is not None and left < right
    return False


def _normalize_sort_value(v: Any):
    if isinstance(v, datetime):
        return v.timestamp()
    return v


def _to_dynamodb_value(value: Any):
    """Convert Python values to DynamoDB-compatible values."""
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, float):
        return Decimal(str(value))
    if isinstance(value, list):
        return [_to_dynamodb_value(v) for v in value]
    if isinstance(value, dict):
        return {k: _to_dynamodb_value(v) for k, v in value.items()}
    return value


class _InMemoryQuery:
    def __init__(self, store: dict, name: str):
        self._store = store
        self._name = name
        self._filters: List[Tuple[str, str, Any]] = []
        self._order_field: Optional[str] = None
        self._order_desc: bool = False
        self._limit: Optional[int] = None

    def where(self, field: str, op: str, value: Any):
        self._filters.append((field, op, value))
        return self

    def order_by(self, field: str, direction: Any = "ASCENDING"):
        self._order_field = field
        self._order_desc = _is_desc(direction)
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    def get(self):
        docs = []
        for doc_id, data in list(self._store.get(self._name, {}).items()):
            include = True
            for field, op, value in self._filters:
                if not _compare(data.get(field), op, value):
                    include = False
                    break
            if include:
                docs.append(_Doc(doc_id, data))

        if self._order_field:
            docs.sort(
                key=lambda d: (_normalize_sort_value(d.to_dict().get(self._order_field)) is None,
                               _normalize_sort_value(d.to_dict().get(self._order_field))),
                reverse=self._order_desc,
            )

        if self._limit is not None:
            docs = docs[: self._limit]

        return docs

    def stream(self):
        return self.get()


class _InMemoryCollection:
    def __init__(self, store, name):
        self.store = store
        self.name = name

    def document(self, doc_id: Optional[str] = None):
        if doc_id is None:
            import uuid
            doc_id = uuid.uuid4().hex
        self.store.setdefault(self.name, {})
        if doc_id not in self.store[self.name]:
            self.store[self.name][doc_id] = {}

        class _DocRef:
            def __init__(self, store, name, doc_id):
                self._store = store
                self._name = name
                self.id = doc_id

            def set(self, data, merge: bool = False):
                if merge:
                    self._store[self._name].setdefault(self.id, {})
                    self._store[self._name][self.id].update(data)
                else:
                    self._store[self._name][self.id] = data

            def update(self, data):
                self._store[self._name].setdefault(self.id, {})
                self._store[self._name][self.id].update(data)

            def get(self):
                data = self._store[self._name].get(self.id)
                if data is None:
                    return _MissingDoc()
                return _Doc(self.id, data)

        return _DocRef(self.store, self.name, doc_id)

    def where(self, field, op, value):
        return _InMemoryQuery(self.store, self.name).where(field, op, value)

    def order_by(self, field, direction="ASCENDING"):
        return _InMemoryQuery(self.store, self.name).order_by(field, direction)

    def get(self):
        return _InMemoryQuery(self.store, self.name).get()

    def stream(self):
        return self.get()


def _build_in_memory_db():
    """Build an in-memory DB fallback client."""

    class _InMemoryDB:
        def __init__(self):
            self._store = {}

        def collection(self, name):
            return _InMemoryCollection(self._store, name)

    return _InMemoryDB()


class _DynamoQuery:
    def __init__(self, table):
        self._table = table
        self._filters: List[Tuple[str, str, Any]] = []
        self._order_field: Optional[str] = None
        self._order_desc: bool = False
        self._limit: Optional[int] = None

    def where(self, field: str, op: str, value: Any):
        self._filters.append((field, op, value))
        return self

    def order_by(self, field: str, direction: Any = "ASCENDING"):
        self._order_field = field
        self._order_desc = _is_desc(direction)
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    def get(self):
        try:
            if len(self._filters) == 1 and self._filters[0][1] == "==":
                field, _, value = self._filters[0]
                resp = self._table.scan(FilterExpression=Attr(field).eq(value))
                items = resp.get("Items", [])
            else:
                resp = self._table.scan()
                items = resp.get("Items", [])

            filtered = []
            for item in items:
                include = True
                for field, op, value in self._filters:
                    if not _compare(item.get(field), op, value):
                        include = False
                        break
                if include:
                    filtered.append(item)

            docs = [_Doc(item.get("id"), item) for item in filtered if item.get("id")]

            if self._order_field:
                docs.sort(
                    key=lambda d: (_normalize_sort_value(d.to_dict().get(self._order_field)) is None,
                                   _normalize_sort_value(d.to_dict().get(self._order_field))),
                    reverse=self._order_desc,
                )

            if self._limit is not None:
                docs = docs[: self._limit]

            return docs
        except Exception:
            return []

    def stream(self):
        return self.get()


class _DynamoCollection:
    def __init__(self, dynamo, name):
        self.dynamo = dynamo
        self.name = name
        self.table = dynamo.Table(name)

    def document(self, doc_id: Optional[str] = None):
        if doc_id is None:
            import uuid
            doc_id = uuid.uuid4().hex

        class _DocRef:
            def __init__(self, table, doc_id):
                self._table = table
                self.id = doc_id

            def set(self, data, merge: bool = False):
                incoming = _to_dynamodb_value(data.copy())
                if merge:
                    try:
                        existing = self._table.get_item(Key={"id": self.id}).get("Item") or {}
                    except Exception:
                        existing = {}
                    existing.update(incoming)
                    existing["id"] = self.id
                    self._table.put_item(Item=existing)
                else:
                    incoming["id"] = self.id
                    self._table.put_item(Item=incoming)

            def update(self, data):
                key = {"id": self.id}
                update_expr = "SET " + ", ".join([f"#{k}=:{k}" for k in data.keys()])
                expr_attr_names = {f"#{k}": k for k in data.keys()}
                expr_attr_values = {f":{k}": _to_dynamodb_value(v) for k, v in data.items()}
                try:
                    self._table.update_item(
                        Key=key,
                        UpdateExpression=update_expr,
                        ExpressionAttributeNames=expr_attr_names,
                        ExpressionAttributeValues=expr_attr_values,
                    )
                except Exception:
                    itm = _to_dynamodb_value({**data, "id": self.id})
                    self._table.put_item(Item=itm)

            def get(self):
                try:
                    resp = self._table.get_item(Key={"id": self.id})
                    item = resp.get("Item")
                    if not item:
                        return _MissingDoc()
                    return _Doc(item.get("id"), item)
                except Exception:
                    return _MissingDoc()

        return _DocRef(self.table, doc_id)

    def where(self, field, op, value):
        return _DynamoQuery(self.table).where(field, op, value)

    def order_by(self, field, direction="ASCENDING"):
        return _DynamoQuery(self.table).order_by(field, direction)

    def get(self):
        return _DynamoQuery(self.table).get()

    def stream(self):
        return self.get()


class _DynamoDBWrapper:
    def __init__(self, dynamo):
        self.dynamo = dynamo

    def collection(self, name):
        return _DynamoCollection(self.dynamo, name)


def get_db():
    """Return a DB client. Uses DynamoDB when available, otherwise an in-memory fallback."""
    global _db_client, AWS_AVAILABLE
    if _db_client:
        return _db_client

    if boto3 is None:
        _db_client = _build_in_memory_db()
        AWS_AVAILABLE = False
        return _db_client

    region = settings.AWS_REGION
    if not region:
        logger.warning("AWS region not configured; using in-memory DB fallback.")
        _db_client = _build_in_memory_db()
        AWS_AVAILABLE = False
        return _db_client

    try:
        session_kwargs = {"region_name": region}
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            session_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
            session_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
            if settings.AWS_SESSION_TOKEN:
                session_kwargs["aws_session_token"] = settings.AWS_SESSION_TOKEN

        dynamo = boto3.resource("dynamodb", **session_kwargs)
        _db_client = _DynamoDBWrapper(dynamo)
        AWS_AVAILABLE = True
        return _db_client
    except Exception as e:
        logger.warning(f"Failed to initialize DynamoDB client: {e}. Falling back to in-memory.")
        AWS_AVAILABLE = False
        _db_client = _build_in_memory_db()
        return _db_client
