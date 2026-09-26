import base64
import smtplib
import imaplib
import email
from email.message import EmailMessage
from email.policy import default


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
    ) -> str:
        msg = EmailMessage()
        msg["From"] = self.user
        msg["To"] = to
        msg["Subject"] = subject
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

    # возвращает непрочитанные письма и помечает их прочитанными
    def read(self) -> list[EmailMessage]:
        with imaplib.IMAP4_SSL(self.host) as imap:
            imap.login(self.user, self.password)
            imap.select("INBOX")
            _, data = imap.search(None, "UNSEEN")
            messages = []
            for num in data[0].split():
                _, raw = imap.fetch(num, "(RFC822)")
                messages.append(email.message_from_bytes(raw[0][1], policy=default))
            return messages