'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TripSummaryCard } from '@/components/TripSummaryCard';
import { FlightCard } from '@/components/FlightCard';

// Demo script steps
const DEMO_STEPS_EN = [
  {
    id: 1,
    speaker: 'agent',
    text: "Hi! I'm your American Airlines assistant. I'm here to help with your trip. What do you need today?",
    delay: 2000,
  },
  {
    id: 2,
    speaker: 'user',
    text: "I need to change my flight to a different day.",
    delay: 2500,
  },
  {
    id: 3,
    speaker: 'agent',
    text: "I'd be happy to help you change your flight. What's your confirmation code? You can spell it out letter by letter.",
    delay: 3000,
  },
  {
    id: 4,
    speaker: 'user',
    text: "It's C-Z-Y-B-Y-U",
    delay: 2000,
  },
  {
    id: 5,
    speaker: 'agent',
    text: "Got it! I found your reservation. You're flying from Pittsburgh to Dallas on Monday, January 19th at 7:06 AM. What would you like to change?",
    delay: 3500,
    showReservation: true,
  },
  {
    id: 6,
    speaker: 'user',
    text: "I'd like to move it to Tuesday instead.",
    delay: 2000,
  },
  {
    id: 7,
    speaker: 'agent',
    text: "I found a flight on Tuesday at 7:06 AM. Same route, Pittsburgh to Dallas. Would you like me to book that for you?",
    delay: 3000,
    showFlightOptions: true,
  },
  {
    id: 8,
    speaker: 'user',
    text: "Yes, please book that one.",
    delay: 1500,
  },
  {
    id: 9,
    speaker: 'agent',
    text: "Perfect! Your flight has been changed.",
    delay: 2000,
    showConfirmation: true,
  },
];

const DEMO_STEPS_ES = [
  {
    id: 1,
    speaker: 'agent',
    text: "¡Hola! Soy su asistente de American Airlines. Estoy aquí para ayudarle con su viaje. ¿En qué puedo servirle hoy?",
    delay: 2500,
  },
  {
    id: 2,
    speaker: 'user',
    text: "Necesito cambiar mi vuelo a otro día.",
    delay: 2500,
  },
  {
    id: 3,
    speaker: 'agent',
    text: "Con mucho gusto le ayudo a cambiar su vuelo. ¿Cuál es su código de confirmación? Puede deletrearlo letra por letra.",
    delay: 3500,
  },
  {
    id: 4,
    speaker: 'user',
    text: "Es C-Z-Y-B-Y-U",
    delay: 2000,
  },
  {
    id: 5,
    speaker: 'agent',
    text: "¡Perfecto! Encontré su reservación. Usted vuela de Pittsburgh a Dallas el lunes 19 de enero a las 7:06 AM. ¿Qué le gustaría cambiar?",
    delay: 4000,
    showReservation: true,
  },
  {
    id: 6,
    speaker: 'user',
    text: "Me gustaría cambiarlo al martes.",
    delay: 2000,
  },
  {
    id: 7,
    speaker: 'agent',
    text: "Encontré un vuelo el martes a las 7:06 AM. Misma ruta, Pittsburgh a Dallas. ¿Quiere que lo reserve?",
    delay: 3500,
    showFlightOptions: true,
  },
  {
    id: 8,
    speaker: 'user',
    text: "Sí, por favor reserve ese.",
    delay: 1500,
  },
  {
    id: 9,
    speaker: 'agent',
    text: "¡Perfecto! Su vuelo ha sido cambiado.",
    delay: 2000,
    showConfirmation: true,
  },
];

// Mock data - Flight PIT -> DFW, Monday January 19, 2026
const MOCK_RESERVATION = {
  confirmation_code: 'CZYBYU',
  passenger: {
    first_name: 'Margaret',
    last_name: 'Johnson',
    email: 'margaret.johnson@email.com',
  },
  flights: [{
    id: '1',
    flight_number: 'AA1845',
    origin: 'PIT',
    destination: 'DFW',
    departure_time: 'Monday, Jan 19 at 7:06 AM',
    arrival_time: 'Monday, Jan 19 at 9:50 AM',
    seat: '14A',
    status: 'scheduled' as const,
  }],
};

