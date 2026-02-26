"""
Compatibility shim for legacy `firebase_client` imports.

This module delegates to `db.aws_client` and exposes the small
surface the rest of the codebase expected (`get_db`, `Collections`,
and a boolean `FIREBASE_AVAILABLE` for feature-flagging). The naming
is preserved to minimize changes elsewhere while the codebase migrates.
"""
from db import aws_client as _aws_client

# Backwards-compatible names
get_db = _aws_client.get_db
Collections = _aws_client.Collections
# Indicate whether a real AWS/DynamoDB client is available
FIREBASE_AVAILABLE = _aws_client.AWS_AVAILABLE

