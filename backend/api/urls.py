from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LoginView, PasswordResetRequestView, UserViewSet

router = DefaultRouter()
router.register('users', UserViewSet, basename='users')

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('', include(router.urls)),
]
