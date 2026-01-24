"""WSGI config for voice_concierge project."""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'voice_concierge.settings')
application = get_wsgi_application()
