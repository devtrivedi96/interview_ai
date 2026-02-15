"""
Speech-to-Text Service
"""
from openai import AsyncOpenAI
from core.config import settings


class SpeechService:
    """Handles audio transcription"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    async def transcribe_audio(self, audio_file) -> str:
        """Transcribe audio file to text"""
        for attempt in range(settings.STT_MAX_RETRIES):
            try:
                transcript = await self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )
                return transcript
            except Exception as e:
                if attempt == settings.STT_MAX_RETRIES - 1:
                    raise Exception(f"Transcription failed after {settings.STT_MAX_RETRIES} attempts")
                continue
