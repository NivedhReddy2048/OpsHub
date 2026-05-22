# OpsHub Deployment Guide

OpsHub supports deploying the Frontend to Vercel and the Backend to PaaS providers like Render or Railway.

## Docker Deployment

A `Dockerfile` is provided in the `backend/` directory for deploying the Django application. It installs necessary production dependencies (like `gunicorn` and `psycopg2-binary`) and collects static files via `whitenoise`.

```bash
docker build -t opshub-backend ./backend
docker run -p 8000:8000 -e DJANGO_SETTINGS_MODULE=config.settings.production -e DATABASE_URL=postgres://... opshub-backend
```

## Render Deployment

We've provided a `render.yaml` configuration for seamless deployment:
1. Connect your Github Repository to Render.
2. Select "Blueprints" and use `render.yaml`.
3. Render will provision the PostgreSQL database and the Python backend web service automatically.

## Railway Deployment

A `railway.json` is included.
1. Create a Railway project.
2. Add a PostgreSQL database.
3. Link your Github Repo.
4. Set the necessary environment variables.

## Environment Variables required in Production (Backend)
- `DJANGO_SETTINGS_MODULE`: Set to `config.settings.production`
- `SECRET_KEY`: Long, random string.
- `DATABASE_URL`: Your PostgreSQL connection string.
- `ALLOWED_HOSTS`: Your backend domain (e.g., `api.opshub.com`).
- `CORS_ALLOWED_ORIGINS`: Your frontend domain (e.g., `https://opshub.vercel.app`).

## Vercel Deployment (Frontend)
1. Import the project in Vercel.
2. Set the Root Directory to `frontend`.
3. Set the Environment Variable `NEXT_PUBLIC_API_URL` to your deployed backend URL (e.g., `https://api.opshub.com/api/v1`).
