"""
Session state machine
Manages interview session flow and state transitions
"""
from typing import Optional, Dict, Any
from datetime import datetime
import logging

from db.models import SessionState, InterviewSession
from db.aws_client import get_db, Collections

logger = logging.getLogger(__name__)


class SessionStateMachine:
    """
    Manages session state transitions
    Implements the interview flow state machine
    """
    
    # Valid state transitions
    TRANSITIONS = {
        SessionState.IDLE: [SessionState.INIT],
        SessionState.INIT: [SessionState.PROFILE_CHECK, SessionState.ASK_QUESTION],
        SessionState.PROFILE_CHECK: [SessionState.ASK_QUESTION, SessionState.FAILED],
        SessionState.ASK_QUESTION: [SessionState.VOICE_CAPTURE],
        SessionState.VOICE_CAPTURE: [SessionState.QUALITY_CHECK, SessionState.FAILED],
        SessionState.QUALITY_CHECK: [SessionState.TRANSCRIBE, SessionState.VOICE_CAPTURE, SessionState.FAILED],
        SessionState.TRANSCRIBE: [SessionState.EVALUATE, SessionState.FAILED],
        SessionState.EVALUATE: [SessionState.ADAPT, SessionState.FAILED],
        SessionState.ADAPT: [SessionState.ASK_QUESTION, SessionState.COMPLETE],
        SessionState.COMPLETE: [],
        SessionState.FAILED: []
    }
    
    def __init__(self, session: InterviewSession):
        self.session = session
        self.db = get_db()
    
    def can_transition(self, to_state: SessionState) -> bool:
        """Check if transition to new state is valid"""
        current_state = self.session.state
        valid_transitions = self.TRANSITIONS.get(current_state, [])
        return to_state in valid_transitions
    
    def transition(self, to_state: SessionState, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Transition to new state
        
        Args:
            to_state: Target state
            metadata: Optional metadata to store with transition
        
        Returns:
            True if transition successful, False otherwise
        """
        if not self.can_transition(to_state):
            logger.warning(
                f"Invalid state transition: {self.session.state} -> {to_state} "
                f"for session {self.session.id}"
            )
            return False
        
        # Update session state
        update_data = {
            'state': to_state.value,
            'updated_at': datetime.utcnow()
        }
        
        if metadata:
            update_data['metadata'] = metadata
        
        self.db.collection(Collections.SESSIONS).document(self.session.id).update(update_data)
        self.session.state = to_state
        
        logger.info(f"Session {self.session.id} transitioned to {to_state.value}")
        return True
    
    def fail(self, reason: str):
        """Mark session as failed with reason"""
        self.db.collection(Collections.SESSIONS).document(self.session.id).update({
            'state': SessionState.FAILED.value,
            'failure_reason': reason,
            'failed_at': datetime.utcnow()
        })
        self.session.state = SessionState.FAILED
        logger.error(f"Session {self.session.id} failed: {reason}")
    
    def complete(self):
        """Mark session as complete"""
        if self.can_transition(SessionState.COMPLETE):
            self.db.collection(Collections.SESSIONS).document(self.session.id).update({
                'state': SessionState.COMPLETE.value,
                'completed_at': datetime.utcnow(),
                'duration_sec': int((datetime.utcnow() - self.session.created_at).total_seconds())
            })
            self.session.state = SessionState.COMPLETE
            logger.info(f"Session {self.session.id} completed")
            return True
        return False
