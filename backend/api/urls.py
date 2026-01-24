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

    # Flight endpoints (using AA Flight-Engine API)
    path('flights/', views.get_flights, name='get_flights'),
    path('flights/search', views.search_flights, name='search_flights'),
    path('flights/alternatives', views.get_alternative_flights_view, name='get_alternative_flights'),

    # Airport endpoints (using AA Flight-Engine API)
    path('airports/', views.get_airports, name='get_airports'),

    # Voice endpoints
    path('voice/synthesize', views.synthesize_voice, name='synthesize_voice'),

    # Family helper endpoints
    path('helper/create-link', views.create_helper_link, name='create_helper_link'),
    path('helper/<str:link_id>', views.get_helper_session, name='get_helper_session'),
    path('helper/<str:link_id>/suggest', views.send_helper_suggestion, name='send_helper_suggestion'),
    
    # Health check
    path('health/', views.health_check, name='health_check'),

    # Retell AI Voice Agent endpoints
    path('retell/status', views.retell_status, name='retell_status'),
    path('retell/agents', views.retell_list_agents, name='retell_list_agents'),
    path('retell/agents/create', views.retell_create_agent, name='retell_create_agent'),
    path('retell/agents/<str:agent_id>', views.retell_get_agent, name='retell_get_agent'),
    path('retell/calls/web', views.retell_create_web_call, name='retell_create_web_call'),
    path('retell/calls/phone', views.retell_create_phone_call, name='retell_create_phone_call'),
    path('retell/calls/<str:call_id>', views.retell_get_call, name='retell_get_call'),
    path('retell/calls/<str:call_id>/end', views.retell_end_call, name='retell_end_call'),
]
