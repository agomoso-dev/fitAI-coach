# Generated manually for unmanaged legacy tables.

import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('password_hash', models.TextField()),
                ('first_name', models.CharField(blank=True, max_length=120, null=True)),
                ('last_name', models.CharField(blank=True, max_length=120, null=True)),
                ('role', models.CharField(choices=[('athlete', 'Athlete'), ('coach', 'Coach'), ('admin', 'Admin')], default='athlete', max_length=20)),
                ('age', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('sex', models.CharField(default='unknown', max_length=20)),
                ('height_cm', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('weight_kg', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('daily_physical_effort', models.CharField(default='moderate', max_length=20)),
                ('training_experience_months', models.PositiveIntegerField(default=0)),
                ('training_goal', models.TextField(blank=True, null=True)),
                ('medical_notes', models.TextField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'users',
                'ordering': ['-created_at'],
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='PasswordResetRequest',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('email', models.EmailField(max_length=254)),
                ('token', models.CharField(max_length=128, unique=True)),
                ('reset_url', models.TextField()),
                ('is_used', models.BooleanField(default=False)),
                ('requested_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
                ('used_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.ForeignKey(db_column='user_id', on_delete=django.db.models.deletion.CASCADE, related_name='password_reset_requests', to='users.user')),
            ],
            options={
                'db_table': 'password_reset_requests',
                'ordering': ['-requested_at'],
                'managed': False,
            },
        ),
    ]
