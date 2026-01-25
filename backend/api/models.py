"""Database models for Elder Strolls."""

from django.db import models
import uuid


class Passenger(models.Model):
    """Passenger information."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    aadvantage_number = models.CharField(max_length=20, blank=True, null=True)
    language_preference = models.CharField(
        max_length=2,
        choices=[('en', 'English'), ('es', 'Spanish')],
        default='en'
    )
    seat_preference = models.CharField(
        max_length=10,
        choices=[('window', 'Window'), ('aisle', 'Aisle'), ('middle', 'Middle')],
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Flight(models.Model):
    """Flight information."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    flight_number = models.CharField(max_length=10)
    origin = models.CharField(max_length=3)  # Airport code
    destination = models.CharField(max_length=3)  # Airport code
    departure_time = models.DateTimeField()
    arrival_time = models.DateTimeField()
    gate = models.CharField(max_length=10, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('scheduled', 'Scheduled'),
            ('delayed', 'Delayed'),
            ('cancelled', 'Cancelled'),
            ('boarding', 'Boarding'),
            ('departed', 'Departed'),
        ],
        default='scheduled'
    )

    def __str__(self):
        return f"{self.flight_number}: {self.origin} -> {self.destination}"


class Reservation(models.Model):
    """Flight reservation."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    confirmation_code = models.CharField(max_length=6, unique=True, db_index=True)
    passenger = models.ForeignKey(Passenger, on_delete=models.CASCADE, related_name='reservations')
    status = models.CharField(
        max_length=20,
        choices=[
            ('confirmed', 'Confirmed'),
            ('changed', 'Changed'),
            ('cancelled', 'Cancelled'),
        ],
        default='confirmed'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.confirmation_code} - {self.passenger}"


class FlightSegment(models.Model):
    """Links a reservation to a flight with seat info."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='flight_segments')
    flight = models.ForeignKey(Flight, on_delete=models.CASCADE)
    seat = models.CharField(max_length=5, blank=True, null=True)
    segment_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['segment_order']

    def __str__(self):
        return f"{self.reservation.confirmation_code} - {self.flight.flight_number}"


class Session(models.Model):
    """Conversation session."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    state = models.CharField(
        max_length=20,
        choices=[
            ('greeting', 'Greeting'),
            ('lookup', 'Lookup'),
            ('viewing', 'Viewing'),
            ('changing', 'Changing'),
            ('confirming', 'Confirming'),
            ('complete', 'Complete'),
        ],
        default='greeting'
    )
    reservation = models.ForeignKey(
        Reservation, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='sessions'
    )
    helper_link = models.CharField(max_length=20, blank=True, null=True, unique=True)
    helper_link_expires_at = models.DateTimeField(blank=True, null=True)
    helper_link_mode = models.CharField(
        max_length=20,
        choices=[
            ('session', 'Session-based (30 min)'),
            ('persistent', 'Persistent (until flight departure)'),
        ],
        default='session'
    )
    context = models.JSONField(default=dict)  # Store conversation context
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"Session {self.id} - {self.state}"


class Message(models.Model):
    """Conversation message."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(
        max_length=10,
        choices=[
            ('user', 'User'),
            ('assistant', 'Assistant'),
            ('family', 'Family'),
        ]
    )
    content = models.TextField()
    audio_url = models.TextField(blank=True, null=True)  # Can be URL or base64 data URL
    intent = models.CharField(max_length=50, blank=True, null=True)
    entities = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."


class FamilyAction(models.Model):
    """Actions taken by family helpers on behalf of elderly passengers."""
    ACTION_TYPES = [
        ('change_flight', 'Change Flight'),
        ('cancel_flight', 'Cancel Flight'),
        ('select_seat', 'Select Seat'),
        ('add_bags', 'Add Bags'),
        ('request_wheelchair', 'Request Wheelchair'),
    ]

    STATUS_CHOICES = [
        ('executed', 'Executed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='family_actions')
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    action_data = models.JSONField(default=dict)  # Store action-specific data
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='executed')
    family_notes = models.TextField(blank=True)  # Optional notes from family helper
    result_message = models.TextField(blank=True)  # Result or error message
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action_type} - {self.status}"

    @property
    def display_name(self):
        return dict(self.ACTION_TYPES).get(self.action_type, self.action_type)


class PassengerLocation(models.Model):
    """GPS location tracking for elderly passengers navigating airports."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='locations')
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    accuracy = models.FloatField(null=True, blank=True)  # GPS accuracy in meters
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['session', '-timestamp']),
        ]

    def __str__(self):
        return f"Location for session {self.session_id} at {self.timestamp}"


class LocationAlert(models.Model):
    """Alerts triggered by location tracking when passenger is running late."""
    ALERT_TYPES = [
        ('running_late', 'Running Late'),
        ('urgent', 'Urgent - May Miss Flight'),
        ('arrived', 'Arrived at Gate'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='location_alerts')
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    message = models.TextField()
    distance_to_gate = models.FloatField(null=True, blank=True)  # meters
    estimated_walking_time = models.IntegerField(null=True, blank=True)  # minutes
    time_to_departure = models.IntegerField(null=True, blank=True)  # minutes
    acknowledged = models.BooleanField(default=False)
    voice_call_sent = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.alert_type} alert for session {self.session_id}"
