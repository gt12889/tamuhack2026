"""Database models for AA Voice Concierge."""

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
    audio_url = models.URLField(blank=True, null=True)
    intent = models.CharField(max_length=50, blank=True, null=True)
    entities = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."
