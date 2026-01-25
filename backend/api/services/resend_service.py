"""Resend email service for sending booking confirmations."""

import os
import logging
from typing import Optional
from datetime import datetime

import resend

logger = logging.getLogger(__name__)


class ResendService:
    """Service for sending emails via Resend."""

    def __init__(self):
        self.api_key = os.getenv('RESEND_API_KEY', '')
        self.from_email = os.getenv('RESEND_FROM_EMAIL', 'AA Voice Concierge <noreply@yourdomain.com>')
        
        if self.api_key:
            resend.api_key = self.api_key

    def is_configured(self) -> bool:
        """Check if Resend is properly configured."""
        return bool(self.api_key)

    def send_booking_confirmation(
        self,
        to_email: str,
        passenger_name: str,
        confirmation_code: str,
        flight_details: list,
        language: str = 'en'
    ) -> Optional[dict]:
        """
        Send a flight booking confirmation email.

        Args:
            to_email: Recipient email address
            passenger_name: Full name of the passenger
            confirmation_code: Reservation confirmation code
            flight_details: List of flight segment dictionaries
            language: Language for email content ('en' or 'es')

        Returns:
            Resend API response or None if failed
        """
        if not self.is_configured():
            logger.warning("Resend not configured. Skipping email.")
            return None

        try:
            # Build email content
            if language == 'es':
                subject = f"Confirmación de Vuelo - {confirmation_code}"
                html_content = self._build_confirmation_html_es(
                    passenger_name, confirmation_code, flight_details
                )
            else:
                subject = f"Flight Confirmation - {confirmation_code}"
                html_content = self._build_confirmation_html_en(
                    passenger_name, confirmation_code, flight_details
                )

            response = resend.Emails.send({
                "from": self.from_email,
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            })

            logger.info(f"Booking confirmation email sent to {to_email}")
            return response

        except Exception as e:
            logger.error(f"Failed to send booking confirmation email: {e}")
            return None

    def send_flight_change_confirmation(
        self,
        to_email: str,
        passenger_name: str,
        confirmation_code: str,
        original_flight: dict,
        new_flight: dict,
        language: str = 'en'
    ) -> Optional[dict]:
        """
        Send a flight change confirmation email.

        Args:
            to_email: Recipient email address
            passenger_name: Full name of the passenger
            confirmation_code: Reservation confirmation code
            original_flight: Original flight details
            new_flight: New flight details
            language: Language for email content ('en' or 'es')

        Returns:
            Resend API response or None if failed
        """
        if not self.is_configured():
            logger.warning("Resend not configured. Skipping email.")
            return None

        try:
            if language == 'es':
                subject = f"Cambio de Vuelo Confirmado - {confirmation_code}"
                html_content = self._build_change_html_es(
                    passenger_name, confirmation_code, original_flight, new_flight
                )
            else:
                subject = f"Flight Change Confirmed - {confirmation_code}"
                html_content = self._build_change_html_en(
                    passenger_name, confirmation_code, original_flight, new_flight
                )

            response = resend.Emails.send({
                "from": self.from_email,
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            })

            logger.info(f"Flight change confirmation email sent to {to_email}")
            return response

        except Exception as e:
            logger.error(f"Failed to send flight change email: {e}")
            return None

    def _format_datetime(self, dt_str: str, language: str = 'en') -> str:
        """Format datetime string for display."""
        try:
            if isinstance(dt_str, str):
                dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
            else:
                dt = dt_str
            
            if language == 'es':
                months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
                return f"{dt.day} de {months[dt.month - 1]} de {dt.year} a las {dt.strftime('%I:%M %p')}"
            else:
                return dt.strftime('%B %d, %Y at %I:%M %p')
        except Exception:
            return str(dt_str)

    def _build_confirmation_html_en(
        self,
        passenger_name: str,
        confirmation_code: str,
        flight_details: list
    ) -> str:
        """Build HTML email content for booking confirmation (English)."""
        
        flights_html = ""
        for i, flight in enumerate(flight_details, 1):
            departure = self._format_datetime(flight.get('departure_time', ''), 'en')
            arrival = self._format_datetime(flight.get('arrival_time', ''), 'en')
            
            flights_html += f"""
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                <h3 style="color: #0d6efd; margin: 0 0 15px 0;">
                    Flight {i}: {flight.get('flight_number', 'N/A')}
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #666;">From:</td>
                        <td style="padding: 8px 0; font-weight: bold;">{flight.get('origin', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">To:</td>
                        <td style="padding: 8px 0; font-weight: bold;">{flight.get('destination', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Departure:</td>
                        <td style="padding: 8px 0;">{departure}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Arrival:</td>
                        <td style="padding: 8px 0;">{arrival}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Gate:</td>
                        <td style="padding: 8px 0;">{flight.get('gate', 'TBD')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Seat:</td>
                        <td style="padding: 8px 0;">{flight.get('seat', 'Not assigned')}</td>
                    </tr>
                </table>
            </div>
            """

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">✈️ Flight Confirmed!</h1>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px;">Hello <strong>{passenger_name}</strong>,</p>
                
                <p>Your flight reservation has been confirmed. Here are your booking details:</p>
                
                <div style="background: #e7f1ff; border-left: 4px solid #0d6efd; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #666;">Confirmation Code</p>
                    <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #0d6efd; letter-spacing: 2px;">{confirmation_code}</p>
                </div>
                
                <h2 style="color: #333; border-bottom: 2px solid #0d6efd; padding-bottom: 10px;">Your Flight Details</h2>
                
                {flights_html}
                
                <div style="background: #fff3cd; border-radius: 8px; padding: 15px; margin-top: 20px;">
                    <p style="margin: 0; color: #856404;">
                        <strong>📋 Important Reminders:</strong>
                    </p>
                    <ul style="margin: 10px 0 0 0; color: #856404;">
                        <li>Arrive at the airport at least 2 hours before departure</li>
                        <li>Have your ID and confirmation code ready</li>
                        <li>Check gate information on departure day</li>
                    </ul>
                </div>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    Thank you for choosing American Airlines. Have a great flight!
                </p>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    This email was sent by AA Voice Concierge.<br>
                    For assistance, please contact our support team.
                </p>
            </div>
        </body>
        </html>
        """

    def _build_confirmation_html_es(
        self,
        passenger_name: str,
        confirmation_code: str,
        flight_details: list
    ) -> str:
        """Build HTML email content for booking confirmation (Spanish)."""
        
        flights_html = ""
        for i, flight in enumerate(flight_details, 1):
            departure = self._format_datetime(flight.get('departure_time', ''), 'es')
            arrival = self._format_datetime(flight.get('arrival_time', ''), 'es')
            
            flights_html += f"""
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                <h3 style="color: #0d6efd; margin: 0 0 15px 0;">
                    Vuelo {i}: {flight.get('flight_number', 'N/A')}
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Origen:</td>
                        <td style="padding: 8px 0; font-weight: bold;">{flight.get('origin', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Destino:</td>
                        <td style="padding: 8px 0; font-weight: bold;">{flight.get('destination', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Salida:</td>
                        <td style="padding: 8px 0;">{departure}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Llegada:</td>
                        <td style="padding: 8px 0;">{arrival}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Puerta:</td>
                        <td style="padding: 8px 0;">{flight.get('gate', 'Por confirmar')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Asiento:</td>
                        <td style="padding: 8px 0;">{flight.get('seat', 'No asignado')}</td>
                    </tr>
                </table>
            </div>
            """

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">✈️ ¡Vuelo Confirmado!</h1>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px;">Hola <strong>{passenger_name}</strong>,</p>
                
                <p>Su reservación de vuelo ha sido confirmada. Aquí están los detalles:</p>
                
                <div style="background: #e7f1ff; border-left: 4px solid #0d6efd; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #666;">Código de Confirmación</p>
                    <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #0d6efd; letter-spacing: 2px;">{confirmation_code}</p>
                </div>
                
                <h2 style="color: #333; border-bottom: 2px solid #0d6efd; padding-bottom: 10px;">Detalles de su Vuelo</h2>
                
                {flights_html}
                
                <div style="background: #fff3cd; border-radius: 8px; padding: 15px; margin-top: 20px;">
                    <p style="margin: 0; color: #856404;">
                        <strong>📋 Recordatorios Importantes:</strong>
                    </p>
                    <ul style="margin: 10px 0 0 0; color: #856404;">
                        <li>Llegue al aeropuerto al menos 2 horas antes de la salida</li>
                        <li>Tenga su identificación y código de confirmación listos</li>
                        <li>Verifique la información de la puerta el día de salida</li>
                    </ul>
                </div>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    Gracias por elegir American Airlines. ¡Que tenga un excelente vuelo!
                </p>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    Este correo fue enviado por AA Voice Concierge.<br>
                    Para asistencia, contacte a nuestro equipo de soporte.
                </p>
            </div>
        </body>
        </html>
        """

    def _build_change_html_en(
        self,
        passenger_name: str,
        confirmation_code: str,
        original_flight: dict,
        new_flight: dict
    ) -> str:
        """Build HTML email content for flight change confirmation (English)."""
        
        orig_departure = self._format_datetime(original_flight.get('departure_time', ''), 'en')
        new_departure = self._format_datetime(new_flight.get('departure_time', ''), 'en')

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #198754 0%, #146c43 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">✅ Flight Change Confirmed</h1>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px;">Hello <strong>{passenger_name}</strong>,</p>
                
                <p>Your flight has been successfully changed. Here are the details of your change:</p>
                
                <div style="background: #e7f1ff; border-left: 4px solid #0d6efd; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #666;">Confirmation Code</p>
                    <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #0d6efd; letter-spacing: 2px;">{confirmation_code}</p>
                </div>
                
                <div style="display: flex; gap: 20px; margin: 20px 0;">
                    <div style="flex: 1; background: #f8d7da; border-radius: 8px; padding: 20px;">
                        <h3 style="color: #842029; margin: 0 0 15px 0;">❌ Original Flight</h3>
                        <p style="margin: 5px 0;"><strong>{original_flight.get('flight_number', 'N/A')}</strong></p>
                        <p style="margin: 5px 0; color: #666;">{original_flight.get('origin', '')} → {original_flight.get('destination', '')}</p>
                        <p style="margin: 5px 0; color: #666;">{orig_departure}</p>
                    </div>
                </div>
                
                <div style="text-align: center; font-size: 24px; margin: 10px 0;">⬇️</div>
                
                <div style="background: #d1e7dd; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #0f5132; margin: 0 0 15px 0;">✅ New Flight</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Flight:</td>
                            <td style="padding: 8px 0; font-weight: bold;">{new_flight.get('flight_number', 'N/A')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Route:</td>
                            <td style="padding: 8px 0;">{new_flight.get('origin', '')} → {new_flight.get('destination', '')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Departure:</td>
                            <td style="padding: 8px 0;">{new_departure}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Gate:</td>
                            <td style="padding: 8px 0;">{new_flight.get('gate', 'TBD')}</td>
                        </tr>
                    </table>
                </div>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    Thank you for choosing American Airlines. We look forward to seeing you on board!
                </p>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    This email was sent by AA Voice Concierge.<br>
                    For assistance, please contact our support team.
                </p>
            </div>
        </body>
        </html>
        """

    def _build_change_html_es(
        self,
        passenger_name: str,
        confirmation_code: str,
        original_flight: dict,
        new_flight: dict
    ) -> str:
        """Build HTML email content for flight change confirmation (Spanish)."""
        
        orig_departure = self._format_datetime(original_flight.get('departure_time', ''), 'es')
        new_departure = self._format_datetime(new_flight.get('departure_time', ''), 'es')

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #198754 0%, #146c43 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">✅ Cambio de Vuelo Confirmado</h1>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px;">Hola <strong>{passenger_name}</strong>,</p>
                
                <p>Su vuelo ha sido cambiado exitosamente. Aquí están los detalles del cambio:</p>
                
                <div style="background: #e7f1ff; border-left: 4px solid #0d6efd; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #666;">Código de Confirmación</p>
                    <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #0d6efd; letter-spacing: 2px;">{confirmation_code}</p>
                </div>
                
                <div style="background: #f8d7da; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #842029; margin: 0 0 15px 0;">❌ Vuelo Original</h3>
                    <p style="margin: 5px 0;"><strong>{original_flight.get('flight_number', 'N/A')}</strong></p>
                    <p style="margin: 5px 0; color: #666;">{original_flight.get('origin', '')} → {original_flight.get('destination', '')}</p>
                    <p style="margin: 5px 0; color: #666;">{orig_departure}</p>
                </div>
                
                <div style="text-align: center; font-size: 24px; margin: 10px 0;">⬇️</div>
                
                <div style="background: #d1e7dd; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #0f5132; margin: 0 0 15px 0;">✅ Nuevo Vuelo</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Vuelo:</td>
                            <td style="padding: 8px 0; font-weight: bold;">{new_flight.get('flight_number', 'N/A')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Ruta:</td>
                            <td style="padding: 8px 0;">{new_flight.get('origin', '')} → {new_flight.get('destination', '')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Salida:</td>
                            <td style="padding: 8px 0;">{new_departure}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Puerta:</td>
                            <td style="padding: 8px 0;">{new_flight.get('gate', 'Por confirmar')}</td>
                        </tr>
                    </table>
                </div>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    Gracias por elegir American Airlines. ¡Esperamos verle a bordo!
                </p>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    Este correo fue enviado por AA Voice Concierge.<br>
                    Para asistencia, contacte a nuestro equipo de soporte.
                </p>
            </div>
        </body>
        </html>
        """


# Singleton instance
resend_service = ResendService()
