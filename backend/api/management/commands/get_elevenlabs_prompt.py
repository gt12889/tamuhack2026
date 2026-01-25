"""
Django management command to output the ElevenLabs agent prompt.
Usage: python manage.py get_elevenlabs_prompt
"""

from django.core.management.base import BaseCommand
from api.services.elevenlabs_agent_prompt import get_elevenlabs_agent_prompt, print_elevenlabs_prompt


class Command(BaseCommand):
    help = 'Output the ElevenLabs Conversational AI agent prompt for configuration'

    def handle(self, *args, **options):
        print_elevenlabs_prompt()
