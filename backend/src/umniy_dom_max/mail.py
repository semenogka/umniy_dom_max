import base64
import email
import html as html_mod
import imaplib
import re
import smtplib
from email.message import EmailMessage
from email.policy import default
from email.utils import formatdate, make_msgid

# IMAP-метка «обработано ботом»: не зависит от \Seen, который ставит человек, открыв письмо в Roundcube
PROCESSED = "$Domovoy"


class Mail:
    def __init__(self, host: str, user: str, password: str):
        self.host = host
        self.user = user
        self.password = password

    def send(
        self,
        to: str,
        subject: str,
        text: str,
        attachments: list[dict] | None = None,
        html: str | None = None,
        headers: dict[str, str] | None = None,
    ) -> str:
        msg = EmailMessage()
        msg["From"] = self.user
        msg["To"] = to
        msg["Subject"] = subject
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain=self.user.rpartition("@")[2] or None)
        for name, value in (headers or {}).items():
            msg[name] = value
        msg.set_content(text)

        if html:
            msg.add_alternative(html, subtype="html")

        if attachments:
            for att in attachments:
                b64 = att["data"]
                if "," in b64:
                    b64 = b64.split(",", 1)[1]
                data = base64.b64decode(b64)
                msg.add_attachment(
                    data,
                    maintype=att["mime"].split("/")[0],
                    subtype=att["mime"].split("/")[1],
                    filename=att.get("filename", "file"),
                )

        with smtplib.SMTP_SSL(self.host, 465) as smtp:
            smtp.login(self.user, self.password)
            smtp.send_message(msg)
        return msg["Message-ID"]

    # возвращает письма без метки PROCESSED с UID, ничего не помечая (BODY.PEEK)
    def read(self) -> list[tuple[bytes, EmailMessage]]:
        with imaplib.IMAP4_SSL(self.host) as imap:
            imap.login(self.user, self.password)
            imap.select("INBOX")
            _, data = imap.uid("search", None, "UNKEYWORD", PROCESSED)
            messages = []
            for uid in data[0].split():
                _, raw = imap.uid("fetch", uid, "(BODY.PEEK[])")
                messages.append((uid, email.message_from_bytes(raw[0][1], policy=default)))
            return messages

    def mark_processed(self, uids: list[bytes]) -> None:
        if not uids:
            return
        with imaplib.IMAP4_SSL(self.host) as imap:
            imap.login(self.user, self.password)
            imap.select("INBOX")
            imap.uid("store", b",".join(uids), "+FLAGS", f"(\\Seen {PROCESSED})")

    def init_processed(self) -> None:
        """Первый запуск с меткой: всё уже прочитанное считаем обработанным,
        иначе бот заново разберёт старые письма."""
        with imaplib.IMAP4_SSL(self.host) as imap:
            imap.login(self.user, self.password)
            imap.select("INBOX")
            if imap.uid("search", None, "KEYWORD", PROCESSED)[1][0]:
                return
            uids = imap.uid("search", None, "SEEN")[1][0].split()
            if uids:
                imap.uid("store", b",".join(uids), "+FLAGS", f"({PROCESSED})")

    def html_to_text(self, html: str) -> str:
        # убираем <script>/<style> вместе с содержимым
        html = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html, flags=re.S | re.I)
        # <br>, </p> → перевод строки
        html = re.sub(r"<br\s*/?>", "\n", html, flags=re.I)
        html = re.sub(r"</p>", "\n\n", html, flags=re.I)
        # снимаем все остальные теги
        html = re.sub(r"<[^>]+>", "", html)
        html = html_mod.unescape(html)
        # нормализуем пустые строки
        html = re.sub(r"\n{3,}", "\n\n", html)
        return html.strip()

    def get_body(self, msg: EmailMessage) -> str:
        """Возвращает текст письма: plain, либо HTML, очищенный от тегов."""
        text = None
        html = None

        if msg.is_multipart():
            for part in msg.walk():
                # пропускаем контейнеры и вложения
                if part.get_content_maintype() == "multipart":
                    continue
                if part.get_filename():
                    continue

                ctype = part.get_content_type()
                charset = part.get_content_charset() or "utf-8"
                payload = part.get_payload(decode=True)
                if payload is None:
                    continue
                body = payload.decode(charset, errors="replace")

                if ctype == "text/plain" and text is None:
                    text = body
                elif ctype == "text/html" and html is None:
                    html = body
        else:
            charset = msg.get_content_charset() or "utf-8"
            payload = msg.get_payload(decode=True)
            body = payload.decode(charset, errors="replace") if payload else ""
            if msg.get_content_type() == "text/html":
                html = body
            else:
                text = body

        # приоритет: plain → если нет, то HTML без тегов
        if text:
            return text
        if html:
            return self.html_to_text(html)
        return ""
