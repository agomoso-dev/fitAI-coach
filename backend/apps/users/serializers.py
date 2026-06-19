from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from rest_framework import serializers

from .models import PasswordResetRequest, User


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'password',
            'first_name',
            'last_name',
            'role',
            'age',
            'sex',
            'height_cm',
            'weight_kg',
            'daily_physical_effort',
            'training_experience_months',
            'training_goal',
            'medical_notes',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'is_active', 'created_at', 'updated_at')

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError('La contrasena debe tener al menos 8 caracteres.')
        if not any(character.isupper() for character in value):
            raise serializers.ValidationError('La contrasena debe incluir al menos una mayuscula.')
        if not any(not character.isalnum() for character in value):
            raise serializers.ValidationError('La contrasena debe incluir al menos un caracter especial.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'Este campo es obligatorio.'})
        return User.objects.create(password_hash=make_password(password), **validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.password_hash = make_password(password)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        try:
            user = User.objects.get(email__iexact=attrs['email'], is_active=True)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError('Credenciales invalidas') from exc

        if not check_password(attrs['password'], user.password_hash):
            raise serializers.ValidationError('Credenciales invalidas')

        attrs['user'] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetRequestListSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = PasswordResetRequest
        fields = (
            'id',
            'user',
            'user_email',
            'user_first_name',
            'user_last_name',
            'user_role',
            'email',
            'reset_url',
            'is_used',
            'requested_at',
            'expires_at',
            'used_at',
        )


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError('La contrasena debe tener al menos 8 caracteres.')
        if not any(character.isupper() for character in value):
            raise serializers.ValidationError('La contrasena debe incluir al menos una mayuscula.')
        if not any(not character.isalnum() for character in value):
            raise serializers.ValidationError('La contrasena debe incluir al menos un caracter especial.')
        return value

    def validate(self, attrs):
        try:
            reset_request = PasswordResetRequest.objects.select_related('user').get(token=attrs['token'])
        except PasswordResetRequest.DoesNotExist as exc:
            raise serializers.ValidationError('El enlace de recuperacion no es valido.') from exc

        if reset_request.is_used:
            raise serializers.ValidationError('El enlace de recuperacion ya fue usado.')
        if reset_request.expires_at <= timezone.now():
            raise serializers.ValidationError('El enlace de recuperacion ha caducado.')
        if not reset_request.user.is_active:
            raise serializers.ValidationError('El usuario no esta activo.')

        attrs['reset_request'] = reset_request
        return attrs

    def save(self):
        reset_request = self.validated_data['reset_request']
        reset_request.user.password_hash = make_password(self.validated_data['password'])
        reset_request.user.save(update_fields=['password_hash', 'updated_at'])
        reset_request.is_used = True
        reset_request.used_at = timezone.now()
        reset_request.save(update_fields=['is_used', 'used_at'])
        return reset_request
