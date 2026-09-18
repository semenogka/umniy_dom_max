import os
import aiohttp
from dotenv import load_dotenv

load_dotenv()

API_BASE_URL ="https://freellmapi.stirk1337.ru/v1/chat/completions"

SYSTEM_PROMPT = """Ты — классификатор обращений жителей.

Задача: по тексту обращения определи и верни ТОЛЬКО валидный JSON без markdown и пояснений.

Житель сообщает проблему — система сама определяет ответственного, объясняет порядок действий и сопровождает решение до результата. Житель не должен думать: куда обращаться, кто отвечает, как составить обращение, в какие сроки ответят.

Верни JSON со строгой схемой:
{
  "problem_type": "тип проблемы: освещение подъезда | ЖКХ | дороги | мусор | благоустройство | водоснабжение | отопление | лифт | другая",
  "urgency": "низкий | средний | высокий | критичный",
  "responsible_org": "ответственная организация: управляющая компания | администрация города | водоканал | электросети | дорожная служба | региональный оператор ТКО | другая",
  "deadline_days": число,
  "deadline_text": "Срок устранения: до X дней",
  "action_plan": "краткий порядок действий 1-2 шага"
}

Правила:
- urgency: критичный = угроза жизни/здоровью, высокий = нет света/воды/тепла, средний = мусор/ямы, низкий = косметика
- deadline_days: критичный 1, высокий 3, средний 7, низкий 14 (если иное не по нормативу)
- Отвечай только JSON, без ```json
"""

class GPTClientError(Exception):
    pass

class RateLimitError(GPTClientError):
    """Ошибка превышения лимита запросов (429)."""

class GPTClient:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key
        if not self.api_key:
            raise RuntimeError("GPT_API_KEY / OPENAI_API_KEY не найден в backend/.env")
        self.last_model: str | None = None

    async def llm_request(
        self,
        prompt: list[dict],
        temperature: float = 1.0,
        max_tokens: int = 2048,
        top_p: float = 1.0,
        model: str = "auto:fast",
    ) -> str:
        payload = {
            "model": model,
            "messages": prompt,
            "temperature": temperature,
            "max_completion_tokens": max_tokens,
            "top_p": top_p,
            "stream": False,
            "reasoning_effort": "none",
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(API_BASE_URL, json=payload, headers=headers) as resp:
                text = await resp.text()
                if resp.status != 200:
                    if resp.status in [429, 413, 404]:
                        raise RateLimitError(f"API rate limit exceeded ({resp.status}): {text}")
                    raise GPTClientError(f"API error {resp.status}: {text}")
                data = await resp.json() if resp.content_type == "application/json" else {"choices": [{"message": {"content": text}}]}
                try:
                    content = data["choices"][0]["message"]["content"]
                    self.last_model = data.get("model")
                    return content or ""
                except (KeyError, IndexError):
                    return text

    async def close(self):
        await self.session.close()

# пример без чанков:
# from gpt_client import GPTClient
# client = GPTClient()
# text = await client.chat_completion([{"role":"user","content":"привет"}])
# print(text)
# await client.close()
