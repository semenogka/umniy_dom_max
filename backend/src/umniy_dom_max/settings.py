from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    debug: bool = True
    enable_cors: bool = True
    log_level: str = "INFO"
    host: str = "0.0.0.0"
    port: int = 8000

    database_url: str = "postgresql://postgres:postgres@localhost:5432/postgres"

    gpt_token: str = ""
    gpt_base_url: str = "https://freellmapi.stirk1337.ru/v1"
    gpt_model: str = "auto:fast"

    max_token: str = ""
    max_api_url: str = "https://platform-api2.max.ru"

    mail_host: str = "mail.domovoy.stirkk.ru"
    mail_user: str = "appeals@domovoy.stirkk.ru"
    mail_password: str = "lBe3MeL0XUTyhoD38x3jlVvjO4Aso9m"
