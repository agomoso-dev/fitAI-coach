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
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return self.email
