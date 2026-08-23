from google import genai
from google.genai import types
from dotenv import load_dotenv

import os
import json

from services.voice_agent.tools import navigate_to_page
from services.voice_agent.memory import get_session


# --------------------------------------------------
# Environment
# --------------------------------------------------

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError(
        "GEMINI_API_KEY is missing from .env"
    )


# --------------------------------------------------
# Gemini Client
# --------------------------------------------------

client = genai.Client(
    api_key=api_key
)


# --------------------------------------------------
# Agent
# --------------------------------------------------

def run_agent(session_id, user_message):

    session = get_session(session_id)


    # ----------------------------------------------
    # Add user message
    # ----------------------------------------------

    session["conversation"].append({
        "role": "user",
        "content": user_message
    })


    # ----------------------------------------------
    # System prompt
    # ----------------------------------------------

    system_prompt = f"""
You are a website AI assistant.

Current page:
{session["current_page"]}

Selected project:
{session["selected_project"]}

Rules:

1. Understand what the user wants.
2. ONLY use the navigation tool if the user EXPLICITLY asks to navigate, open, or go to a specific page.
3. If the user asks a general question, greets you, or talks about something else, DO NOT use the navigation tool. Just reply with conversational text.
4. Never invent pages.
5. Respond in the same language as the user.
6. Be concise and conversational.
"""


    # ----------------------------------------------
    # Gemini request
    # ----------------------------------------------

    response = client.models.generate_content(

        model="gemini-3.7-flash",

        contents=[
            types.Content(
                role=msg["role"],
                parts=[types.Part.from_text(text=msg["content"])]
            )
            for msg in session["conversation"]
        ],

        config=types.GenerateContentConfig(
            system_instruction=system_prompt,

            tools=[
                types.Tool(
                    function_declarations=[
                        types.FunctionDeclaration(

                            name="navigate_to_page",

                            description=(
                                "Navigate the user to "
                                "an allowed website page."
                            ),

                            parameters=types.Schema(
                                type="OBJECT",

                                properties={
                                    "page": types.Schema(
                                        type="STRING",

                                        enum=[
                                            "dashboard",
                                            "profile",
                                            "projects",
                                            "analytics",
                                            "settings",
                                            "orders",
                                            "messages"
                                        ]
                                    )
                                },

                                required=[
                                    "page"
                                ]
                            )
                        )
                    ]
                )
            ]
        )
    )


    # ----------------------------------------------
    # Handle function calls
    # ----------------------------------------------

    for candidate in response.candidates:

        for part in candidate.content.parts:

            if part.function_call:

                function_call = part.function_call

                if (
                    function_call.name ==
                    "navigate_to_page"
                ):

                    args = dict(
                        function_call.args
                    )

                    page = args["page"]


                    # ------------------------------
                    # Execute navigation
                    # ------------------------------

                    result = navigate_to_page(
                        page
                    )


                    if result["success"]:

                        session["current_page"] = (
                            result["path"]
                        )

                        session["conversation"].append({
                            "role": "model",
                            "content": f"Opening {page}."
                        })

                        return {
                            "message":
                                f"Opening {page}.",

                            "action":
                                result
                        }


                    else:

                        session["conversation"].append({
                            "role": "model",
                            "content": "Access denied."
                        })

                        return {
                            "message":
                                "Sorry, you don't have "
                                "permission to access "
                                "that page.",

                            "action":
                                None
                        }


    # ----------------------------------------------
    # Normal AI response
    # ----------------------------------------------

    answer = response.text


    if not answer:

        answer = (
            "Sorry, I couldn't generate a response."
        )


    session["conversation"].append({
        "role": "model",
        "content": answer
    })


    return {
        "message": answer,
        "action": None
    }