import smtplib
import ssl
import os
from dotenv import load_dotenv

load_dotenv()

HOST = os.getenv("SMTP_HOST", "smtp.office365.com").strip()
USER = os.getenv("SMTP_USER", "").strip()
PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()
FROM = os.getenv("SMTP_FROM", USER).strip()

print("=" * 60)
print("DIAGNOSTICO SMTP - MICROSOFT 365")
print("=" * 60)
print(f"HOST     : {HOST}")
print(f"USER     : {USER}")
print(f"PASSWORD : {'*' * len(PASSWORD)} ({len(PASSWORD)} chars)")
print(f"FROM     : {FROM}")
print()

print("-" * 60)
print("PRUEBA 1: Puerto 587 + STARTTLS")
print("-" * 60)

try:
    ctx = ssl.create_default_context()
    srv = smtplib.SMTP(HOST, 587, timeout=15)
    srv.set_debuglevel(1)
    srv.ehlo()
    srv.starttls(context=ctx)
    srv.ehlo()
    srv.login(USER, PASSWORD)
    srv.quit()
    print("\nOK - PRUEBA 1 EXITOSA")
except Exception as e:
    print(f"\nERROR - PRUEBA 1 FALLO: {repr(e)}")

print()
print("=" * 60)
print("FIN DEL DIAGNOSTICO")
print("=" * 60)