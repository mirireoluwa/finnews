from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urlencode

from django.conf import settings as django_settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.decorators import method_decorator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserProfile, default_preferences
from .serializers import (
  LoginSerializer,
  PasswordResetConfirmSerializer,
  PasswordResetRequestSerializer,
  ProfileUpdateSerializer,
  RegisterSerializer,
  user_to_client_dict,
)

logger = logging.getLogger(__name__)


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


@method_decorator(csrf_exempt, name="dispatch")
class PasswordResetRequestView(APIView):
  """POST { email } — sends reset link if user exists (same response either way)."""

  permission_classes = [AllowAny]
  authentication_classes = []

  def post(self, request, *args: Any, **kwargs: Any) -> Response:
    ser = PasswordResetRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    email = ser.validated_data["email"]
    user = User.objects.filter(username=email).first()
    if not user:
      user = User.objects.filter(email__iexact=email).first()

    if user:
      front = (getattr(django_settings, "FRONTEND_URL", None) or "").strip().rstrip("/")
      if not front:
        logger.warning(
          "Password reset for %s skipped: set FRONTEND_URL (e.g. https://fin-news.xyz).",
          email,
        )
      else:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        tok = default_token_generator.make_token(user)
        reset_url = f"{front}/?{urlencode({'reset': '1', 'uid': uid, 'token': tok})}"
        subject = "Reset your FinNews password"
        body = (
          f"Hi,\n\n"
          f"Open this link to choose a new password for your FinNews account:\n\n"
          f"{reset_url}\n\n"
          f"If you did not ask for this, you can ignore this email.\n"
        )
        try:
          send_mail(
            subject,
            body,
            django_settings.DEFAULT_FROM_EMAIL,
            [user.email or email],
            fail_silently=False,
          )
        except Exception:
          logger.exception("send_mail failed for password reset user_id=%s", user.pk)

    return Response(
      {
        "detail": "If an account exists for that email, we sent password reset instructions.",
      },
      status=status.HTTP_200_OK,
    )


@method_decorator(csrf_exempt, name="dispatch")
class PasswordResetConfirmView(APIView):
  """POST { uid, token, new_password } — set new password from email link."""

  permission_classes = [AllowAny]
  authentication_classes = []

  def post(self, request, *args: Any, **kwargs: Any) -> Response:
    ser = PasswordResetConfirmSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    ser.save()
    return Response(
      {"detail": "Your password was reset. You can sign in with your new password."},
      status=status.HTTP_200_OK,
    )
