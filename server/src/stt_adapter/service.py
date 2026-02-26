"""
Speech-to-Text Adapter Service
Handles audio transcription with quality checks
"""
import logging
from fastapi import UploadFile, HTTPException
from openai import AsyncOpenAI

from utils.config import settings

logger = logging.getLogger(__name__)


class STTService:
    """Speech-to-text service wrapper"""
    
    def __init__(self):
        if settings.STT_PROVIDER == "openai":
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        else:
            raise ValueError(f"Unsupported STT provider: {settings.STT_PROVIDER}")
    
    async def transcribe(self, audio_file: UploadFile) -> str:
        """
        Transcribe audio file to text
        
        Args:
            audio_file: Uploaded audio file
        
        Returns:
            Transcribed text
        
        Raises:
            HTTPException: If transcription fails
        """
        # Validate file
        self._validate_audio_file(audio_file)
        
        # Transcribe with retry logic
        for attempt in range(settings.STT_MAX_RETRIES):
            try:
                transcript = await self._transcribe_openai(audio_file)
                
                # Quality check
                if not self._is_quality_sufficient(transcript):
                    logger.warning(f"Low quality transcript: {transcript[:100]}")
                
                return transcript
                
            except Exception as e:
                logger.warning(f"Transcription attempt {attempt + 1} failed: {e}")
                if attempt == settings.STT_MAX_RETRIES - 1:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Transcription failed after {settings.STT_MAX_RETRIES} attempts"
                    )
        
        raise HTTPException(status_code=500, detail="Transcription failed")
    
    def _validate_audio_file(self, audio_file: UploadFile):
        """Validate audio file format and size"""
        # Check file extension
        if audio_file.filename:
            ext = audio_file.filename.split('.')[-1].lower()
            if ext not in settings.SUPPORTED_AUDIO_FORMATS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported audio format. Supported: {settings.SUPPORTED_AUDIO_FORMATS}"
                )
        
        # Check file size (if available)
        if audio_file.size and audio_file.size > settings.MAX_AUDIO_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"Audio file too large. Maximum size: {settings.MAX_AUDIO_SIZE_MB}MB"
            )
    
    async def _transcribe_openai(self, audio_file: UploadFile) -> str:
        """Transcribe using OpenAI Whisper API"""
        try:
            # Read file content
            audio_content = await audio_file.read()
            
            # Reset file pointer for potential retries
            await audio_file.seek(0)
            
            # Create a file-like object
            from io import BytesIO
            audio_bytes = BytesIO(audio_content)
            audio_bytes.name = audio_file.filename or "audio.wav"
            
            # Call Whisper API
            response = await self.client.audio.transcriptions.create(
                model=settings.STT_MODEL,
                file=audio_bytes,
                response_format="text",
                timeout=settings.STT_TIMEOUT_SEC
            )
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"OpenAI transcription failed: {e}")
            raise
    
    def _is_quality_sufficient(self, transcript: str) -> bool:
        """
        Check if transcript quality is sufficient
        
        Basic heuristics:
        - Minimum length
        - Contains actual words
        - Not just noise/filler
        """
        if not transcript or len(transcript.strip()) < 10:
            return False
        
        # Check for meaningful content (not just "um", "uh", etc.)
        words = transcript.lower().split()
        filler_words = {'um', 'uh', 'er', 'ah', 'hmm'}
        meaningful_words = [w for w in words if w not in filler_words]
        
        if len(meaningful_words) < 3:
            return False
        
        return True
    
    def calculate_clarity_score(self, transcript: str, audio_duration_sec: float) -> float:
        """
        Calculate clarity score based on transcript and audio duration
        
        Factors:
        - Words per minute (speaking pace)
        - Filler word ratio
        - Sentence structure
        
        Returns:
            Clarity score (0-1)
        """
        if not transcript or audio_duration_sec <= 0:
            return 0.0
        
        words = transcript.split()
        word_count = len(words)
        
        # Calculate words per minute
        wpm = (word_count / audio_duration_sec) * 60
        
        # Optimal WPM range: 120-160
        if 120 <= wpm <= 160:
            pace_score = 1.0
        elif wpm < 120:
            pace_score = max(0.5, wpm / 120)
        else:
            pace_score = max(0.5, 160 / wpm)
        
        # Calculate filler word ratio
        filler_words = {'um', 'uh', 'er', 'ah', 'hmm', 'like', 'you know'}
        filler_count = sum(1 for w in words if w.lower() in filler_words)
        filler_ratio = filler_count / word_count if word_count > 0 else 0
        filler_score = max(0, 1 - (filler_ratio * 2))  # Penalize heavily
        
        # Combine scores
        clarity_score = (pace_score * 0.6) + (filler_score * 0.4)
        
        return round(clarity_score, 2)
