"""Admin configuration for Elder Strolls."""

from django.contrib import admin
from .models import Passenger, Flight, Reservation, FlightSegment, Session, Message, FamilyAction, PassengerLocation, LocationAlert


@admin.register(Passenger)
class PassengerAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'email', 'language_preference']
    search_fields = ['first_name', 'last_name', 'email']


@admin.register(Flight)
class FlightAdmin(admin.ModelAdmin):
    list_display = ['flight_number', 'origin', 'destination', 'departure_time', 'status']
    list_filter = ['status', 'origin', 'destination']
    search_fields = ['flight_number']


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['confirmation_code', 'passenger', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['confirmation_code', 'passenger__last_name']


@admin.register(FlightSegment)
class FlightSegmentAdmin(admin.ModelAdmin):
    list_display = ['reservation', 'flight', 'seat', 'segment_order']


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'state', 'reservation', 'created_at', 'expires_at']
    list_filter = ['state']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['session', 'role', 'content_preview', 'timestamp']
    list_filter = ['role']

    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content


@admin.register(FamilyAction)
class FamilyActionAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'action_type', 'status', 'created_at']
    list_filter = ['action_type', 'status']
    search_fields = ['session__id', 'action_type']


@admin.register(PassengerLocation)
class PassengerLocationAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'latitude', 'longitude', 'accuracy', 'timestamp']
    list_filter = ['timestamp']
    search_fields = ['session__id']
    ordering = ['-timestamp']


@admin.register(LocationAlert)
class LocationAlertAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'alert_type', 'acknowledged', 'voice_call_sent', 'email_sent', 'created_at']
    list_filter = ['alert_type', 'acknowledged', 'voice_call_sent', 'email_sent']
    search_fields = ['session__id', 'message']
    ordering = ['-created_at']
