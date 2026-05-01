import { useEffect, useMemo, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { Button } from './Button';

const pad = (value) => String(value).padStart(2, '0');
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const hours = Array.from({ length: 12 }, (_, index) => index + 1);
const minutes = Array.from({ length: 12 }, (_, index) => index * 5);

const toLocalValue = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const parseValue = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const buildMonth = (displayMonth) => {
  const first = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1);
  const blanks = Array.from({ length: first.getDay() }, () => null);
  const days = Array.from(
    { length: new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0).getDate() },
    (_, index) => new Date(displayMonth.getFullYear(), displayMonth.getMonth(), index + 1)
  );
  return [...blanks, ...days];
};

export function DateTimePicker({ value, onChange }) {
  const selected = parseValue(value);
  const [mode, setMode] = useState(null);
  const [displayMonth, setDisplayMonth] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1));
  const [draftHour, setDraftHour] = useState(9);
  const [draftMinute, setDraftMinute] = useState(15);
  const [draftPeriod, setDraftPeriod] = useState('AM');
  const days = useMemo(() => buildMonth(displayMonth), [displayMonth]);
  const selectedHour12 = selected.getHours() % 12 || 12;
  const selectedMinute = Math.round(selected.getMinutes() / 5) * 5;
  const selectedPeriod = selected.getHours() >= 12 ? 'PM' : 'AM';
  const selectedTime = `${pad(selectedHour12)}:${pad(selected.getMinutes())} ${selectedPeriod}`;

  useEffect(() => {
    if (mode === 'time') {
      setDraftHour(selectedHour12);
      setDraftMinute(selectedMinute === 60 ? 55 : selectedMinute);
      setDraftPeriod(selectedPeriod);
    }
  }, [mode, selectedHour12, selectedMinute, selectedPeriod]);

  const setDate = (date) => {
    const next = new Date(date);
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    onChange(toLocalValue(next));
    setMode(null);
  };

  const commitTime = () => {
    let hours24 = draftHour % 12;
    if (draftPeriod === 'PM') hours24 += 12;
    const next = new Date(selected);
    next.setHours(hours24, draftMinute, 0, 0);
    onChange(toLocalValue(next));
    setMode(null);
  };

  return (
    <>
      <div className="datetime-pair">
        <button type="button" className="datetime-trigger" onClick={() => setMode('date')}>
          <CalendarDays size={17} color="var(--color-accent)" />
          <span>{selected.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </button>
        <button type="button" className="datetime-trigger" onClick={() => setMode('time')}>
          <Clock size={17} color="var(--color-accent)" />
          <span>{selectedTime}</span>
        </button>
      </div>

      <AnimatePresence>
        {mode ? (
          <Motion.div
            className="picker-backdrop"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Motion.div
              className="picker-panel"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="spread" style={{ marginBottom: 'var(--space-4)' }}>
                <strong>{mode === 'date' ? 'Choose date' : 'Choose time'}</strong>
                <Button size="icon" variant="ghost" onClick={() => setMode(null)} aria-label="Close picker"><X size={16} /></Button>
              </div>

              {mode === 'date' ? (
                <>
                  <div className="picker-month">
                    <Button size="icon" variant="ghost" onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))} aria-label="Previous month">
                      <ChevronLeft size={16} />
                    </Button>
                    <strong>{monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}</strong>
                    <Button size="icon" variant="ghost" onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))} aria-label="Next month">
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                  <div className="calendar-grid">
                    {weekDays.map((day, index) => <span className="calendar-head" key={`${day}-${index}`}>{day}</span>)}
                    {days.map((day, index) => day ? (
                      <button
                        key={day.toISOString()}
                        type="button"
                        className={sameDay(day, selected) ? 'calendar-day calendar-day-active' : 'calendar-day'}
                        onClick={() => setDate(day)}
                      >
                        {day.getDate()}
                      </button>
                    ) : <span key={`blank-${index}`} />)}
                  </div>
                </>
              ) : (
                <>
                  <div className="time-picker-display">{pad(draftHour)}:{pad(draftMinute)} {draftPeriod}</div>
                  <div className="time-picker-columns">
                    <div className="time-picker-section">
                      <span>Hour</span>
                      <div className="time-grid">
                        {hours.map((hour) => (
                          <button
                            key={hour}
                            type="button"
                            className={hour === draftHour ? 'time-option time-option-active' : 'time-option'}
                            onClick={() => setDraftHour(hour)}
                          >
                            {hour}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="time-picker-section">
                      <span>Minute</span>
                      <div className="time-grid">
                        {minutes.map((minute) => (
                          <button
                            key={minute}
                            type="button"
                            className={minute === draftMinute ? 'time-option time-option-active' : 'time-option'}
                            onClick={() => setDraftMinute(minute)}
                          >
                            {pad(minute)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="time-picker-section">
                      <span>Period</span>
                      <div className="ampm-grid">
                        {['AM', 'PM'].map((period) => (
                          <button
                            key={period}
                            type="button"
                            className={period === draftPeriod ? 'time-option time-option-active' : 'time-option'}
                            onClick={() => setDraftPeriod(period)}
                          >
                            {period}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button type="button" onClick={commitTime}>Set time</Button>
                  </div>
                </>
              )}
            </Motion.div>
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
