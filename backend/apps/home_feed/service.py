import html
import json
import math
import re
import time
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

import requests

SPORT_FEEDS = (
    ("MARCA", "https://e00-marca.uecdn.es/rss/portada.xml", None),
    ("MARCA Futbol", "https://e00-marca.uecdn.es/rss/futbol.xml", "futbol"),
    ("MARCA Baloncesto", "https://e00-marca.uecdn.es/rss/baloncesto.xml", "baloncesto"),
    ("MARCA Motor", "https://e00-marca.uecdn.es/rss/motor.xml", "motor"),
    ("MARCA Tenis", "https://e00-marca.uecdn.es/rss/tenis.xml", "tenis"),
    ("AS Futbol", "https://feeds.as.com/mrss-s/pages/as/site/as.com/section/futbol/portada/", "futbol"),
    ("AS Baloncesto", "https://feeds.as.com/mrss-s/pages/as/site/as.com/section/baloncesto/portada/", "baloncesto"),
    ("AS Motor", "https://feeds.as.com/mrss-s/pages/as/site/as.com/section/motor/portada/", "motor"),
    ("AS Tenis", "https://feeds.as.com/mrss-s/pages/as/site/as.com/section/tenis/portada/", "tenis"),
    ("AS Ciclismo", "https://feeds.as.com/mrss-s/pages/as/site/as.com/section/ciclismo/portada/", "ciclismo"),
    ("Mundo Deportivo", "https://www.mundodeportivo.com/rss/portada.xml", None),
    ("Mundo Deportivo Baloncesto", "https://www.mundodeportivo.com/rss/baloncesto.xml", "baloncesto"),
    ("Mundo Deportivo Tenis", "https://www.mundodeportivo.com/rss/tenis.xml", "tenis"),
    ("Mundo Deportivo Motor", "https://www.mundodeportivo.com/rss/motor.xml", "motor"),
)
EDITORIAL_HEADLINE = "Entrena con criterio antes de abrir tu plan"
EDITORIAL_INTRO = "Planifica tu entrenamiento, mejora tus habitos y sigue el deporte que te interesa."
WORDS_PER_MINUTE = 220
MAX_NEWS_AGE_DAYS = 14
BLOCKED_TITLE_PATTERNS = (
    "portada",
    "hemeroteca",
    "newsletter",
    "horoscopo",
    "programacion",
)

TOPIC_KEYWORDS = {
    "futbol": ("futbol", "liga", "madrid", "barca", "champions", "mundial", "seleccion"),
    "baloncesto": ("baloncesto", "basket", "nba", "acb", "euroliga"),
    "motor": ("formula", "f1", "motogp", "motor", "rally"),
    "tenis": ("tenis", "wimbledon", "roland", "alcaraz", "sinner", "nadal"),
    "running": ("atletismo", "running", "maraton", "carrera"),
    "ciclismo": ("ciclismo", "tour", "giro", "vuelta", "ciclista"),
    "golf": ("golf", "masters", "rider"),
    "boxeo": ("boxeo", "ufc", "mma", "combate"),
}


def clean_text(value):
    text = html.unescape(html.unescape(value or ""))
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    text = re.sub(r"<[^>]+>", " ", text)
    if "Ã" in text or "â" in text:
        try:
            text = text.encode("latin1").decode("utf-8")
        except UnicodeError:
            pass
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def reading_minutes(*parts):
    words = len(" ".join(parts).split())
    return max(1, math.ceil(words / WORDS_PER_MINUTE))


def extract_article_text(url):
    response = requests.get(url, timeout=8, headers={"User-Agent": "FitAI-Coach/1.0"})
    response.raise_for_status()
    page = response.text
    paragraphs = re.findall(r"<p[^>]*>(.*?)</p>", page, flags=re.IGNORECASE | re.DOTALL)
    text = clean_text(" ".join(paragraphs))
    if len(text.split()) < 120:
        meta_descriptions = re.findall(
            r'<meta[^>]+(?:name|property)=["\'](?:description|og:description)["\'][^>]+content=["\']([^"\']+)["\']',
            page,
            flags=re.IGNORECASE,
        )
        text = clean_text(" ".join(meta_descriptions)) or text
    if len(text.split()) < 120:
        json_ld_blocks = re.findall(
            r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
            page,
            flags=re.IGNORECASE | re.DOTALL,
        )
        text_parts = []
        for block in json_ld_blocks:
            text_parts.extend(re.findall(r'"(?:articleBody|description)"\s*:\s*"([^"]+)"', block))
        text = clean_text(" ".join(text_parts)) or text
    return text


def estimate_article_reading_minutes(title, summary, url):
    try:
        article_text = extract_article_text(url)
    except requests.RequestException:
        article_text = ""

    words = len(article_text.split())
    if words < 120:
        words = max(words, len(" ".join([title, summary]).split()))
    if words < 120 and url and url != "#":
        words = 260

    return max(1, math.ceil(words / WORDS_PER_MINUTE))


