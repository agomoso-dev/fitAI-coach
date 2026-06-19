from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    LoginView,
    PasswordResetConfirmView,
    PasswordResetRequestAdminView,
    PasswordResetRequestView,
    UserViewSet,
)

router = DefaultRouter()
router.register('users', UserViewSet, basename='users')

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('admin/password-reset-requests/', PasswordResetRequestAdminView.as_view(), name='password-reset-admin'),
    path('', include(router.urls)),
]
