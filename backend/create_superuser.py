import os
import django

# Setup Django if not already configured (supports standalone execution)
if not os.getenv("DJANGO_SETTINGS_MODULE"):
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

try:
    django.setup()
except RuntimeError:
    # Django settings might already be configured if run within manage.py shell
    pass

from django.contrib.auth import get_user_model
from core.constants import UserRole
from organizations.models import Organization
from tasks.models import Project

User = get_user_model()

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@opshub.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@123")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "opshubadmin")

# 1. Idempotently resolve Organization
org, org_created = Organization.objects.get_or_create(
    slug="default-organization",
    defaults={
        "name": "Default Organization",
        "description": "Default organization automatically bootstrapped by OpsHub.",
        "is_active": True,
    }
)
if org_created:
    print(f"[BOOTSTRAP] Organization created: {org.name} (ID: {org.id})")
else:
    print(f"[BOOTSTRAP] Organization already exists: {org.name} (ID: {org.id})")

# 2. Idempotently resolve Superuser
user = User.objects.filter(email=ADMIN_EMAIL).first()
user_created = False

if not user:
    user = User.objects.create_superuser(
        username=ADMIN_USERNAME,
        email=ADMIN_EMAIL,
        password=ADMIN_PASSWORD,
    )
    user_created = True
    print(f"[BOOTSTRAP] Superuser created: {ADMIN_EMAIL}")
else:
    print(f"[BOOTSTRAP] Superuser already exists: {ADMIN_EMAIL}")

# Link user to Organization and update role/staff/superuser properties
updated = False
if not user.organization or user.organization != org:
    user.organization = org
    updated = True
    print(f"[BOOTSTRAP] Membership linked: {ADMIN_EMAIL} linked to organization {org.name}")

if user.role != UserRole.ADMIN:
    user.role = UserRole.ADMIN
    updated = True
    print(f"[BOOTSTRAP] Role assigned: {ADMIN_EMAIL} assigned role {UserRole.ADMIN.upper()}")

if not user.is_superuser:
    user.is_superuser = True
    updated = True

if not user.is_staff:
    user.is_staff = True
    updated = True

if updated or user_created:
    user.save()
    print("[BOOTSTRAP] Superuser profiles/properties saved successfully.")

# 3. Idempotently resolve Workspace (Project)
project, proj_created = Project.objects.get_or_create(
    organization=org,
    slug="default-workspace",
    defaults={
        "name": "Default Workspace",
        "description": "Default workspace project linked to organization.",
        "created_by": user,
        "is_active": True,
    }
)
if proj_created:
    print(f"[BOOTSTRAP] Workspace linked/created: {project.name} (ID: {project.id})")
else:
    print(f"[BOOTSTRAP] Workspace already linked/exists: {project.name} (ID: {project.id})")

print("[BOOTSTRAP] Database bootstrap successfully complete!")