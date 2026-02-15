"""
Firebase-specific Interview Engine shim

This file provides a lightweight stub adapter so the Firebase-based
routes can import `InterviewEngine`. Implement the real Firestore
logic here for production; the stub allows local import/tests.
"""
from typing import Any


class InterviewEngine:
    """Minimal shim for Firebase InterviewEngine used by routes.

    Methods are intentionally left unimplemented — they should be
    implemented against Firestore APIs. For now they raise
    `NotImplementedError` so imports succeed and runtime errors are
    explicit when called.
    """

    def __init__(self, db: Any):
        self.db = db

    def generate_next_question(self, session: Any):
        raise NotImplementedError("generate_next_question not implemented for Firestore adapter")

    def generate_summary(self, session: Any):
        raise NotImplementedError("generate_summary not implemented for Firestore adapter")
