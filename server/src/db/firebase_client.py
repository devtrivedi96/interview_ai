"""
Firebase Firestore client with an in-memory fallback for local development.
"""
import os
import logging
from typing import Optional

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except Exception:
    firebase_admin = None
    credentials = None
    firestore = None

logger = logging.getLogger(__name__)


class Collections:
    USERS = "users"
    SESSIONS = "sessions"
    SESSION_QUESTIONS = "session_questions"
    EVALUATIONS = "evaluations"
    QUESTIONS = "questions"


_db_client: Optional[object] = None
FIREBASE_AVAILABLE = True if firebase_admin is not None else False


def _build_in_memory_db():
    class _InMemoryDoc:
        def __init__(self, doc_id, data):
            self.id = doc_id
            self._data = data

        def to_dict(self):
            return self._data

        @property
        def exists(self):
            return True

    class _InMemoryCollection:
        def __init__(self, store, name):
            self._store = store
            self._name = name

        def document(self, doc_id: Optional[str] = None):
            if doc_id is None:
                import uuid
                doc_id = uuid.uuid4().hex

            self._store.setdefault(self._name, {})
            if doc_id not in self._store[self._name]:
                self._store[self._name][doc_id] = {}

            class _DocRef:
                def __init__(self, store, name, item_id):
                    self._store = store
                    self._name = name
                    self.id = item_id

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
                        return type("MissingDoc", (), {"exists": False, "to_dict": (lambda self: {})})()
                    return _InMemoryDoc(self.id, data)

            return _DocRef(self._store, self._name, doc_id)

        def where(self, field, op, value):
            store = self._store
            name = self._name

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

    return _InMemoryDB()


def get_db():
    """Return Firestore client when available, otherwise an in-memory DB."""
    global _db_client, FIREBASE_AVAILABLE

    if _db_client is not None:
        return _db_client

    if firebase_admin is None:
        FIREBASE_AVAILABLE = False
        _db_client = _build_in_memory_db()
        return _db_client

    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json")

    try:
        if not firebase_admin._apps:
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                firebase_admin.initialize_app()

        _db_client = firestore.client()
        FIREBASE_AVAILABLE = True
        return _db_client
    except Exception as e:
        logger.warning(
            f"Failed to initialize firebase admin: {e}. Falling back to in-memory DB."
        )
        FIREBASE_AVAILABLE = False
        _db_client = _build_in_memory_db()
        return _db_client
