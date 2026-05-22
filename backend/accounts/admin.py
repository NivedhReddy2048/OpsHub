from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ["email", "username", "full_name", "role", "organization", "is_active", "date_joined"]
    list_filter = ["role", "is_active", "organization"]
    search_fields = ["email", "username", "full_name"]
    ordering = ["-date_joined"]

    fieldsets = UserAdmin.fieldsets + (
        ("OpsHub Fields", {"fields": ("full_name", "role", "organization", "avatar")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("OpsHub Fields", {"fields": ("email", "full_name", "role")}),
    )
