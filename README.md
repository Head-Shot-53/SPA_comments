SPA Comments

SPA Comments is a full-stack comment system with JWT authentication, file attachments, CAPTCHA protection, and real-time updates (WebSocket).
It includes Django + DRF + Channels + Celery + Redis + PostgreSQL on the backend and React (Vite) + Axios + Tailwind on the frontend — all running in Docker Compose.

Features:
-JWT login, registration, logout with user-friendly error handling
-Comment creation with text formatting and file/image attachments
-CAPTCHA for anonymous users
-Live updates via WebSocket (Django Channels)
-Background tasks via Celery + Redis
-Nginx proxy serving both backend API and React build
-Fully containerized environment with Docker Compose

Requirements:
Git (https://git-scm.com/install/)
Docker Desktop (https://www.docker.com/products/docker-desktop

Installation:
1) Clone the project:
     git clone https://github.com/Head-Shot-53/SPA_comments.git
2) cd into spa_comments:
     cd spa_comments
3) Create .env file. In the root folder (next to docker-compose.yml):
    DB_NAME=db_name
    DB_USER=db_user
    DB_PASSWORD=db_password
    DB_HOST=db
    DB_PORT=5432
    ALLOWED_HOSTS=host
    TIME_ZONE=your_timezone

    SECRET_KEY=change_me_please
    DEBUG=True
5) Build the frontend (before Docker):
     1)cd frontend
     2)npm ci
     3)npm run build
     4)cd ..
6) Start Docker containers (This will start all required services: web, db, redis, worker, beat, and nginx.):
     1)docker compose up --build
     2)docker compose up -d
7) When you see ``Listening on TCP address 0.0.0.0:8000``: press ctrl + c
8) Run migrations:
     docker compose exec web python manage.py migrate
9) Optionally create a superuser:
   docker compose exec web python manage.py createsuperuser
10) Restart the project:
      docker compose up -d
11) Open the app:
     http://localhost:8080

-Frontend (React SPA) is served by Nginx
-API available at /api/
-WebSocket at /ws/
-Django Admin at /admin/
