FROM python:3.12.2

# Crear usuario
RUN addgroup --system app && adduser --system --group app -u 1000

# Crear directorio de trabajo
WORKDIR /app

# Copiar requirements primero para aprovechar la caché de Docker
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copiar el código del proyecto
COPY ./config /app/config
COPY ./api /app/api
COPY manage.py /app/

# Script para esperar a que la base de datos esté lista
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Copiar el script de arranque
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Cambiar al usuario no root
USER app

# Comando de arranque
ENTRYPOINT ["sh", "/entrypoint.sh"]
