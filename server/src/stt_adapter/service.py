"""
Speech-to-Text Adapter Service
Handles audio transcription with quality checks
Supports both OpenAI API and local Whisper model
"""

import logging
import os
import tempfile
import time
import uuid
import boto3
from fastapi import UploadFile, HTTPException
from openai import AsyncOpenAI
import whisper

from src.utils.config import settings

logger = logging.getLogger(__name__)


class STTService:
    """Speech-to-text service wrapper"""
    
    _whisper_model = None  # Cache for local whisper model
    
    def __init__(self):
        self.provider = settings.STT_PROVIDER
        
        if self.provider == "openai":
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("STT Service initialized with OpenAI API")
        elif self.provider == "whisper_local":
            # Model will be loaded on first use
            logger.info(f"STT Service initialized with Local Whisper ({settings.WHISPER_MODEL_SIZE} model on {settings.WHISPER_DEVICE})")
        elif self.provider == "aws_transcribe":
            self.transcribe_client = boto3.client(
                "transcribe",
                region_name=settings.AWS_TRANSCRIBE_S3_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                aws_session_token=getattr(settings, "AWS_SESSION_TOKEN", None)
            )
            self.s3_client = boto3.client(
                "s3",
                region_name=settings.AWS_TRANSCRIBE_S3_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                aws_session_token=getattr(settings, "AWS_SESSION_TOKEN", None)
            )
            logger.info("STT Service initialized with AWS Transcribe")
        else:
            raise ValueError(f"Unsupported STT provider: {self.provider}")
    
    @staticmethod
    def _get_whisper_model():
        """Get or load local Whisper model (cached)"""
        if STTService._whisper_model is None:
            logger.info(f"Loading Whisper {settings.WHISPER_MODEL_SIZE} model on {settings.WHISPER_DEVICE}...")
            STTService._whisper_model = whisper.load_model(
                settings.WHISPER_MODEL_SIZE,
                device=settings.WHISPER_DEVICE
            )
            logger.info("Whisper model loaded successfully")
        return STTService._whisper_model
    
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
                if self.provider == "openai":
                    transcript = await self._transcribe_openai(audio_file)
                elif self.provider == "whisper_local":
                    transcript = await self._transcribe_whisper_local(audio_file)
                elif self.provider == "aws_transcribe":
                    transcript = await self._transcribe_aws(audio_file)
                else:
                    raise ValueError(f"Unsupported STT provider: {self.provider}")
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

    async def _transcribe_aws(self, audio_file: UploadFile) -> str:
        """Transcribe using AWS Transcribe with file size/content check and improved logging"""
        try:
            # Read audio file content
            audio_content = await audio_file.read()
            ext = audio_file.filename.split('.')[-1] if audio_file.filename else 'wav'
            job_id = f"stt-{uuid.uuid4()}"
            s3_key = f"{settings.AWS_TRANSCRIBE_S3_PREFIX}/{job_id}.{ext}"

            # Check file size/content before upload
            if not audio_content or len(audio_content) == 0:
                logger.error(f"Audio file is empty! Filename: {audio_file.filename}, Content-Length: 0")
                raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")
            logger.info(f"Audio file size: {len(audio_content)} bytes, Filename: {audio_file.filename}")

            # Upload to S3
            try:
                self.s3_client.put_object(
                    Bucket=settings.AWS_TRANSCRIBE_S3_BUCKET,
                    Key=s3_key,
                    Body=audio_content
                )
                logger.info(f"Uploaded audio to S3: {s3_key}")
            except Exception as s3_exc:
                logger.error(f"Failed to upload audio to S3: {s3_exc}")
                raise HTTPException(status_code=500, detail=f"Failed to upload audio to S3: {s3_exc}")

            # Start Transcribe job
            media_uri = f"s3://{settings.AWS_TRANSCRIBE_S3_BUCKET}/{s3_key}"
            try:
                self.transcribe_client.start_transcription_job(
                    TranscriptionJobName=job_id,
                    Media={"MediaFileUri": media_uri},
                    MediaFormat=ext,
                    LanguageCode=settings.STT_AWS_LANGUAGE_CODE,
                    OutputBucketName=settings.AWS_TRANSCRIBE_S3_BUCKET
                )
                logger.info(f"Started AWS Transcribe job: {job_id}")
            except Exception as transcribe_exc:
                logger.error(f"Failed to start AWS Transcribe job: {transcribe_exc}")
                raise HTTPException(status_code=500, detail=f"Failed to start AWS Transcribe job: {transcribe_exc}")

            # Poll for job completion
            timeout = getattr(settings, "STT_AWS_JOB_TIMEOUT_SEC", 180)
            poll_interval = getattr(settings, "STT_AWS_POLL_INTERVAL_SEC", 3)
            start_time = time.time()
            while True:
                job = self.transcribe_client.get_transcription_job(TranscriptionJobName=job_id)
                status = job["TranscriptionJob"]["TranscriptionJobStatus"]
                if status == "COMPLETED":
                    transcript_uri = job["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
                    import requests
                    try:
                        response = requests.get(transcript_uri)
                        response.raise_for_status()
                        transcript_json = response.json()
                        transcript = transcript_json["results"]["transcripts"][0]["transcript"]
                        logger.info(f"AWS Transcribe completed: {transcript[:100]}...")
                        return transcript
                    except Exception as fetch_exc:
                        logger.error(f"Failed to fetch transcript from S3: {fetch_exc}")
                        raise HTTPException(status_code=500, detail=f"Failed to fetch transcript from S3: {fetch_exc}")
                elif status == "FAILED":
                    logger.error(f"AWS Transcribe job failed: {job}")
                    raise HTTPException(status_code=500, detail="AWS Transcribe job failed")
                if time.time() - start_time > timeout:
                    logger.error("AWS Transcribe job timed out")
                    raise HTTPException(status_code=500, detail="AWS Transcribe job timed out")
                time.sleep(poll_interval)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"AWS Transcribe failed: {e}")
            raise HTTPException(status_code=500, detail=f"AWS Transcribe failed: {e}")
    
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
    
    async def _transcribe_whisper_local(self, audio_file: UploadFile) -> str:
        """Transcribe using local Whisper model"""
        temp_file_path = None
        try:
            # Read audio file content
            audio_content = await audio_file.read()
            
            # Save to temporary file (Whisper requires file path)
            with tempfile.NamedTemporaryFile(
                suffix=f".{audio_file.filename.split('.')[-1] if audio_file.filename else 'wav'}",
                delete=False
            ) as temp_file:
                temp_file.write(audio_content)
                temp_file_path = temp_file.name
            
            logger.info(f"Transcribing audio with local Whisper model: {temp_file_path}")
            
            # Get/load model
            model = self._get_whisper_model()
            
            # Transcribe
            result = model.transcribe(
                temp_file_path,
                language="en",
                verbose=False
            )
            
            transcript = result.get("text", "").strip()
            logger.info(f"Transcription completed: {transcript[:100]}...")
            
            return transcript
            
        except Exception as e:
            logger.error(f"Local Whisper transcription failed: {e}")
            raise
        finally:
            # Clean up temporary file
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception as e:
                    logger.warning(f"Failed to remove temporary file: {e}")
    
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
