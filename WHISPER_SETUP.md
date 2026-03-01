# Local Whisper Setup Guide

## Overview

The interview system now supports **offline speech-to-text using OpenAI's Whisper model** locally, instead of relying on API calls. This means:

✅ No API costs for transcription  
✅ Works completely offline  
✅ Faster processing for shorter audio  
✅ Full privacy - audio never leaves your system

## Installation

### 1. Install Dependencies

```bash
cd server
pip install -r requirements.txt
```

The `openai-whisper==20231117` package includes the actual Whisper model.

### 2. Configuration

Edit `/server/.env`:

```env
# STT Configuration
STT_PROVIDER=whisper_local          # Use 'whisper_local' for offline, 'openai' for API
WHISPER_MODEL_SIZE=base             # Options: tiny, base, small, medium, large
WHISPER_DEVICE=cpu                  # Options: cpu or cuda (if you have NVIDIA GPU)
```

## Model Sizes

| Size     | VRAM  | Relative Speed | Accuracy  | Download Size |
| -------- | ----- | -------------- | --------- | ------------- |
| `tiny`   | 1 GB  | 4x faster      | Lower     | ~140 MB       |
| `base`   | 1 GB  | 2x faster      | Good      | ~140 MB       |
| `small`  | 2 GB  | 1x             | Better    | ~461 MB       |
| `medium` | 5 GB  | 0.5x           | Very Good | ~1.5 GB       |
| `large`  | 10 GB | 0.25x          | Excellent | ~3.1 GB       |

**Recommended**: `base` - good balance of speed and accuracy

## Hardware Acceleration

### Using GPU (CUDA)

If you have an NVIDIA GPU:

```bash
# Install PyTorch with CUDA support
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

Update `.env`:

```env
WHISPER_DEVICE=cuda
WHISPER_MODEL_SIZE=small  # Or larger for better accuracy
```

### Using CPU

Default setup. Works on any machine but slower for large audio files.

## First Run

The first time you transcribe audio, Whisper will:

1. Download the model (one-time)
2. Cache it locally (~140 MB for `base`)
3. Process the audio

This takes a few seconds but only happens once.

## Usage in Interview

When users complete an interview and submit audio:

1. Audio is uploaded to the server
2. Local Whisper model transcribes it instantly
3. Transcription is sent back to the frontend
4. No external API calls needed

## Switching Between Providers

### Use Local Whisper (Recommended)

```env
STT_PROVIDER=whisper_local
```

### Use OpenAI API

```env
STT_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

## Performance Tips

### For Better Accuracy

- Use larger models: `small`, `medium`, `large`
- Use GPU if available (CUDA)

### For Faster Processing

- Use smaller models: `tiny`, `base`
- Use CPU is fine for base model

### For Production

- Use `small` model on CPU for balanced performance
- Use `medium` model on GPU for best accuracy

## Troubleshooting

### Model Download Issues

```bash
# Manually download model
python -c "import whisper; whisper.load_model('base')"
```

### Memory Issues

- Reduce `WHISPER_MODEL_SIZE` to `tiny`
- Ensure `WHISPER_DEVICE=cpu`

### Slow Performance

- Ensure audio file isn't too large (max 25 MB)
- Use `base` or `tiny` model
- Consider GPU with `CUDA` support

## Architecture

```
User speaks → Audio uploaded → Server receives
    ↓
Whisper (local, offline) → Transcription
    ↓
AI Evaluator → Feedback
    ↓
Results sent to client
```

No external calls, all processing on your server!
