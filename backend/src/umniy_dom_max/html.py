"""HTML templates for email notifications.

Visual language follows design/DESIGN.md (Домовой design system):
semantic color tokens, Golos Text, radius/spacing scale.
"""

from html import escape
from urllib.parse import quote

FONT_STACK = (
    "'Golos Text', -apple-system, BlinkMacSystemFont, "
    "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
)

# Семантические токены (design/DESIGN.md → «Семантические цвета»)
BG_BACKDROP = "#e2eeff"       # bg/backdrop
SURFACE = "#ffffff"           # bg/surface
BG_SUBTLE = "#f0f4f9"         # bg/subtle
FG = "#192a3f"                # text/primary
MUTED = "#6d7c8f"             # text/secondary
ACCENT = "#006bf1"            # bg/accent
ACCENT_STRONG = "#0047af"     # text/accent-strong
ACCENT_MUTED = "#d7e7fe"      # bg/accent-muted
ON_ACCENT = "#ffffff"         # text/on-accent
BORDER = "#dce3ec"            # border/default
BORDER_ACCENT_SUBTLE = "#a6c1ea"  # border/accent-subtle


def _esc(value: str | None) -> str:
    return escape(str(value or ""), quote=True)


def _initial(name: str | None) -> str:
    name = (name or "").strip()
    return _esc(name[0].upper()) if name else "Д"


def _avatar(name: str) -> str:
    return f"""<td width="42" style="width: 42px; padding-right: 12px; vertical-align: top;">
        <div style="width: 42px; height: 42px; border-radius: 999px; background: {ACCENT_MUTED}; color: {ACCENT_STRONG}; font-family: {FONT_STACK}; font-size: 16px; font-weight: 700; text-align: center; line-height: 42px;">{_initial(name)}</div>
    </td>"""


def _preheader(text: str) -> str:
    return f"""<div style="display: none; max-height: 0; overflow: hidden; opacity: 0; font-size: 1px; line-height: 1px; color: {BG_BACKDROP};">{_esc(text)}</div>"""


# Logo/Mark из design/domovoy-mini-app-v2.html (.brand-mark svg), растрирован в PNG:
# Gmail и часть других клиентов вырезают инлайновый <svg> из писем, поэтому логотип
# встраивается как base64 PNG @2x (32px на экране, 64px исходник) — надёжнее для почты.
_LOGO_MARK_PNG_B64 = (
    "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"
    "teV4uar5H6WDS4SJ6iL0AAAAAElFTkSuQmCC"
)


def _logo_img(size: int = 32) -> str:
    return (
        f'<img src="data:image/png;base64,{_LOGO_MARK_PNG_B64}" width="{size}" '
        f'height="{size}" alt="" style="display: block; border: 0; outline: none; '
        f'width: {size}px; height: {size}px;">'
    )


