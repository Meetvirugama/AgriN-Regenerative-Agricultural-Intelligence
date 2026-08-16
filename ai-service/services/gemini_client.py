import os
import json
from google import genai
from google.genai import types

# Initialize Gemini Client
# It will automatically pick up GEMINI_API_KEY from environment variables
api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("WARNING: GEMINI_API_KEY not set. Gemini API calls will fail.")
    client = None
else:
    client = genai.Client()

def analyze_image_with_prompt(image_bytes: bytes, mime_type: str, prompt: str, schema_class=None) -> dict:
    """
    Analyzes an image with a prompt using Gemini.
    """
    if not client:
        raise ValueError("GEMINI_API_KEY is not configured.")

    # We use gemini-2.5-flash as the default multimodal model
    model = 'gemini-2.5-flash'
    
    contents = [
        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
        prompt
    ]

    # If a schema is provided, enforce structured JSON output
    config_args = {"temperature": 0.2}
    if schema_class:
        config_args["response_mime_type"] = "application/json"
        config_args["response_schema"] = schema_class

    config = types.GenerateContentConfig(**config_args)
    
    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=config,
    )
    
    if schema_class:
        return json.loads(response.text)
    return {"text": response.text}

def generate_text(prompt: str, schema_class=None) -> dict:
    """
    Generates text from a prompt using Gemini.
    """
    if not client:
        raise ValueError("GEMINI_API_KEY is not configured.")

    model = 'gemini-2.5-flash'
    
    config_args = {"temperature": 0.4}
    if schema_class:
        config_args["response_mime_type"] = "application/json"
        config_args["response_schema"] = schema_class

    config = types.GenerateContentConfig(**config_args)
    
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=config,
    )
    
    if schema_class:
        return json.loads(response.text)
    return {"text": response.text}
