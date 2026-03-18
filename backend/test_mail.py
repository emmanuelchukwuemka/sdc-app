import sys
import os

# Add parent to path to import src
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from src.app import create_app
from src.models import mail
from flask_mail import Message

app = create_app()
with app.app_context():
    print("Testing email sending...")
    try:
        msg = Message(
            "SDC Test Email",
            recipients=["nwekee125@gmail.com"],
            body="If you're reading this, the SDC backend email configuration is working!"
        )
        mail.send(msg)
        print("Email sent successfully!")
    except Exception as e:
        print(f"Error sending email: {str(e)}")
