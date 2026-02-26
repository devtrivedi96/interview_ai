import os
import logging
from typing import Optional

try:
    import boto3
    from boto3.dynamodb.conditions import Attr
except Exception:
    boto3 = None

AWS_AVAILABLE = True if boto3 is not None else False

logger = logging.getLogger(__name__)


class Collections:
    USERS = "users"
    SESSIONS = "sessions"
    SESSION_QUESTIONS = "session_questions"
    EVALUATIONS = "evaluations"
    QUESTIONS = "questions"


_db_client: Optional[object] = None


def get_db():
    """Return a DB client. Uses DynamoDB when available, otherwise an in-memory fallback."""
    global _db_client, AWS_AVAILABLE
    if _db_client:
        return _db_client

    if boto3 is None:
        # In-memory fallback similar to previous Firebase fallback
        class _InMemoryDoc:
            def __init__(self, id, data):
                self.id = id
                self._data = data

            def to_dict(self):
                return self._data

            @property
            def exists(self):
                return True

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
                    def __init__(self, store, name, id):
                        self._store = store
                        self._name = name
                        self.id = id

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
                            return type('X', (), {'exists': False, 'to_dict': lambda: {}})()
                        return _InMemoryDoc(self.id, data)

                return _DocRef(self.store, self.name, doc_id)

            def where(self, field, op, value):
                store = self.store
                name = self.name

                class _Query:
                    def __init__(self, store, name, field, value):
                        self._store = store
                        self._name = name
                        self._field = field
                        self._value = value
                        self._limit = None

                    def limit(self, n):
                        self._limit = n
                        return self

                    def get(self):
                        results = []
                        for doc_id, data in list(self._store.get(self._name, {}).items()):
                            if data.get(self._field) == self._value:
                                results.append(_InMemoryDoc(doc_id, data))
                                if self._limit and len(results) >= self._limit:
                                    break
                        return results

                return _Query(store, name, field, value)

        class _InMemoryDB:
            def __init__(self):
                self._store = {}

            def collection(self, name):
                return _InMemoryCollection(self._store, name)

        _db_client = _InMemoryDB()
        AWS_AVAILABLE = False
        return _db_client

    # Try DynamoDB
    region = os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION")
    if not region:
        logger.warning("AWS region not configured; using in-memory DB fallback.")
        return get_db()

    try:
        dynamo = boto3.resource("dynamodb", region_name=region)

        class _DynamoCollection:
            def __init__(self, dynamo, name):
                self.dynamo = dynamo
                self.name = name
                # Table name is the collection name by default
                self.table = dynamo.Table(name)

            def document(self, doc_id: Optional[str] = None):
                if doc_id is None:
                    import uuid
                    doc_id = uuid.uuid4().hex

                class _DocRef:
                    def __init__(self, table, id):
                        self._table = table
                        self.id = id

                    def set(self, data, merge: bool = False):
                        item = data.copy()
                        item['id'] = self.id
                        self._table.put_item(Item=item)

                    def update(self, data):
                        # Simple update implementation (overwrites attributes provided)
                        key = {'id': self.id}
                        update_expr = "SET " + ", ".join([f"#{k}=:{k}" for k in data.keys()])
                        expr_attr_names = {f"#{k}": k for k in data.keys()}
                        expr_attr_values = {f":{k}": v for k, v in data.items()}
                        try:
                            self._table.update_item(
                                Key=key,
                                UpdateExpression=update_expr,
                                ExpressionAttributeNames=expr_attr_names,
                                ExpressionAttributeValues=expr_attr_values,
                            )
                        except Exception:
                            itm = {**data, 'id': self.id}
                            self._table.put_item(Item=itm)

                    def get(self):
                        try:
                            resp = self._table.get_item(Key={'id': self.id})
                            item = resp.get('Item')
                            if not item:
                                return type('X', (), {'exists': False, 'to_dict': lambda: {}})()
                            return type('D', (), {'id': item.get('id'), 'to_dict': lambda: item, 'exists': True})()
                        except Exception:
                            return type('X', (), {'exists': False, 'to_dict': lambda: {}})()

                return _DocRef(self.table, doc_id)

            def where(self, field, op, value):
                # Only supports equality scans for now
                results = []
                try:
                    resp = self.table.scan(FilterExpression=Attr(field).eq(value))
                    items = resp.get('Items', [])
                    for it in items:
                        results.append(type('D', (), {'id': it.get('id'), 'to_dict': lambda it=it: it, 'exists': True})())
                except Exception:
                    pass
                class _Query:
                    def __init__(self, results):
                        self._results = results
                        self._limit = None

                    def limit(self, n):
                        self._limit = n
                        return self

                    def get(self):
                        if self._limit:
                            return self._results[: self._limit]
                        return self._results

                return _Query(results)

        class _DynamoDBWrapper:
            def __init__(self, dynamo):
                self.dynamo = dynamo

            def collection(self, name):
                return _DynamoCollection(self.dynamo, name)

        _db_client = _DynamoDBWrapper(dynamo)
        AWS_AVAILABLE = True
        return _db_client
    except Exception as e:
        logger.warning(f"Failed to initialize DynamoDB client: {e}. Falling back to in-memory.")
        AWS_AVAILABLE = False
        return get_db()
