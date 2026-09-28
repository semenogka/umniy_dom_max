from typing import Literal

from pydantic import BaseModel, Field
from pydantic_ai import Agent, PromptedOutput
from pydantic_ai.models.openai import OpenAIChatModel, OpenAIChatModelSettings
from pydantic_ai.providers.openai import OpenAIProvider

from umniy_dom_max.prompts import SYSTEM_PROMPT, CLASSIFCATE_PROMPT
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


class ClassificationAnswer(BaseModel):
    result: Literal["N", "dop", "checked"]


class AppealClassification(BaseModel):
    # N — текст не является обращением
    result: Literal["OK", "N"]
    problem_type: ProblemType
    urgency: Urgency
    responsible_org: ResponsibleOrg
    deadline_days: int = Field(ge=1)
    deadline_text: str
    action_plan: str


AppealAgent = Agent[None, AppealClassification]
AnswerAgent = Agent[None, ClassificationAnswer]


def _create_agent(settings: Settings, name: str, output_type, instructions: str) -> Agent:
    model = OpenAIChatModel(
        settings.gpt_model,
        provider=OpenAIProvider(base_url=settings.gpt_base_url, api_key=settings.gpt_token),
    )
    return Agent(
        model,
        name=name,
        output_type=PromptedOutput(output_type),
        instructions=instructions,
        model_settings=OpenAIChatModelSettings(max_tokens=2048, openai_reasoning_effort="none"),
        retries=2,
    )


def create_appeal_agent(settings: Settings) -> AppealAgent:
    return _create_agent(settings, "appeal_classifier", AppealClassification, SYSTEM_PROMPT)


def create_answer_agent(settings: Settings) -> AnswerAgent:
    return _create_agent(settings, "answer_classifier", ClassificationAnswer, CLASSIFCATE_PROMPT)
