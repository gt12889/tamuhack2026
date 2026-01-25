# Generated migration for location tracking models

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_add_family_actions'),
    ]

    operations = [
        migrations.CreateModel(
            name='PassengerLocation',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('latitude', models.DecimalField(decimal_places=6, max_digits=9)),
                ('longitude', models.DecimalField(decimal_places=6, max_digits=9)),
                ('accuracy', models.FloatField(blank=True, null=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('session', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='locations', to='api.session')),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.CreateModel(
            name='LocationAlert',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('alert_type', models.CharField(choices=[('running_late', 'Running Late'), ('urgent', 'Urgent - May Miss Flight'), ('off_course', 'Off Course'), ('arrived', 'Arrived at Gate')], max_length=20)),
                ('message', models.TextField()),
                ('distance_to_gate', models.FloatField(blank=True, null=True)),
                ('estimated_walking_time', models.IntegerField(blank=True, null=True)),
                ('time_to_departure', models.IntegerField(blank=True, null=True)),
                ('acknowledged', models.BooleanField(default=False)),
                ('voice_call_sent', models.BooleanField(default=False)),
                ('email_sent', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('session', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='location_alerts', to='api.session')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='passengerlocation',
            index=models.Index(fields=['session', '-timestamp'], name='api_passeng_session_a1b2c3_idx'),
        ),
    ]
