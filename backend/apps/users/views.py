import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PasswordResetRequest, User
from .serializers import (
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestListSerializer,
    PasswordResetRequestSerializer,
    UserSerializer,
)


def require_admin_role(request):
    if request.headers.get('X-User-Role') != User.ROLE_ADMIN:
        raise PermissionDenied('Solo un administrador puede realizar esta accion.')


class UserViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        send_mail(
            'Cuenta creada en FitAI Coach',
            (
                f'Hola {user.first_name or user.email},\n\n'
                'Tu cuenta de FitAI Coach se ha creado correctamente. '
                'Ya puedes iniciar sesion y comenzar a preparar tu plan deportivo.\n\n'
                'Si no solicitaste esta cuenta, contacta con el administrador.'
            ),
            getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@fitai-coach.local'),
            [user.email],
            fail_silently=True,
        )

    def check_admin_permission(self):
        require_admin_role(self.request)

    def update(self, request, *args, **kwargs):
        self.check_admin_permission()
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self.check_admin_permission()
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self.check_admin_permission()
        return super().destroy(request, *args, **kwargs)


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(UserSerializer(serializer.validated_data['user']).data)


class PasswordResetRequestView(APIView):
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email__iexact=email, is_active=True)
        except User.DoesNotExist:
            user = None

        if user:
            token = secrets.token_urlsafe(48)
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            reset_url = f'{frontend_url}/?resetToken={token}'
            reset_request = PasswordResetRequest.objects.create(
                user=user,
                email=user.email,
                token=token,
                reset_url=reset_url,
                expires_at=timezone.now() + timedelta(hours=24),
            )
            send_mail(
                'Recuperacion de contraseÃ±a FitAI Coach',
                (
                    'Se solicito recuperar tu contraseÃ±a.\n\n'
                    f'Usa este enlace para crear una nueva contraseÃ±a: {reset_request.reset_url}\n\n'
                    'El enlace caduca en 24 horas. Si no hiciste esta solicitud, ignora este mensaje.'
                ),
                getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@fitai-coach.local'),
                [user.email],
                fail_silently=True,
            )

        return Response(
            {'detail': 'Si el email existe, se iniciara el proceso de recuperacion.'},
            status=status.HTTP_202_ACCEPTED,
        )


class PasswordResetConfirmView(APIView):
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'contraseÃ±a actualizada correctamente.'})


class PasswordResetRequestAdminView(APIView):
    def get(self, request):
        require_admin_role(request)
        reset_requests = PasswordResetRequest.objects.select_related('user').all()
        serializer = PasswordResetRequestListSerializer(reset_requests, many=True)
        return Response(serializer.data)
