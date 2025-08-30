/**
 * Calendar Component - Simple date picker
 */

import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  mode: 'single';
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  initialFocus?: boolean;
}

export const Calendar: React.FC<CalendarProps> = ({
  mode,
  selected,
  onSelect,
  initialFocus
}) => {
  const [currentDate, setCurrentDate] = React.useState(selected || new Date());

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const selectDate = (day: number) => {
    const selectedDate = new Date(year, month, day);
    if (onSelect) {
      onSelect(selectedDate);
    }
  };

  const isSelected = (day: number) => {
    if (!selected) return false;
    return selected.getFullYear() === year &&
           selected.getMonth() === month &&
           selected.getDate() === day;
  };

  const isToday = (day: number) => {
    return today.getFullYear() === year &&
           today.getMonth() === month &&
           today.getDate() === day;
  };

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <Button
          key={day}
          variant={isSelected(day) ? 'default' : 'ghost'}
          className={`p-2 h-8 w-8 text-sm ${
            isToday(day) ? 'ring-2 ring-primary ring-offset-1' : ''
          }`}
          onClick={() => selectDate(day)}
        >
          {day}
        </Button>
      );
    }

    return days;
  };

  return (
    <div className="p-3 space-y-3">
      {/* Month/Year Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-medium">
          {monthNames[month]} {year}
        </div>
        <Button variant="ghost" size="sm" onClick={goToNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm text-muted-foreground">
        {dayNames.map(day => (
          <div key={day} className="p-2 font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>

      {/* Today Button */}
      <div className="pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            const today = new Date();
            setCurrentDate(today);
            if (onSelect) {
              onSelect(today);
            }
          }}
        >
          Today
        </Button>
      </div>
    </div>
  );
};