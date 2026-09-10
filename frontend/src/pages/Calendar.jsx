import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users
} from 'lucide-react';

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState('May 2025');

  // Seed events mapped to calendar day index (1-31)
  const events = {
    5: [
      { title: 'Project kick-off', type: 'project', color: '#3b82f6' }
    ],
    10: [
      { title: 'Rohit Leave (Sick)', type: 'leave', color: '#ef4444' }
    ],
    11: [
      { title: 'Rohit Leave (Sick)', type: 'leave', color: '#ef4444' }
    ],
    12: [
      { title: 'Project Review', type: 'project', color: '#3b82f6' }
    ],
    15: [
      { title: 'Vikas Leave (CL)', type: 'leave', color: '#ef4444' }
    ],
    18: [
      { title: 'Sprint Retro', type: 'meeting', color: '#10b981' }
    ],
    22: [
      { title: 'Neha Leave (Earned)', type: 'leave', color: '#ef4444' }
    ],
    28: [
      { title: 'Payroll Payout Day', type: 'payroll', color: '#f59e0b' }
    ]
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Generating a simple 35-day grid representing May 2025 (Starts on Thursday)
  const startOffset = 4; // Thursday index
  const daysInMonth = 31;
  const gridCells = [];

  // Empty cells for offset
  for (let i = 0; i < startOffset; i++) {
    gridCells.push({ day: null, currentMonth: false });
  }

  // Active days
  for (let i = 1; i <= daysInMonth; i++) {
    gridCells.push({ day: i, currentMonth: true });
  }

  // Remaining cells to make full rows (multiple of 7)
  const totalCellsNeeded = Math.ceil(gridCells.length / 7) * 7;
  const trailingCells = totalCellsNeeded - gridCells.length;
  for (let i = 1; i <= trailingCells; i++) {
    gridCells.push({ day: i, currentMonth: false });
  }

  return (
    <div className="content-pane" style={{ gap: '20px' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Enterprise Calendar</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Coordinate corporate events, project delivery deadlines, client meetings, and leave slots.
          </p>
        </div>

        <button className="btn btn-primary">
          <Plus size={16} />
          Add Event
        </button>
      </div>

      {/* Control bar */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CalendarIcon size={20} className="text-primary" style={{ color: 'var(--color-primary)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{currentMonth}</h3>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ padding: '8px' }}>
            <ChevronLeft size={16} />
          </button>
          <button className="btn btn-secondary" style={{ padding: '8px' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid & Event Details panel */}
      <div className="grid-2-1" style={{ gridTemplateColumns: '2fr 1fr' }}>
        
        {/* Calendar Grid */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div className="calendar-grid">
            {/* Week Headers */}
            {daysOfWeek.map(day => (
              <div key={day} className="calendar-day-name">{day}</div>
            ))}

            {/* Grid days */}
            {gridCells.map((cell, idx) => {
              const dayEvents = cell.day && cell.currentMonth ? (events[cell.day] || []) : [];
              return (
                <div 
                  key={idx} 
                  className={`calendar-cell ${!cell.currentMonth ? 'calendar-cell-inactive' : ''}`}
                  style={{ minHeight: '90px' }}
                >
                  <span className="calendar-date-number" style={{ color: cell.currentMonth ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {cell.day}
                  </span>
                  
                  <div className="calendar-events-container">
                    {dayEvents.map((evt, eIdx) => (
                      <div 
                        key={eIdx} 
                        className="calendar-event"
                        style={{ 
                          backgroundColor: `${evt.color}15`, 
                          color: evt.color, 
                          borderLeft: `3px solid ${evt.color}`,
                          paddingLeft: '4px'
                        }}
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Info Details */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Today's Agenda</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { title: 'Project Review Meeting', time: '10:00 AM - 11:30 AM', loc: 'Conference Room B / Meet', attendees: 'Engineering Team', color: '#3b82f6' },
              { title: 'Client Presentation', time: '02:00 PM - 03:00 PM', loc: 'Virtual Room', attendees: 'Harsh Saini, Priya Singh', color: '#10b981' },
            ].map((agenda, idx) => (
              <div key={idx} style={{ 
                padding: '14px', 
                backgroundColor: 'var(--input-bg)', 
                borderLeft: `4px solid ${agenda.color}`, 
                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <span style={{ fontWeight: 650, fontSize: '13px', color: 'var(--text-main)' }}>{agenda.title}</span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={12} />
                    <span>{agenda.time}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={12} />
                    <span>{agenda.loc}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={12} />
                    <span>{agenda.attendees}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', padding: '12px', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary-light)', display: 'block' }}>Tip: Sync with Google Calendar</span>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
              Click on settings in the bottom sidebar menu to link your enterprise calendars.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Calendar;
