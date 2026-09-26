"""HTML templates for email notifications."""

from urllib.parse import quote


def build_new_appeal_html(
    appeal_id: int,
    user_name: str,
    address: str,
    text: str,
    classification_problem_type: str,
    classification_org: str,
    deadline_text: str,
    action_plan: str,
    attachments: list[dict] | None = None,
) -> str:
    """HTML for new appeal notification."""
    yandex_maps_url = f"https://yandex.ru/maps/?text={quote(address)}"
    
    attachments_html = ""
    if attachments:
        items = "".join(
            f'<li style="margin: 4px 0;">📎 {att.get("filename", "файл")}</li>'
            for att in attachments
        )
        attachments_html = f"""
        <div style="margin-top: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
            <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #1a1a2e;">📎 Вложения ({len(attachments)})</h3>
            <ul style="margin: 0; padding-left: 20px; color: #495057;">
                {items}
            </ul>
        </div>
        """
    else:
        attachments_html = ""

    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f7fc; color: #1a1a2e;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 24px;">
        <tr>
            <td style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #006bf1 0%, #0057dc 100%); padding: 32px 24px; color: #fff; text-align: center;">
                    <div style="display: inline-flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 50px; margin-bottom: 16px; display: inline-block;">
                        <span style="font-size: 24px;">🏠</span>
                        <span style="font-weight: 700; font-size: 18px;">Домовой</span>
                    </div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Новое обращение создано</h1>
                    <p style="margin: 12px 0 0; opacity: 0.9;">Обращение №<strong style="font-size: 20px;">{appeal_id}</strong> — {classification_problem_type}</p>
                </div>

                <div style="padding: 32px 24px;">
                    <!-- Info card -->
                    <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; border-left: 4px solid #006bf1; margin-bottom: 24px;">
                        <div style="font-size: 12px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Житель</div>
                        <div style="font-size: 18px; font-weight: 600; color: #1a1a2e; padding-top: 4px;">{{user_name}}</div>
                        <div style="font-size: 12px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 12px; margin-bottom: 4px;">Адрес</div>
                        <div style="font-size: 16px; color: #495057;">
                            {{address}}
                            <a href="{yandex_maps_url}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; margin-left: 12px; padding: 6px 12px; background: #006bf1; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500;">
                                <span>🗺️</span> На карте
                            </a>
                        </div>
                    </div>

                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1a1a2e; font-weight: 600;">📝 Текст обращения</h3>
                    <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; border: 1px solid #e9ecef; white-space: pre-wrap; font-size: 15px; line-height: 1.6; color: #343a40;">{{text}}</div>

                    <div style="margin-top: 24px; background: #f0f4f8; border-radius: 12px; padding: 20px; border: 1px solid #d0dce6;">
                        <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #1a1a2e; font-weight: 600;">📋 Информация</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 6px 0; color: #6c757d; font-size: 13px; width: 30%;">Тип проблемы</td>
                                <td style="padding: 6px 0; color: #1a1a2e; font-weight: 500;">{{classification_problem_type}}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #6c757d; font-size: 13px;">Ответственная организация</td>
                                <td style="padding: 6px 0; color: #1a1a2e; font-weight: 500;">{{classification_org}}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #6c757d; font-size: 13px;">Срок</td>
                                <td style="padding: 6px 0; color: #1a1a2e; font-weight: 500;">{{deadline_text}}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #6c757d; font-size: 13px;">План действий</td>
                                <td style="padding: 6px 0; color: #1a1a2e; font-weight: 500;">{{action_plan}}</td>
                            </tr>
                        </table>
                    </div>

                    {attachments_html}

                    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0; color: #6c757d; font-size: 13px; text-align: center;">
                        Это автоматическое уведомление от сервиса «Домовой».<br>
                        Не отвечайте на это письмо — для ответа используйте приложение или мини-апп.
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>"""


def build_addition_html(
    appeal_id: int,
    sender: str,
    text: str,
    attachments: list[dict] | None = None,
) -> str:
    """HTML for addition to existing appeal."""
    attachments_html = ""
    if attachments:
        items = "".join(
            f'<li style="margin: 4px 0;">📎 {att.get("filename", "файл")}</li>'
            for att in attachments
        )
        attachments_html = f"""
        <div style="margin-top: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
            <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #1a1a2e;">📎 Вложения ({len(attachments)})</h3>
            <ul style="margin: 0; padding-left: 20px; color: #495057;">
                {items}
            </ul>
        </div>
        """
    else:
        attachments_html = ""

    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f7fc; color: #1a1a2e;">
    <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #006bf1 0%, #0057dc 100%); padding: 32px 24px; color: #fff; text-align: center;">
                <div style="display: inline-flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 50px; margin-bottom: 16px; display: inline-block;">
                    <span style="font-size: 24px;">✉️</span>
                    <span style="font-weight: 700; font-size: 18px;">Домовой</span>
                </div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Дополнение к обращению №{appeal_id}</h1>
                <p style="margin: 12px 0 0; opacity: 0.9;">Новое сообщение от <strong>{{sender}}</strong></p>
            </div>

            <div style="padding: 32px 24px;">
                <div style="background: #f0f4f8; border-radius: 12px; padding: 20px; border-left: 4px solid #006bf1; margin-bottom: 24px;">
                    <div style="font-size: 12px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Отправитель</div>
                    <div style="font-size: 18px; font-weight: 600; color: #1a1a2e; padding-top: 4px;">{{sender}}</div>
                </div>

                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1a1a2e; font-weight: 600;">💬 Текст сообщения</h3>
                <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; border: 1px solid #e9ecef; white-space: pre-wrap; font-size: 15px; line-height: 1.6; color: #343a40;">{{text}}</div>

                {attachments_html}

                <hr style="margin: 24px 0; border: none; border-top: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 13px; text-align: center;">
                    Это уведомление от сервиса «Домовой».<br>
                    Для ответа используйте приложение или мини-апп.
                </p>
            </div>
        </div>
    </div>
</body>
</html>"""