const MOCK_NEW_FLIGHT = {
  id: '2',
  flight_number: 'AA1845',
  origin: 'PIT',
  destination: 'DFW',
  departure_time: 'Tuesday, Jan 20 at 7:06 AM',
  arrival_time: 'Tuesday, Jan 20 at 9:50 AM',
  seat: '14A',
  status: 'scheduled' as const,
};

const TRIP_SUMMARY_EN = "Here's your trip summary! ✈️ You're now flying from Pittsburgh to Dallas on Tuesday, January 20th at 7:06 AM. Your seat is 14A, a window seat. Your confirmation code is C-Z-Y-B-Y-U. Have a wonderful trip!";

const TRIP_SUMMARY_ES = "¡Aquí está el resumen de su viaje! ✈️ Ahora usted vuela de Pittsburgh a Dallas el martes 20 de enero a las 7:06 AM. Su asiento es el 14A, junto a la ventana. Su código de confirmación es C-Z-Y-B-Y-U. ¡Que tenga un excelente viaje!";

interface SampleWorkflowDemoProps {
  className?: string;
}

export function SampleWorkflowDemo({ className }: SampleWorkflowDemoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<typeof DEMO_STEPS_EN>([]);
  const [showReservation, setShowReservation] = useState(false);
  const [showFlightOptions, setShowFlightOptions] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  const demoSteps = language === 'es' ? DEMO_STEPS_ES : DEMO_STEPS_EN;
  const tripSummary = language === 'es' ? TRIP_SUMMARY_ES : TRIP_SUMMARY_ES;

  // Reset demo
  const resetDemo = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
    setMessages([]);
    setShowReservation(false);
    setShowFlightOptions(false);
    setShowConfirmation(false);
  }, []);

  // Toggle language
  const toggleLanguage = useCallback(() => {
    resetDemo();
    setLanguage(prev => prev === 'en' ? 'es' : 'en');
  }, [resetDemo]);

  // Play next step
  useEffect(() => {
    if (!isPlaying || currentStep >= demoSteps.length) {
      if (currentStep >= demoSteps.length) {
        setIsPlaying(false);
      }
      return;
    }

    const step = demoSteps[currentStep];
    const timer = setTimeout(() => {
      setMessages(prev => [...prev, step]);

      if (step.showReservation) setShowReservation(true);
      if (step.showFlightOptions) setShowFlightOptions(true);
      if (step.showConfirmation) setShowConfirmation(true);

      setCurrentStep(prev => prev + 1);
    }, step.delay);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, demoSteps]);

  // Speak text using browser TTS
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }, [language]);

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-aa-blue to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">
              {language === 'es' ? 'Demo de Cambio de Vuelo' : 'Flight Change Demo'}
            </h3>
            <p className="text-sm opacity-90">
              {language === 'es' ? 'Flujo de trabajo completo' : 'Complete workflow walkthrough'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <Button
              onClick={toggleLanguage}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <Globe className="w-4 h-4 mr-1" />
              {language === 'es' ? 'English' : 'Español'}
            </Button>

            {/* Play/Pause */}
            {!showConfirmation && (
              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                size="sm"
                className="bg-white text-aa-blue hover:bg-gray-100"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
                    {language === 'es' ? 'Pausar' : 'Pause'}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    {currentStep === 0
                      ? (language === 'es' ? 'Iniciar Demo' : 'Start Demo')
                      : (language === 'es' ? 'Continuar' : 'Continue')}
                  </>
                )}
              </Button>
            )}

            {/* Reset */}
            {currentStep > 0 && (
              <Button
                onClick={resetDemo}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 bg-white/20 rounded-full h-2">
          <motion.div
            className="bg-white rounded-full h-2"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / demoSteps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 h-[500px] overflow-y-auto">
        {/* Empty state */}
        {messages.length === 0 && !isPlaying && (
          <div className="h-full flex items-center justify-center text-center text-gray-500">
            <div>
              <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">
                {language === 'es' ? 'Haga clic en "Iniciar Demo"' : 'Click "Start Demo"'}
              </p>
              <p className="text-sm">
                {language === 'es'
                  ? 'para ver el flujo completo de cambio de vuelo'
                  : 'to see the complete flight change workflow'}
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.speaker === 'user'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-aa-blue text-white'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <p className="text-base leading-relaxed">{message.text}</p>
                    {message.speaker === 'agent' && (
                      <button
                        onClick={() => speak(message.text)}
                        className="p-1 rounded hover:bg-white/20 flex-shrink-0"
                        title={language === 'es' ? 'Escuchar' : 'Listen'}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Show reservation card */}
          {showReservation && !showFlightOptions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="my-4"
            >
              <p className="text-sm text-gray-500 mb-2 text-center">
                {language === 'es' ? 'Reservación Actual' : 'Current Reservation'}
              </p>
              <FlightCard flight={MOCK_RESERVATION.flights[0]} />
            </motion.div>
          )}

          {/* Show flight options */}
          {showFlightOptions && !showConfirmation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="my-4"
            >
              <p className="text-sm text-gray-500 mb-2 text-center">
                {language === 'es' ? 'Nuevo Vuelo Disponible' : 'Available New Flight'}
              </p>
              <div className="border-2 border-green-500 rounded-xl">
                <FlightCard flight={MOCK_NEW_FLIGHT} />
              </div>
            </motion.div>
          )}

          {/* Show confirmation with trip summary */}
          {showConfirmation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="my-4"
            >
              <TripSummaryCard
                summary={language === 'es' ? TRIP_SUMMARY_ES : TRIP_SUMMARY_EN}
                summaryShort={language === 'es' ? 'Vuelo PIT → DFW, Código: CZYBYU' : 'Flight PIT → DFW, Code: CZYBYU'}
                confirmationCode="CZYBYU"
                origin="Pittsburgh (PIT)"
                destination="Dallas (DFW)"
                departureTime="Tuesday, Jan 20 at 7:06 AM"
                seat="14A"
                language={language}
                isChange={true}
                changes={language === 'es'
                  ? ['Fecha: Lunes → Martes']
                  : ['Date: Monday → Tuesday']}
              />
            </motion.div>
          )}

          {/* Typing indicator */}
          {isPlaying && currentStep < demoSteps.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex ${demoSteps[currentStep]?.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`px-4 py-3 rounded-2xl ${
                demoSteps[currentStep]?.speaker === 'user'
                  ? 'bg-gray-100'
                  : 'bg-aa-blue'
              }`}>
                <div className="flex gap-1">
                  <span className={`w-2 h-2 rounded-full animate-bounce ${
                    demoSteps[currentStep]?.speaker === 'user' ? 'bg-gray-400' : 'bg-white/70'
                  }`} style={{ animationDelay: '0ms' }} />
                  <span className={`w-2 h-2 rounded-full animate-bounce ${
                    demoSteps[currentStep]?.speaker === 'user' ? 'bg-gray-400' : 'bg-white/70'
                  }`} style={{ animationDelay: '150ms' }} />
                  <span className={`w-2 h-2 rounded-full animate-bounce ${
                    demoSteps[currentStep]?.speaker === 'user' ? 'bg-gray-400' : 'bg-white/70'
                  }`} style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Completion footer */}
      {showConfirmation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 border-t border-green-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-medium">
                {language === 'es' ? '¡Demo completado!' : 'Demo complete!'}
              </span>
            </div>
            <Button onClick={resetDemo} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              {language === 'es' ? 'Reiniciar' : 'Restart'}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
