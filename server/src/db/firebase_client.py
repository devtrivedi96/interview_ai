"""
Firebase Firestore client with in-memory fallback for local/dev.
"""
import os
import logging
from datetime import datetime
from typing import Optional, Any, List, Tuple

import firebase_admin
from firebase_admin import credentials, firestore

from src.utils.config import settings

logger = logging.getLogger(__name__)


class Collections:
    USERS = "users"
    SESSIONS = "sessions"
    SESSION_QUESTIONS = "session_questions"
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
                key=lambda d: (
                    _normalize_sort_value(d.to_dict().get(self._order_field)) is None,
                    _normalize_sort_value(d.to_dict().get(self._order_field)),
                ),
                reverse=self._order_desc,
            )

        if self._limit is not None:
            docs = docs[: self._limit]

        return docs


class _InMemoryCollection:
    def __init__(self, store: dict, name: str):
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

    def where(self, field: str, op: str, value: Any):
        return _InMemoryQuery(self.store, self.name).where(field, op, value)

    def order_by(self, field: str, direction: Any = "ASCENDING"):
        return _InMemoryQuery(self.store, self.name).order_by(field, direction)


class _InMemoryDB:
    def __init__(self):
        self._store: dict[str, dict[str, dict[str, Any]]] = {}

    def collection(self, name: str):
        return _InMemoryCollection(self._store, name)


def get_db():
    """Return Firestore client; fallback to in-memory DB when unavailable."""
    global _db_client

    if _db_client is not None:
        return _db_client

    cred_path = settings.FIREBASE_CREDENTIALS_PATH or os.getenv(
        "FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json"
    )

    try:
        if not firebase_admin._apps:
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized with service account credentials")
            else:
                options = {"projectId": settings.FIREBASE_PROJECT_ID} if settings.FIREBASE_PROJECT_ID else None
                firebase_admin.initialize_app(options=options)
                logger.info("Firebase initialized without service account credentials")

        _db_client = firestore.client()
        logger.info("Firestore client initialized successfully")
        return _db_client
    except Exception as e:
        logger.warning(f"Firestore unavailable, using in-memory DB fallback: {e}")
        _db_client = _InMemoryDB()
        return _db_client
