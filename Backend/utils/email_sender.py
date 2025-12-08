"""
Filename: email_sender.py
Author: Aubin Mugisha & Copilot

Email utility for sending verification codes to users during registration.
currently Printing codes to console as email is not yet configured.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import configparser

config = configparser.ConfigParser()
config.read("config.ini")

SMTP_SERVER = config.get("Email", "smtp_server", fallback="smtp.gmail.com")
SMTP_PORT = config.getint("Email", "smtp_port", fallback=587)
SENDER_EMAIL = config.get("Email", "sender_email", fallback="")
SENDER_PASSWORD = config.get("Email", "sender_password", fallback="")
APP_NAME = "CollabConnect"


def _send_email(recipient_email: str, subject: str, html_body: str, text_body: str | None = None) -> bool:
    """
    Internal helper to send an email.

    Returns:
        bool: True if email sent successfully (or email disabled),
              False if there was a sending error.
    """
    # If email is not configured, return False so caller can handle it
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        return False

    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = SENDER_EMAIL
        message["To"] = recipient_email

        if text_body:
            part_text = MIMEText(text_body, "plain")
            message.attach(part_text)

        part_html = MIMEText(html_body, "html")
        message.attach(part_html)

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, recipient_email, message.as_string())

        return True

    except Exception as e:
        print(f"Error sending email to {recipient_email}: {e}")
        return False


def send_verification_email(recipient_email: str, verification_code: str) -> bool:
    """
    Send verification code email to user.

    Prints the code to the console if email is not configured.

    Returns:
        bool: True if email sent (or printed for dev), False on error.
    """
    subject = f"{APP_NAME} - Verify Your Email"

    text_body = (
        f"Welcome to {APP_NAME}!\n\n"
        f"Your verification code is: {verification_code}\n\n"
        "This code will expire in 15 minutes.\n\n"
        f"If you didn't create an account with {APP_NAME}, please ignore this email."
    )

    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
          <h1 style="color: #4caf50; text-align: center;">Welcome to {APP_NAME}!</h1>
          <p style="font-size: 16px; color: #333;">
            Please verify your email address to complete registration.
          </p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center; margin: 30px 0;">
            <p style="font-size: 14px; color: #666;">Your verification code:</p>
            <h2 style="font-size: 36px; color: #4caf50; letter-spacing: 5px;">
              {verification_code}
            </h2>
          </div>
          <p style="font-size: 14px; color: #666;">This code expires in 15 minutes.</p>
          <p style="font-size: 12px; color: #999; margin-top: 20px;">
            If you did not create an account with {APP_NAME}, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
    """

    # If email is not configured, print the code and still return True
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        print("WARNING: Email credentials not configured in config.ini")
        print(f"Verification code for {recipient_email}: {verification_code}")
        return True

    ok = _send_email(recipient_email, subject, html_body, text_body)
    if not ok:
        # For registration flow, you may choose to still allow signup even if email fails.
        print(f"Verification code for {recipient_email}: {verification_code}")
    return ok


def send_welcome_email(recipient_email: str, user_name: str | None = None) -> bool:
    """
    Send welcome email after successful verification.

    Args:
        recipient_email: Email address to send to.
        user_name: Optional user name for personalization.

    Returns:
        bool: True if email sent (or skipped because email is disabled),
              False if there was an error while sending.
    """
    subject = f"Welcome to {APP_NAME}!"

    greeting_name = user_name or "there"

    text_body = (
        f"Hi {greeting_name},\n\n"
        f"Your email has been successfully verified. You can now log in to {APP_NAME}.\n\n"
        "Happy collaborating!\n"
    )

    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px;">
          <h1 style="color: #4caf50;">Account Verified!</h1>
          <p style="font-size: 16px; color: #333;">
            Hi {greeting_name},
          </p>
          <p style="font-size: 14px; color: #333;">
            Your email has been successfully verified. You can now log in to <strong>{APP_NAME}</strong>
            and start exploring collaborations.
          </p>
          <p style="font-size: 14px; color: #555; margin-top: 20px;">
            Thank you for joining {APP_NAME}!
          </p>
        </div>
      </body>
    </html>
    """

    return _send_email(recipient_email, subject, html_body, text_body)
