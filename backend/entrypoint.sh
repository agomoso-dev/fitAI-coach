#!/bin/bash

# Esperar a que la base de datos esté disponible usando wait-for-it
echo "Esperando que la base de datos esté lista..."
bash /wait-for-it.sh db:5432 --timeout=30 --strict -- echo "La base de datos está disponible."

# Ejecutar migraciones
echo "Aplicando schema de entrenamiento..."
python manage.py ensure_training_schema

echo "Ejecutando migraciones..."
python manage.py migrate

# Iniciar el servidor Django
echo "Iniciando el servidor Django..."
python manage.py runserver 0.0.0.0:5000
