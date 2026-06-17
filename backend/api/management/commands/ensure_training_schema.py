from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Applies the training SQL schema used by the application.'

    def handle(self, *args, **options):
        schema_path = Path('/app/schema_training_rts_ai.sql')

        if not schema_path.exists():
            self.stdout.write(self.style.WARNING(f'Schema file not found: {schema_path}'))
            return

        with schema_path.open(encoding='utf-8') as schema_file:
            sql = schema_file.read()

        with connection.cursor() as cursor:
            cursor.execute(sql)

        self.stdout.write(self.style.SUCCESS('Training schema applied.'))
