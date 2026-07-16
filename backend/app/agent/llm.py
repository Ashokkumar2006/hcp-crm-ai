import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

PRIMARY_MODEL = "gemma2-9b-it"
FALLBACK_MODEL = "llama-3.3-70b-versatile"


def call_llm(messages: list, model: str = PRIMARY_MODEL, temperature: float = 0.2, json_mode: bool = False) -> str:
    """
    Calls Groq chat completion. Falls back to llama-3.3-70b-versatile if the
    primary model errors out (rate limit, transient failure, etc).
    """
    kwargs = {}
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    try:
        completion = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            **kwargs,
        )
        return completion.choices[0].message.content
    except Exception:
        if model == FALLBACK_MODEL:
            raise
        completion = client.chat.completions.create(
            model=FALLBACK_MODEL,
            messages=messages,
            temperature=temperature,
            **kwargs,
        )
        return completion.choices[0].message.content


def call_llm_json(messages: list, model: str = PRIMARY_MODEL, temperature: float = 0.1) -> dict:
    """Convenience wrapper for calls that must return parseable JSON."""
    raw = call_llm(messages, model=model, temperature=temperature, json_mode=True)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Defensive fallback: strip markdown fences if the model added them anyway
        cleaned = raw.strip().strip("`").replace("json\n", "", 1)
        return json.loads(cleaned)
