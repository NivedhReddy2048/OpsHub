import pytest
from rest_framework.test import APIRequestFactory
from django.contrib.auth.models import AnonymousUser
from accounts.models import CustomUser
from accounts.permissions import IsAdmin, IsSupportAgent, IsTeamMember, IsOrganizationMember
from core.constants import UserRole
from organizations.models import Organization

@pytest.fixture
def factory():
    return APIRequestFactory()

@pytest.fixture
def organization():
    return Organization.objects.create(name="Test Org")

@pytest.fixture
def user_admin(organization):
    return CustomUser.objects.create(username="admin", email="admin@test.com", role=UserRole.ADMIN, organization=organization)

@pytest.fixture
def user_support(organization):
    return CustomUser.objects.create(username="support", email="support@test.com", role=UserRole.SUPPORT_AGENT, organization=organization)

@pytest.fixture
def user_team(organization):
    return CustomUser.objects.create(username="team", email="team@test.com", role=UserRole.TEAM_MEMBER, organization=organization)

@pytest.mark.django_db
def test_is_admin_permission(factory, user_admin, user_support, user_team):
    request = factory.get('/')
    permission = IsAdmin()

    # Anonymous
    request.user = AnonymousUser()
    assert not permission.has_permission(request, None)

    # Admin
    request.user = user_admin
    assert permission.has_permission(request, None)

    # Support
    request.user = user_support
    assert not permission.has_permission(request, None)

    # Team Member
    request.user = user_team
    assert not permission.has_permission(request, None)

@pytest.mark.django_db
def test_is_organization_member_permission(factory, organization, user_admin):
    request = factory.get('/')
    permission = IsOrganizationMember()
    
    request.user = user_admin
    assert permission.has_permission(request, None)
    
    # User without org
    user_no_org = CustomUser.objects.create(username="noorg", email="noorg@test.com", role=UserRole.TEAM_MEMBER)
    request.user = user_no_org
    assert not permission.has_permission(request, None)
