from django.contrib.auth import get_user_model
import os

User = get_user_model()

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@opshub.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@123")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "opshubadmin")

if not User.objects.filter(email=ADMIN_EMAIL).exists():
    User.objects.create_superuser(
        username=ADMIN_USERNAME,
        email=ADMIN_EMAIL,
        password=ADMIN_PASSWORD,
    )
    print("Superuser created successfully.")
else:
    print("Superuser already exists.")