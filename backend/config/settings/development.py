"""
Development settings — uses SQLite, debug mode, permissive CORS.
"""
from .base import *  # noqa

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]

# SQLite for local development (no PostgreSQL required)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Allow all CORS origins in development
CORS_ALLOW_ALL_ORIGINS = True

# Django Debug Toolbar (optional — install separately if needed)
# INSTALLED_APPS += ["debug_toolbar"]

# Email backend (console for dev)
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Celery — use synchronous task execution in dev (no Redis required)
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