def detect_topic(title, summary, feed_topic=None):
    if feed_topic:
        return feed_topic

    text = f"{title} {summary}".lower()
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(keyword in text for keyword in keywords):
            return topic
    return "deporte"


def parse_published_timestamp(value):
    if not value:
        return None
    try:
        return parsedate_to_datetime(value).timestamp()
    except (TypeError, ValueError, AttributeError):
        return None


def is_recent(published_at):
    timestamp = parse_published_timestamp(published_at)
    if timestamp is None:
        return True
    return (time.time() - timestamp) <= MAX_NEWS_AGE_DAYS * 86400


def looks_like_valid_news(title, summary, published_at):
    text = f"{title} {summary}".lower()
    if any(pattern in text for pattern in BLOCKED_TITLE_PATTERNS):
        return False
    if re.search(r"\b20(1\d|2[0-4])\b", text):
        return False
    return is_recent(published_at)


def fetch_feed(source, url, feed_topic=None):
    response = requests.get(url, timeout=8, headers={"User-Agent": "FitAI-Coach/1.0"})
    response.raise_for_status()
    root = ET.fromstring(response.content)
    items = []

    for item in root.findall(".//item")[:8]:
        title = clean_text(item.findtext("title"))
        summary = clean_text(item.findtext("description"))
        link = clean_text(item.findtext("link"))
        published_at = clean_text(item.findtext("pubDate"))
        if not title or not link:
            continue
        if not looks_like_valid_news(title, summary, published_at):
            continue

        items.append({
            "title": title,
            "original_summary": summary,
            "summary": summary or title,
            "source": source,
            "url": link,
            "published_at": published_at,
            "tag": detect_topic(title, summary, feed_topic).title(),
            "read_minutes": estimate_article_reading_minutes(title, summary, link),
        })

    return items


def normalize_interests(interests):
    if not isinstance(interests, dict):
        return {}

    now = time.time()
    scores = {}

    for visit in interests.get("visits", []):
        if not isinstance(visit, dict):
            continue
        topic = str(visit.get("topic", "")).lower()
        if not topic:
            continue
        age_days = max(0, (now - float(visit.get("visited_at", now))) / 86400)
        recency_weight = max(0.2, 1 - (age_days / 14))
        scores[topic] = scores.get(topic, 0) + recency_weight

    for topic, value in interests.items():
        if topic == "visits":
            continue
        try:
            scores[str(topic).lower()] = scores.get(str(topic).lower(), 0) + float(value) * 0.35
        except (TypeError, ValueError):
            continue

    return scores


def prioritize_cards(cards, interests):
    normalized = normalize_interests(interests)

    def score(card):
        topic = card["tag"].lower()
        interest_score = normalized.get(topic, 0)
        source_bonus = 0.2 if topic != "deporte" else 0
        return interest_score + source_bonus

    return sorted(cards, key=score, reverse=True)


def build_news_feed(interests):
    cards = []
    for source, url, feed_topic in SPORT_FEEDS:
        try:
            cards.extend(fetch_feed(source, url, feed_topic))
        except (requests.RequestException, ET.ParseError):
            continue

    cards = prioritize_cards(cards, interests)
    return {
        "headline": EDITORIAL_HEADLINE,
        "intro": EDITORIAL_INTRO if cards else "No se pudieron cargar los periodicos ahora mismo. Vuelve a intentarlo en unos minutos.",
        "featured_topic": cards[0]["tag"] if cards else "Deporte",
        "cards": cards[:6],
        "coach_note": "Noticias tomadas de periodicos deportivos. La IA solo las reescribe y ordena segun tus intereses.",
    }


def rewrite_cards_with_ai(cards, ollama_server_url, model="qwen2.5:0.5b"):
    if not cards:
        return cards

    prompt = (
        "Reescribe con tus palabras estas noticias deportivas sin inventar datos. "
        "Devuelve solo JSON valido como lista. Cada elemento debe tener title y summary. "
        "No copies frases literales largas del periodico. "
        f"Noticias: {json.dumps(cards[:6], ensure_ascii=False)}"
    )

    try:
        response = requests.post(f"{ollama_server_url}/api/generate", json={
            "prompt": prompt,
            "stream": False,
            "model": model,
        }, timeout=12)
        payload = response.json()
        rewritten = json.loads(payload.get("response", "[]"))
        if not isinstance(rewritten, list):
            return cards

        next_cards = []
        for index, card in enumerate(cards[:6]):
            ai_card = rewritten[index] if index < len(rewritten) and isinstance(rewritten[index], dict) else {}
            next_cards.append({
                **card,
                "title": clean_text(ai_card.get("title")) or card["title"],
                "summary": clean_text(ai_card.get("summary")) or card["summary"],
            })
        return next_cards
    except (requests.RequestException, ValueError, json.JSONDecodeError, KeyError):
        return cards


def build_ai_news_feed(interests, ollama_server_url, model="qwen2.5:0.5b"):
    feed = build_news_feed(interests)
    cards = rewrite_cards_with_ai(feed["cards"], ollama_server_url, model)
    if cards:
        feed["cards"] = cards
        feed["featured_topic"] = cards[0]["tag"]
    return feed
