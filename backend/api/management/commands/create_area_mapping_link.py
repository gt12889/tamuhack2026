"""Django management command to create an area mapping helper link."""
from django.core.management.base import BaseCommand
from django.test import RequestFactory
from api.views import create_area_mapping_link
import json


class Command(BaseCommand):
    help = 'Create a helper link for area mapping'

    def add_arguments(self, parser):
        parser.add_argument(
            '--airport',
            type=str,
            default='DFW',
            help='Airport code (default: DFW)'
        )
        parser.add_argument(
            '--gate',
            type=str,
            default='B22',
            help='Gate number (default: B22)'
        )
        parser.add_argument(
            '--hours',
            type=int,
            default=48,
            help='Hours until link expires (default: 48)'
        )

    def handle(self, *args, **options):
        airport_code = options['airport']
        gate = options['gate']
        hours = options['hours']

        factory = RequestFactory()
        request = factory.post(
            '/api/helper/create-area-mapping-link',
            {
                'airport_code': airport_code,
                'gate': gate,
                'expires_in_hours': hours
            },
            content_type='application/json'
        )

        # Set up request attributes that might be needed
        request.META['HTTP_HOST'] = 'localhost:8000'
        request.META['SERVER_NAME'] = 'localhost'
        request.META['SERVER_PORT'] = '8000'

        response = create_area_mapping_link(request)
        
        if response.status_code == 200:
            data = response.data
            self.stdout.write(self.style.SUCCESS('\n[SUCCESS] Area Mapping Helper Link Created!\n'))
            self.stdout.write(f'Link ID: {data["helper_link"]}')
            self.stdout.write(f'Full URL: {data["helper_url"]}')
            self.stdout.write(f'Airport: {data["airport_code"]}')
            self.stdout.write(f'Gate: {data["gate"]}')
            self.stdout.write(f'Expires: {data["expires_at"]}\n')
            self.stdout.write(self.style.SUCCESS(f'\nOpen this URL in your browser:\n{data["helper_url"]}\n'))
        else:
            self.stdout.write(self.style.ERROR(f'Error: {response.data}'))
