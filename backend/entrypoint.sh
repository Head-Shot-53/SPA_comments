#!/usr/bin/env bash
set -e

# Міграції (2 спроби — БД може ще підійматись)
python manage.py migrate --noinput || (sleep 3 && python manage.py migrate --noinput)

# Збирання статики (якщо не робиш це на build)
# python manage.py collectstatic --noinput

# Головне: запустити довгоживучий процес і слухати $PORT
exec daphne -b 0.0.0.0 -p "${PORT}" spa_comments.asgi:application
