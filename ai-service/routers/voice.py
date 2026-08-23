from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
import base64
import os
import tempfile
import subprocess
import io
from gtts import gTTS
from google import genai
from google.genai import types

from services.voice_agent.agent import run_agent

router = APIRouter()

# Setup Gemini Client (reusing env var from main.py)
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    client = genai.Client(api_key=api_key)
else:
    client = None

# ==================================================
# REQUEST MODELS
# ==================================================

class ChatRequest(BaseModel):
    session_id: str
    message: str

class TTSRequest(BaseModel):
    text: str
    languageCode: str = "en-US"

# ==================================================
# CHAT (Agent)
# ==================================================

@router.post("/chat")
def chat(request: ChatRequest):
    try:
        result = run_agent(request.session_id, request.message)
        return result
    except Exception as e:
        print(f"Agent error: {e}")
        return {
            "message": "Sorry, the AI service is currently busy or rate-limited. Please try again in a few seconds.",
            "action": None
        }

# ==================================================
# TRANSCRIBE (STT)
# ==================================================

@router.post("/stt")
async def transcribe_audio(languageCode: str = Form(default="en-US"), audio: UploadFile = File(...)):
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set.")

    input_path = None
    wav_path = None

    try:
        audio_data = await audio.read()
        if len(audio_data) == 0:
            return {"text": ""}

        # Save uploaded audio (likely WebM)
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_file:
            temp_file.write(audio_data)
            input_path = temp_file.name

        # Prepare WAV path
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            wav_path = temp_file.name

        # FFmpeg conversion
        import imageio_ffmpeg
        ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()

        command = [
            ffmpeg_path,
            "-y",
            "-i", input_path,
            "-ac", "1",
            "-ar", "16000",
            "-f", "wav",
            wav_path
        ]

        result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        if result.returncode != 0:
            print("FFmpeg error:", result.stderr.decode(errors="ignore"))
            raise HTTPException(status_code=500, detail="Audio conversion failed")

        with open(wav_path, "rb") as wav_file:
            wav_data = wav_file.read()

        # Gemini transcription
        prompt = f"""
Transcribe the speech in this audio.
Return ONLY the spoken words.
The expected language might be {languageCode}, but detect it automatically.
Do NOT translate.
Keep the transcript in the original language spoken by the user.
"""
        response = client.models.generate_content(
            model="gemini-3.7-flash",
            contents=[
                types.Part.from_bytes(data=wav_data, mime_type="audio/wav"),
                prompt
            ]
        )

        transcript = response.text.strip() if response.text else ""
        return {"text": transcript}

    except Exception as e:
        print("Transcription error:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if input_path and os.path.exists(input_path):
            os.remove(input_path)
        if wav_path and os.path.exists(wav_path):
            os.remove(wav_path)

# ==================================================
# TTS (Text to Speech)
# ==================================================

@router.post("/tts")
def synthesize_speech(request: TTSRequest):
    try:
        # We can map some languageCodes to gTTS supported langs (en, hi, gu)
        lang = "en"
        if request.languageCode.startswith("hi"):
            lang = "hi"
        elif request.languageCode.startswith("gu"):
            lang = "gu"
            
        tts = gTTS(text=request.text, lang=lang)
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        
        # Return base64 encoded string to match Node.js adapter expectation
        encoded = base64.b64encode(mp3_fp.read()).decode('utf-8')
        return {"audioContent": encoded}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
