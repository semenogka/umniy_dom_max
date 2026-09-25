import email
import imaplib
import smtplib
from email.message import EmailMessage
from email.policy import default


class Mail:
    def __init__(self, host: str, user: str, password: str):
        self.host = host
        self.user = user
        self.password = password

    def send(self, to: str, subject: str, text: str) -> None:
        msg = EmailMessage()
        msg["From"] = self.user
        msg["To"] = to
        msg["Subject"] = subject
        msg.set_content(text)
        with smtplib.SMTP_SSL(self.host, 465) as smtp:
            smtp.login(self.user, self.password)
            smtp.send_message(msg)

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