def _brand_row() -> str:
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" align="center" style="max-width: 600px; margin: 0 auto;">
        <tr>
            <td style="padding: 8px 8px 16px; text-align: left;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                        <td width="32" style="width: 32px; padding-right: 10px; line-height: 0;">{_logo_img(32)}</td>
                        <td style="font-family: {FONT_STACK}; font-size: 16px; font-weight: 800; letter-spacing: -0.3px; color: {FG};">Домовой</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>"""


def _section_label(text: str) -> str:
    return f"""<div style="font-family: {FONT_STACK}; font-size: 12px; font-weight: 600; letter-spacing: 0.3px; text-transform: uppercase; color: {MUTED}; margin-bottom: 6px;">{_esc(text)}</div>"""


def _text_box(text: str) -> str:
    return f"""<div style="background: {BG_SUBTLE}; border: 1px solid {BORDER}; border-radius: 14px; padding: 16px 18px; font-family: {FONT_STACK}; font-size: 15px; line-height: 1.4; color: {FG}; white-space: pre-wrap;">{_esc(text)}</div>"""


def _attachments_block(attachments: list[dict] | None) -> str:
    if not attachments:
        return ""
    rows = "".join(
        f"""<tr>
            <td style="padding: 8px 0; border-top: 1px solid {BORDER}; font-family: {FONT_STACK}; font-size: 14px; color: {FG};">
                📎 {_esc(att.get('filename', 'файл'))}
            </td>
        </tr>"""
        for att in attachments
    )
    return f"""<div style="margin-top: 20px;">
        {_section_label(f"Вложения ({len(attachments)})")}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: {BG_SUBTLE}; border: 1px solid {BORDER}; border-radius: 14px; padding: 4px 16px;">
            {rows}
        </table>
    </div>"""


def _shell(preheader: str, card_inner: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
    <title></title>
    <style>@import url('https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;600;700;800&display=swap');</style>
    <!--[if mso]>
    <style>
        * {{ font-family: Arial, sans-serif !important; }}
        table {{ border-collapse: collapse; }}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background: {BG_BACKDROP}; font-family: {FONT_STACK}; color: {FG}; -webkit-text-size-adjust: 100%; text-size-adjust: 100%;">
    {_preheader(preheader)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="{BG_BACKDROP}" style="background: {BG_BACKDROP}; mso-line-height-rule: exactly;">
        <tr>
            <td style="padding: 24px 16px;">
                {_brand_row()}
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" align="center" bgcolor="{SURFACE}" style="max-width: 600px; margin: 0 auto; background: {SURFACE}; border: 1px solid {BORDER}; border-radius: 16px;">
                    <tr>
                        <td style="padding: 28px 24px;">
                            {card_inner}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""


def new_appeal_html(
    user_name: str,
    address: str,
    text: str,
    classification_problem_type: str,
    classification_org: str,
    deadline_text: str,
    action_plan: str,
    attachments: list[dict] | None = None,
) -> str:
    """HTML for new appeal notification.

    Called before the appeal row exists (id is assigned on insert
    right after the mail is sent), so there is no appeal number to show yet.
    """
    yandex_maps_url = f"https://yandex.ru/maps/?text={quote(address)}"

    info_rows = [
        ("Тип проблемы", classification_problem_type),
        ("Ответственная организация", classification_org),
        ("Срок", deadline_text),
        ("План действий", action_plan),
    ]
    info_html = "".join(
        f"""<tr>
            <td style="padding: 8px 0; border-top: 1px solid {BORDER}; font-family: {FONT_STACK}; font-size: 13px; color: {MUTED}; width: 42%; vertical-align: top;">{_esc(label)}</td>
            <td style="padding: 8px 0; border-top: 1px solid {BORDER}; font-family: {FONT_STACK}; font-size: 14px; font-weight: 600; color: {FG}; vertical-align: top;">{_esc(value)}</td>
        </tr>"""
        for label, value in info_rows
    )

    header = f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
        <tr>
            <td style="font-family: {FONT_STACK}; font-size: 20px; font-weight: 700; color: {FG};">Новое обращение</td>
            <td align="right">
                <span style="display: inline-block; background: {ACCENT_MUTED}; color: {ACCENT_STRONG}; font-family: {FONT_STACK}; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 999px; white-space: nowrap;">{_esc(classification_problem_type)}</span>
            </td>
        </tr>
    </table>"""

    resident_card = f"""<div style="background: {BG_SUBTLE}; border: 1px solid {BORDER}; border-radius: 14px; padding: 16px 18px; margin-bottom: 20px;">
        {_section_label("Житель")}
        <div style="font-family: {FONT_STACK}; font-size: 16px; font-weight: 700; color: {FG}; margin-bottom: 12px;">{_esc(user_name)}</div>
        {_section_label("Адрес")}
        <table role="presentation" cellspacing="0" cellpadding="0">
            <tr>
                <td style="font-family: {FONT_STACK}; font-size: 14px; color: {FG}; padding-right: 10px;">{_esc(address)}</td>
                <td>
                    <a href="{yandex_maps_url}" target="_blank" style="display: inline-block; font-family: {FONT_STACK}; font-size: 12px; font-weight: 600; color: {ON_ACCENT}; background: {ACCENT}; text-decoration: none; padding: 5px 12px; border-radius: 999px;">На карте</a>
                </td>
            </tr>
        </table>
    </div>"""

    body = f"""{_section_label("Текст обращения")}
    <div style="margin-bottom: 20px;">{_text_box(text)}</div>
    {_section_label("Информация")}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">{info_html}</table>
    {_attachments_block(attachments)}"""

    return _shell(
        f"{classification_problem_type} — {address}",
        header + resident_card + body,
    )


def addition_html(
    appeal_id: int,
    sender: str,
    text: str,
    attachments: list[dict] | None = None,
) -> str:
    """HTML for addition to existing appeal."""
    header = f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
        <tr>
            <td style="font-family: {FONT_STACK}; font-size: 20px; font-weight: 700; color: {FG};">Дополнение к обращению</td>
        </tr>
        <tr>
            <td style="font-family: {FONT_STACK}; font-size: 13px; color: {MUTED}; font-variant-numeric: tabular-nums; padding-top: 4px;">Обращение №{appeal_id}</td>
        </tr>
    </table>"""

    sender_row = f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: {BG_SUBTLE}; border: 1px solid {BORDER}; border-radius: 14px; padding: 14px 16px; margin-bottom: 20px;">
        <tr>
            {_avatar(sender)}
            <td style="vertical-align: middle;">
                {_section_label("Отправитель")}
                <div style="font-family: {FONT_STACK}; font-size: 16px; font-weight: 700; color: {FG};">{_esc(sender)}</div>
            </td>
        </tr>
    </table>"""

    body = f"""{_section_label("Текст сообщения")}
    <div style="margin-bottom: 20px;">{_text_box(text)}</div>
    {_attachments_block(attachments)}"""

    return _shell(
        f"Дополнение №{appeal_id} от {sender}",
        header + sender_row + body,
    )
