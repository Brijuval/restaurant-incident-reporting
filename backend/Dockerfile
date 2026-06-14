FROM python:3.10-slim

WORKDIR /app

# Prevent Python from writing .pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend project files
COPY . /app/

# Run migrations and collect static files on container start/build
RUN python manage.py migrate
RUN python manage.py collectstatic --noinput

# Expose port 7860 (the standard port required by Hugging Face Spaces)
EXPOSE 7860

# Start server using gunicorn on port 7860
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "incident_project.wsgi:application"]
