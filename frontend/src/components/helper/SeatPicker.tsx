'use client';

import { useState, useEffect } from 'react';
import { Loader2, User, DollarSign } from 'lucide-react';
import { getHelperSeats } from '@/lib/api';
import type { SeatInfo } from '@/types';

interface SeatPickerProps {
  linkId: string;
  onSelect: (seat: string) => void;
  onCancel: () => void;
}

export default function SeatPicker({ linkId, onSelect, onCancel }: SeatPickerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seats, setSeats] = useState<SeatInfo[]>([]);
  const [currentSeat, setCurrentSeat] = useState<string | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [flightNumber, setFlightNumber] = useState<string>('');
  const [totalRows, setTotalRows] = useState(30);

  useEffect(() => {
    async function loadSeats() {
      try {
        setLoading(true);
        setError(null);
        const data = await getHelperSeats(linkId);
        setSeats(data.seats);
        setCurrentSeat(data.current_seat);
        setFlightNumber(data.flight_number);
        setTotalRows(data.total_rows);
      } catch (err) {
        setError('Failed to load seat map');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSeats();
  }, [linkId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading seat map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={onCancel}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Go back
        </button>
      </div>
    );
  }

  // Organize seats by row
  const seatsByRow: Record<number, SeatInfo[]> = {};
  seats.forEach((seat) => {
    if (!seatsByRow[seat.row]) {
      seatsByRow[seat.row] = [];
    }
    seatsByRow[seat.row].push(seat);
  });

  const selectedSeatInfo = seats.find((s) => s.id === selectedSeat);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900">Select a Seat</p>
        <p className="text-sm text-gray-500">Flight {flightNumber}</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-gray-300" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300" />
          <span>Extra Legroom</span>
        </div>
      </div>

      {/* Seat map */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-fit mx-auto" style={{ width: '280px' }}>
          {/* Column headers */}
          <div className="flex justify-center gap-1 mb-2 text-xs text-gray-500">
            <span className="w-6 text-center">A</span>
            <span className="w-6 text-center">B</span>
            <span className="w-6 text-center">C</span>
            <span className="w-4" /> {/* Aisle */}
            <span className="w-6 text-center">D</span>
            <span className="w-6 text-center">E</span>
            <span className="w-6 text-center">F</span>
          </div>

          {/* Rows */}
          <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
            {Object.entries(seatsByRow).map(([rowNum, rowSeats]) => (
              <div key={rowNum} className="flex items-center gap-1">
                <span className="w-6 text-xs text-gray-400 text-right pr-1">{rowNum}</span>
                <div className="flex gap-1">
                  {/* Left side (A, B, C) */}
                  {rowSeats.filter((s) => ['A', 'B', 'C'].includes(s.column)).map((seat) => (
                    <SeatButton
                      key={seat.id}
                      seat={seat}
                      isSelected={selectedSeat === seat.id}
                      isCurrent={currentSeat === seat.id}
                      onClick={() => seat.available && setSelectedSeat(seat.id)}
                    />
                  ))}

                  {/* Aisle */}
                  <div className="w-4" />

                  {/* Right side (D, E, F) */}
                  {rowSeats.filter((s) => ['D', 'E', 'F'].includes(s.column)).map((seat) => (
                    <SeatButton
                      key={seat.id}
                      seat={seat}
                      isSelected={selectedSeat === seat.id}
                      isCurrent={currentSeat === seat.id}
                      onClick={() => seat.available && setSelectedSeat(seat.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected seat info */}
      {selectedSeatInfo && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">Seat {selectedSeatInfo.id}</p>
              <p className="text-sm text-blue-700 capitalize">
                {selectedSeatInfo.type} seat
                {selectedSeatInfo.is_exit_row && ' (Exit Row)'}
                {selectedSeatInfo.is_extra_legroom && !selectedSeatInfo.is_exit_row && ' (Extra Legroom)'}
              </p>
            </div>
            {selectedSeatInfo.price_difference > 0 && (
              <div className="flex items-center text-blue-700">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">+${selectedSeatInfo.price_difference}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={() => selectedSeat && onSelect(selectedSeat)}
          disabled={!selectedSeat}
          className={`
            px-6 py-2 rounded-lg font-medium transition-colors
            ${selectedSeat
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          Select Seat
        </button>
      </div>
    </div>
  );
}

interface SeatButtonProps {
  seat: SeatInfo;
  isSelected: boolean;
  isCurrent: boolean;
  onClick: () => void;
}

function SeatButton({ seat, isSelected, isCurrent, onClick }: SeatButtonProps) {
  let bgClass = 'bg-green-100 border-green-300 hover:bg-green-200 cursor-pointer';

  if (!seat.available) {
    bgClass = 'bg-gray-300 cursor-not-allowed';
  } else if (isSelected) {
    bgClass = 'bg-blue-500 border-blue-600 text-white';
  } else if (isCurrent) {
    bgClass = 'bg-yellow-100 border-yellow-400';
  } else if (seat.is_extra_legroom) {
    bgClass = 'bg-purple-100 border-purple-300 hover:bg-purple-200 cursor-pointer';
  }

  return (
    <button
      onClick={onClick}
      disabled={!seat.available}
      className={`
        w-6 h-6 rounded text-xs font-medium border transition-colors
        flex items-center justify-center
        ${bgClass}
      `}
      title={`Seat ${seat.id}${seat.is_exit_row ? ' (Exit Row)' : ''}${seat.is_extra_legroom ? ' (Extra Legroom)' : ''}${!seat.available ? ' (Occupied)' : ''}`}
    >
      {isCurrent && !isSelected && <User className="h-3 w-3" />}
    </button>
  );
}
