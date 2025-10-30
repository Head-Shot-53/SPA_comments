import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "spa_comments.settings")

celery_app = Celery("spa_comments")
celery_app.config_from_object("django.conf:settings", namespace="CELERY")
celery_app.autodiscover_tasks()

@celery_app.task(bind=True)
def health(self):
    return "ok"
