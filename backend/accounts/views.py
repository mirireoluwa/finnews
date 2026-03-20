from __future__ import annotations

from typing import Any

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserProfile, default_preferences
from .serializers import (
  LoginSerializer,
  ProfileUpdateSerializer,
  RegisterSerializer,
  user_to_client_dict,
)


class RegisterView(APIView):
  permission_classes = [AllowAny]

  def post(self, request, *args: Any, **kwargs: Any) -> Response:
    ser = RegisterSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    user: User = ser.save()
    token, _created = Token.objects.get_or_create(user=user)
    return Response(
      {"token": token.key, "user": user_to_client_dict(user)},
      status=status.HTTP_201_CREATED,
    )


class LoginView(APIView):
  permission_classes = [AllowAny]

  def post(self, request, *args: Any, **kwargs: Any) -> Response:
    ser = LoginSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    user: User = ser.validated_data["user"]
    token, _created = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": user_to_client_dict(user)})


class LogoutView(APIView):
  permission_classes = [IsAuthenticated]

  def post(self, request, *args: Any, **kwargs: Any) -> Response:
    Token.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
  permission_classes = [IsAuthenticated]

  def get(self, request, *args: Any, **kwargs: Any) -> Response:
    return Response(user_to_client_dict(request.user))

  def patch(self, request, *args: Any, **kwargs: Any) -> Response:
    ser = ProfileUpdateSerializer(data=request.data, partial=True)
    ser.is_valid(raise_exception=True)
    data = ser.validated_data
    user: User = request.user
    profile: UserProfile = user.app_profile

    if "name" in data:
      user.first_name = (data["name"] or "").strip()[:150]
      user.save(update_fields=["first_name"])
    if "phone" in data:
      profile.phone = (data["phone"] or "").strip()[:64]
    if "avatarDataUrl" in data:
      v = data["avatarDataUrl"]
      if v is None:
        profile.avatar_data_url = ""
      else:
        profile.avatar_data_url = str(v) if v else ""
    if "preferences" in data and isinstance(data["preferences"], dict):
      profile.preferences = {**default_preferences(), **profile.preferences, **data["preferences"]}
    if "watchlist" in data and isinstance(data["watchlist"], list):
      profile.watchlist = [str(x).strip() for x in data["watchlist"] if str(x).strip()]
    if "companyTags" in data and isinstance(data["companyTags"], dict):
      profile.company_tags = data["companyTags"]
    if "onboardingCompleted" in data:
      profile.onboarding_completed = bool(data["onboardingCompleted"])

    profile.save()
    user.refresh_from_db()
    return Response(user_to_client_dict(user))
