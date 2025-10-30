from celery import shared_task
from django_redis import get_redis_connection

@shared_task
def cleanup_old_data():
    from django_redis import get_redis_connection
    conn = get_redis_connection("default")
    removed = 0
    for key in conn.scan_iter("rl:*"):
        conn.delete(key); removed += 1
    print(f"[CLEANUP] Removed {removed} rl:* keys")
    return {"removed": removed}
