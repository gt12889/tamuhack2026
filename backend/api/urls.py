"""URL configuration for AA Voice Concierge API."""

from django.urls import path
from . import views

urlpatterns = [
    # Conversation endpoints
    path('conversation/start', views.start_conversation, name='start_conversation'),
    path('conversation/message', views.send_message, name='send_message'),
    path('conversation/<uuid:session_id>', views.get_session, name='get_session'),

    # Reservation endpoints
    path('reservation/lookup', views.lookup_reservation, name='lookup_reservation'),
    path('reservation/change', views.change_reservation, name='change_reservation'),

    # Flight endpoints
    path('flights/alternatives', views.get_alternative_flights_view, name='get_alternative_flights'),

    # Voice endpoints
    path('voice/synthesize', views.synthesize_voice, name='synthesize_voice'),

    # Family helper endpoints
    path('helper/create-link', views.create_helper_link, name='create_helper_link'),
    path('helper/<str:link_id>', views.get_helper_session, name='get_helper_session'),
    path('helper/<str:link_id>/suggest', views.send_helper_suggestion, name='send_helper_suggestion'),
]
