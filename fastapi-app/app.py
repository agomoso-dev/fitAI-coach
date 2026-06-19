import os
from typing import Any

import requests
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from apps.home_feed.service import build_ai_news_feed

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_SERVER_URL = os.getenv("OLLAMA_SERVER_URL", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:0.5b")


class PromptRequest(BaseModel):
    prompt: str


class FeedRequest(BaseModel):
    interests: dict[str, Any] = {}


@app.get("/")
def home():
    return {"status": "FitAI FastAPI online"}


@app.get("/ask")
def ask(prompt: str):
    return ask_ollama(prompt)


@app.post("/ask")
def ask_post(data: PromptRequest):
    return ask_ollama(data.prompt)


@app.post("/sports-feed")
def sports_feed(data: FeedRequest):
    return build_ai_news_feed(data.interests, OLLAMA_SERVER_URL, OLLAMA_MODEL)


def ask_ollama(prompt):
    try:
        response = requests.post(f"{OLLAMA_SERVER_URL}/api/generate", json={
            "prompt": prompt,
            "stream": False,
            "model": OLLAMA_MODEL,
        })
        return Response(content=response.text, media_type="application/json")
    except requests.exceptions.RequestException as exc:
        return {"error": str(exc)}
