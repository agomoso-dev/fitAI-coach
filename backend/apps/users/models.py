import uuid

from django.db import models


class User(models.Model):
    ROLE_ATHLETE = 'athlete'
    ROLE_COACH = 'coach'
    ROLE_ADMIN = 'admin'

    ROLE_CHOICES = (
        (ROLE_ATHLETE, 'Athlete'),
        (ROLE_COACH, 'Coach'),
        (ROLE_ADMIN, 'Admin'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    password_hash = models.TextField()
    first_name = models.CharField(max_length=120, blank=True, null=True)
    last_name = models.CharField(max_length=120, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_ATHLETE)
    age = models.PositiveSmallIntegerField(blank=True, null=True)
    sex = models.CharField(max_length=20, default='unknown')
    height_cm = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    daily_physical_effort = models.CharField(max_length=20, default='moderate')
    training_experience_months = models.PositiveIntegerField(default=0)
    training_goal = models.TextField(blank=True, null=True)
    medical_notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return self.email


class PasswordResetRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, db_column='user_id', on_delete=models.CASCADE, related_name='password_reset_requests')
    email = models.EmailField()
    token = models.CharField(max_length=128, unique=True)
    reset_url = models.TextField()
    is_used = models.BooleanField(default=False)
    requested_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'password_reset_requests'
        ordering = ['-requested_at']

    def __str__(self):
        return f'{self.email} - {self.requested_at}'
