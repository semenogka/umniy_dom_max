from typing import Literal

from pydantic import BaseModel, Field
from pydantic_ai import Agent, PromptedOutput
from pydantic_ai.models.openai import OpenAIChatModel, OpenAIChatModelSettings
from pydantic_ai.providers.openai import OpenAIProvider

from umniy_dom_max.prompts import SYSTEM_PROMPT
from umniy_dom_max.settings import Settings

ProblemType = Literal[
    "освещение подъезда",
    "ЖКХ",
    "дороги",
    "мусор",
    "благоустройство",
    "водоснабжение",
    "отопление",
    "лифт",
    "другая",
]
Urgency = Literal["низкий", "средний", "высокий", "критичный"]
ResponsibleOrg = Literal[
    "управляющая компания",
    "администрация города",
    "водоканал",
    "электросети",
    "дорожная служба",
    "региональный оператор ТКО",
    "другая",
]


class InvalidAppeal(BaseModel):
    result: Literal["N"]


class AppealClassification(BaseModel):
    result: Literal["OK"]
    problem_type: ProblemType
    urgency: Urgency
    responsible_org: ResponsibleOrg
    deadline_days: int = Field(ge=1)
    deadline_text: str
    action_plan: str


AppealAgent = Agent[None, AppealClassification]


def create_appeal_agent(settings: Settings) -> AppealAgent:
    model = OpenAIChatModel(
        settings.gpt_model,
        provider=OpenAIProvider(
            base_url=settings.gpt_base_url,
            api_key=settings.gpt_token
        ),
    )

    return Agent(
        model,
        name="appeal_classifier",
        output_type=PromptedOutput(AppealClassification),
        instructions=SYSTEM_PROMPT,
        model_settings=OpenAIChatModelSettings(
            max_tokens=2048,
            openai_reasoning_effort="none"
        ),
        retries=2,
    )