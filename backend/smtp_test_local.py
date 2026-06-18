import smtplib
import ssl

HOST = "smtp.office365.com"
PORT = 587
USER = "soportetecnico@inamhi.gob.ec"
PASSWORD = "Tics2026@@"

try:
    context = ssl.create_default_context()

    server = smtplib.SMTP(HOST, PORT, timeout=20)
    server.set_debuglevel(1)

    server.ehlo()
    server.starttls(context=context)
    server.ehlo()

    server.login(USER, PASSWORD)

    print("OK - LOGIN SMTP EXITOSO")

    server.quit()

except Exception as e:
    print("ERROR SMTP:")
    print(repr(e))