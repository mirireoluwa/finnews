from django.urls import path

from .views import BriefingView, CompanySearchView, TodayBriefingView

urlpatterns = [
  path("briefing/", BriefingView.as_view(), name="briefing"),
  path("today-briefing/", TodayBriefingView.as_view(), name="today-briefing"),
  path("company-search/", CompanySearchView.as_view(), name="company-search"),
]

