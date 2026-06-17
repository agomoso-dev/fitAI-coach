from django.contrib.auth.hashers import check_password, make_password
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'password',
            'first_name',
            'last_name',
            'role',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'is_active', 'created_at', 'updated_at')

    def create(self, validated_data):
        password = validated_data.pop('password')
        return User.objects.create(password_hash=make_password(password), **validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
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
