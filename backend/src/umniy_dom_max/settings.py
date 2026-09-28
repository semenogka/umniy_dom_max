from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    debug: bool = True
    enable_cors: bool = True
    log_level: str = "INFO"
    host: str = "0.0.0.0"
    port: int = 8000
    # Префикс, под которым API смонтирован за reverse proxy (на проде nginx срезает /api)
    root_path: str = ""

    database_url: str = "postgresql://postgres:postgres@localhost:5432/postgres"

    gpt_token: str = ""
    gpt_base_url: str = "https://freellmapi.stirk1337.ru/v1"
    gpt_model: str = "auto:fast"

    max_token: str = ""
    max_api_url: str = "https://platform-api2.max.ru"

    mail_host: str = "mail.domovoy.stirkk.ru"
    mail_user: str = "appeals@domovoy.stirkk.ru"
    mail_password: str = ""
    # Куда уходят письма с обращениями
    mail_to: str = "akuninsemen79@gmail.com"
    # Демо: письма уходят в собственный ящик, а за УК отвечает LLM через 5–10 с
    uk_autoreply: bool = False

    @property
    def appeal_recipient(self) -> str:
        return self.mail_user if self.uk_autoreply else self.mail_to
