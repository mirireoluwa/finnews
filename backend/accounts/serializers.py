from __future__ import annotations

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import UserProfile, default_preferences, default_watchlist
from .password_rules import password_meets_all_requirements


def user_to_client_dict(user: User) -> dict:
  p: UserProfile = user.app_profile
  name = (user.first_name or "").strip() or user.email.split("@", 1)[0]
  prefs = {**default_preferences(), **(p.preferences or {})}
  wl = p.watchlist if isinstance(p.watchlist, list) else default_watchlist()
  tags = p.company_tags if isinstance(p.company_tags, dict) else {}
  return {
    "name": name,
    "email": user.email,
    "phone": p.phone or "",
    "avatarDataUrl": p.avatar_data_url or None,
    "preferences": prefs,
    "onboardingCompleted": p.onboarding_completed,
    "watchlist": wl,
    "companyTags": tags,
  }


class RegisterSerializer(serializers.Serializer):
  email = serializers.EmailField()
  password = serializers.CharField(write_only=True, min_length=8)
  name = serializers.CharField(max_length=150)
  phone = serializers.CharField(max_length=64, allow_blank=True, required=False, default="")

  def validate_email(self, value: str) -> str:
    normalized = value.strip().lower()
    if User.objects.filter(username=normalized).exists():
      raise serializers.ValidationError("An account with this email already exists.")
    return normalized

  def validate_password(self, value: str) -> str:
    if not password_meets_all_requirements(value):
      raise serializers.ValidationError(
        "Password must include upper, lower, number, and a special character."
      )
    return value

  def create(self, validated_data: dict) -> User:
    email = validated_data["email"]
    password = validated_data["password"]
    name = validated_data["name"].strip()
    phone = (validated_data.get("phone") or "").strip()
    user = User.objects.create_user(
      username=email,
      email=email,
      password=password,
      first_name=name[:150],
    )
    profile = user.app_profile
    profile.phone = phone
    profile.onboarding_completed = False
    profile.save()
    return user


class LoginSerializer(serializers.Serializer):
  email = serializers.EmailField()
  password = serializers.CharField(write_only=True)

  def validate(self, attrs: dict) -> dict:
    email = attrs["email"].strip().lower()
    password = attrs["password"]
    user = authenticate(username=email, password=password)
    if not user:
      raise serializers.ValidationError("Invalid email or password.")
    attrs["user"] = user
    return attrs


class ProfileUpdateSerializer(serializers.Serializer):
  name = serializers.CharField(required=False, max_length=150, allow_blank=True)
  phone = serializers.CharField(required=False, max_length=64, allow_blank=True)
  avatarDataUrl = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  preferences = serializers.JSONField(required=False)
  watchlist = serializers.ListField(child=serializers.CharField(), required=False)
  companyTags = serializers.JSONField(required=False)
  onboardingCompleted = serializers.BooleanField(required=False)