def new_appeal_html(
    user_name: str,
    address: str,
    text: str,
    classification_problem_type: str,
) -> str:
    """Build HTML for new appeal email."""
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f7fc; color: #1a1a2e;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 24px;">
        <tr>
            <td style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
                <div style="background: linear-gradient(135deg, #006bf1 0%, #0057dc 100%); padding: 32px 24px; color: #fff; text-align: center;">
                    <div style="display: inline-flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 50px; margin-bottom: 16px; display: inline-block;">
                        <span style="font-size: 24px;">🏠</span>
                        <span style="font-weight: 700; font-size: 18px;">Домовой</span>
                    </div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Новое обращение создано</h1>
                    <p style="margin: 12px 0 0; opacity: 0.9;">Обращение №<strong style="font-size: 20px;"></strong></p>
                </div>

                <div style="padding: 32px 24px;">
                    <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; border-left: 4px solid #006bf1; margin-bottom: 24px;">
                        <div style="font-size: 12px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Житель</div>
                        <div style="font-size: 18px; font-weight: 600; color: #1a1a2e; padding-top: 4px;">{user_name}</div>
                        <div style="font-size: 12px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 12px; margin-bottom: 4px;">Адрес</div>
                        <div style="font-size: 16px; color: #495057;">
                            {address}
                            <a href="https://yandex.ru/maps/?text={quote(address)}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; margin-left: 12px; padding: 6px 12px; background: #006bf1; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500;">
                                <span>🗺️</span> На карте
                            </a>
                        </div>
                    </div>

                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1a1a2e; font-weight: 600;">📝 Текст обращения</h3>
                    <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; border: 1px solid #e9ecef; white-space: pre-wrap; font-size: 15px; line-height: 1.6; color: #343a40;">{text}</div>

                    <div style="margin-top: 24px; background: #f0f4f8; border-radius: 12px; padding: 20px; border: 1px solid #d0dce6;">
                        <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #1a1a2e; font-weight: 600;">📋 Информация</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 6px 0; color: #6c757d; font-size: 13px; width: 30%;">Тип проблемы</td>
                                <td style="padding: 6px 0; color: #1a1a2e; font-weight: 500;">{classification_problem_type}</td>
                            </tr>
                        </table>
                    </div>

                    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0; color: #6c757d; font-size: 13px; text-align: center;">
                        Это автоматическое уведомление от сервиса «Домовой».<br>
                        Не отвечайте на это письмо — для ответа используйте приложение или мини-апп.
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>"""


def addition_html(
    appeal_id: int,
    sender: str,
    text: str,
) -> str:
    """HTML for addition to existing appeal."""
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f7fc; color: #1a1a2e;">
    <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #006bf1 0%, #0057dc 100%); padding: 32px 24px; color: #fff; text-align: center;">
                <div style="display: inline-flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 50px; margin-bottom: 16px; display: inline-block;">
                    <span style="font-size: 24px;">✉️</span>
                    <span style="font-weight: 700; font-size: 18px;">Домовой</span>
                </div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Дополнение к обращению №{appeal_id}</h1>
                <p style="margin: 12px 0 0; opacity: 0.9;">Новое сообщение от <strong>{sender}</strong></p>
            </div>

            <div style="padding: 32px 24px;">
                <div style="background: #f0f4f8; border-radius: 12px; padding: 20px; border-left: 4px solid #006bf1; margin-bottom: 24px;">
                    <div style="font-size: 12px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Отправитель</div>
                    <div style="font-size: 18px; font-weight: 600; color: #1a1a2e; padding-top: 4px;">{sender}</div>
                </div>

                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1a1a2e; font-weight: 600;">💬 Текст сообщения</h3>
                <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; border: 1px solid #e9ecef; white-space: pre-wrap; font-size: 15px; line-height: 1.6; color: #343a40;">{text}</div>

                <hr style="margin: 24px 0; border: none; border-top: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 13px; text-align: center;">
                    Это уведомление от сервиса «Домовой».<br>
                    Для ответа используйте приложение или мини-апп.
                </p>
            </div>
        </div>
    </div>
</body>
</html>"""