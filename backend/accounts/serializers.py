"""
accounts/serializers.py

All serializers for the accounts app.
- UserRegistrationSerializer: public registration (admin-only in views)
- UserSerializer: read-only user representation
- UserProfileUpdateSerializer: for PATCH /me/
- UserListSerializer: lightweight list view
"""
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import CustomUser
from core.constants import UserRole


class UserSerializer(serializers.ModelSerializer):
    """
    Full user representation. Used for /me/ and admin detail views.
    organization_name is a read-only convenience field.
    """
    organization_name = serializers.CharField(
        source="organization.name", read_only=True, default=None
    )

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "username",
            "full_name",
            "role",
            "organization",
            "organization_name",
            "avatar",
            "is_active",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "date_joined", "organization_name"]


class UserListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing users within an organization.
    Avoid exposing sensitive fields in list context.
    """
    class Meta:
        model = CustomUser
        fields = ["id", "email", "full_name", "role", "is_active"]
        read_only_fields = fields


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Used by admins to create new users within their organization.
    Password is write-only and validated against Django's AUTH_PASSWORD_VALIDATORS.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = CustomUser
        fields = [
            "email",
            "username",
            "full_name",
            "password",
            "confirm_password",
            "role",
        ]

    def validate_email(self, value: str) -> str:
        value = value.lower().strip()
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value: str) -> str:
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_role(self, value: str) -> str:
        valid_roles = [r[0] for r in UserRole.choices]
        if value not in valid_roles:
            raise serializers.ValidationError(f"Role must be one of: {', '.join(valid_roles)}.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("confirm_password"):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        try:
            validate_password(attrs["password"])
        except Exception as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        return attrs

    def create(self, validated_data: dict) -> CustomUser:
        """
        Creates a new user and assigns them to the requesting admin's organization.
        The organization is injected by the view via save(organization=...).
        """
        password = validated_data.pop("password")
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Allows users to update their own profile fields.
    Email, role, and organization are intentionally excluded — those require admin action.
    """
    class Meta:
        model = CustomUser
        fields = ["full_name", "username", "avatar"]

    def validate_username(self, value: str) -> str:
        user = self.context["request"].user
        if (
            CustomUser.objects.filter(username=value)
            .exclude(pk=user.pk)
            .exists()
        ):
            raise serializers.ValidationError("This username is already taken.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """Allows authenticated users to change their own password."""
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True)
    confirm_new_password = serializers.CharField(write_only=True, required=True)

    def validate_current_password(self, value: str) -> str:
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_new_password"]:
            raise serializers.ValidationError(
                {"confirm_new_password": "New passwords do not match."}
            )
        try:
            validate_password(attrs["new_password"], user=self.context["request"].user)
        except Exception as e:
            raise serializers.ValidationError({"new_password": list(e.messages)})
        return attrs
