import { useState, useCallback, useRef, useMemo } from 'react';
import { DAYS, TIME_SLOTS, ScheduleData, Category, getCategoryColor } from '@/lib/schedule-types';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  schedule: ScheduleData;
  categories: Category[];
  onChange: (schedule: ScheduleData) => void;
}

export default function ScheduleGrid({ schedule, categories, onChange }: Props) {
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ day: number; slot: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ day: number; slot: number } | null>(null);
  const [showAutocomplete, setShowAutocomplete] = useState<{ day: string; slot: number } | null>(null);
  const [filterText, setFilterText] = useState('');
  const [collapsedSleepRanges, setCollapsedSleepRanges] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const catNames = categories.map(c => c.name).filter(Boolean);

  const isInSelection = (dayIdx: number, slotIdx: number) => {
    if (!selectionStart || !selectionEnd) return false;
    const minDay = Math.min(selectionStart.day, selectionEnd.day);
    const maxDay = Math.max(selectionStart.day, selectionEnd.day);
    const minSlot = Math.min(selectionStart.slot, selectionEnd.slot);
    const maxSlot = Math.max(selectionStart.slot, selectionEnd.slot);
    return dayIdx >= minDay && dayIdx <= maxDay && slotIdx >= minSlot && slotIdx <= maxSlot;
  };

  const handleMouseDown = (dayIdx: number, slotIdx: number) => {
    setSelecting(true);
    setSelectionStart({ day: dayIdx, slot: slotIdx });
    setSelectionEnd({ day: dayIdx, slot: slotIdx });
  };

  const handleMouseEnter = (dayIdx: number, slotIdx: number) => {
    if (selecting) {
      setSelectionEnd({ day: dayIdx, slot: slotIdx });
    }
  };

  const handleMouseUp = () => {
    setSelecting(false);
  };

  const applyToSelection = useCallback((value: string) => {
    if (!selectionStart || !selectionEnd) return;
    const newSchedule = { ...schedule };
    const minDay = Math.min(selectionStart.day, selectionEnd.day);
    const maxDay = Math.max(selectionStart.day, selectionEnd.day);
    const minSlot = Math.min(selectionStart.slot, selectionEnd.slot);
    const maxSlot = Math.max(selectionStart.slot, selectionEnd.slot);

    for (let d = minDay; d <= maxDay; d++) {
      const day = DAYS[d];
      const slots = [...newSchedule[day]];
      for (let s = minSlot; s <= maxSlot; s++) {
        slots[s] = value;
      }
      newSchedule[day] = slots;
    }
    onChange(newSchedule);
    setShowAutocomplete(null);
    setSelectionStart(null);
    setSelectionEnd(null);
  }, [schedule, selectionStart, selectionEnd, onChange]);

  const handleCellClick = (day: string, slotIdx: number) => {
    setShowAutocomplete({ day, slot: slotIdx });
    setFilterText('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCopy = (day: string, slotIdx: number) => {
    setCopiedCell(schedule[day as keyof ScheduleData][slotIdx]);
  };

  const handlePaste = (day: string, slotIdx: number) => {
    if (copiedCell !== null) {
      const newSchedule = { ...schedule };
      const slots = [...newSchedule[day as keyof ScheduleData]];
      slots[slotIdx] = copiedCell;
      newSchedule[day as keyof ScheduleData] = slots;
      onChange(newSchedule);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, day: string, slotIdx: number) => {
    if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
      handleCopy(day, slotIdx);
    } else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      handlePaste(day, slotIdx);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      const newSchedule = { ...schedule };
      const slots = [...newSchedule[day as keyof ScheduleData]];
      slots[slotIdx] = '';
      newSchedule[day as keyof ScheduleData] = slots;
      onChange(newSchedule);
    }
  };

  const filteredCats = catNames.filter(n => n.toLowerCase().includes(filterText.toLowerCase()));

  // Detect contiguous ranges where ALL days are "Sleeping"
  const sleepRanges = useMemo(() => {
    const ranges: { start: number; end: number; key: string }[] = [];
    let rangeStart: number | null = null;
    for (let i = 0; i < 48; i++) {
      const allSleeping = DAYS.every(day => schedule[day][i] === 'Sleeping');
      if (allSleeping) {
        if (rangeStart === null) rangeStart = i;
      } else {
        if (rangeStart !== null) {
          const key = `${rangeStart}-${i - 1}`;
          ranges.push({ start: rangeStart, end: i - 1, key });
          rangeStart = null;
        }
      }
    }
    if (rangeStart !== null) {
      const key = `${rangeStart}-47`;
      ranges.push({ start: rangeStart, end: 47, key });
    }
    return ranges;
  }, [schedule]);

  // Auto-collapse sleep ranges that have 3+ slots
  const effectiveCollapsed = useMemo(() => {
    const set = new Set(collapsedSleepRanges);
    // Auto-collapse new ranges on first detection
    for (const r of sleepRanges) {
      if (r.end - r.start >= 2 && !set.has(`expanded-${r.key}`)) {
        set.add(r.key);
      }
    }
    return set;
  }, [sleepRanges, collapsedSleepRanges]);

  const toggleSleepRange = (key: string) => {
    setCollapsedSleepRanges(prev => {
      const next = new Set(prev);
      if (effectiveCollapsed.has(key)) {
        next.delete(key);
        next.add(`expanded-${key}`);
      } else {
        next.delete(`expanded-${key}`);
        next.add(key);
      }
      return next;
    });
  };

  // Build visible rows with collapse logic
  type RowItem = { type: 'slot'; time: string; index: number } | { type: 'collapsed'; range: { start: number; end: number; key: string } };
  const visibleRows = useMemo(() => {
    const rows: RowItem[] = [];
    let skipUntil = -1;
    for (let i = 0; i < 48; i++) {
      if (i <= skipUntil) continue;
      const range = sleepRanges.find(r => r.start === i);
      if (range && effectiveCollapsed.has(range.key)) {
        rows.push({ type: 'collapsed', range });
        skipUntil = range.end;
      } else {
        rows.push({ type: 'slot', time: TIME_SLOTS[i], index: i });
      }
    }
    return rows;
  }, [sleepRanges, effectiveCollapsed]);

  return (
    <div className="relative" onMouseUp={handleMouseUp}>
      <div className="overflow-auto schedule-grid rounded-lg border bg-card">
        <table className="w-full border-collapse text-xs" style={{ minWidth: 800 }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card p-2 text-left text-muted-foreground font-medium border-b w-16">Time</th>
              {DAYS.map(day => (
                <th key={day} className="p-2 text-center font-display font-semibold text-foreground border-b min-w-[100px]">
                  {day.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              if (row.type === 'collapsed') {
                const { range } = row;
                const slotCount = range.end - range.start + 1;
                const sleepColor = getCategoryColor('Sleeping', categories);
                return (
                  <tr
                    key={`collapsed-${range.key}`}
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => toggleSleepRange(range.key)}
                  >
                    <td className="sticky left-0 z-10 p-1 font-mono text-[10px] border-r whitespace-nowrap" style={{ backgroundColor: sleepColor, color: 'white' }}>
                      <div className="flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" />
                        {TIME_SLOTS[range.start]}–{TIME_SLOTS[Math.min(range.end + 1, 47)]}
                      </div>
                    </td>
                    {DAYS.map(day => (
                      <td key={day} className="p-0 border-r border-b" style={{ backgroundColor: sleepColor }}>
                        <div className="h-6 flex items-center justify-center text-[10px] font-medium" style={{ color: 'white' }}>
                          {day === 'Monday' ? `Sleeping (${(slotCount / 2).toFixed(1)}h)` : ''}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              }

              const { time, index: slotIdx } = row;
              // Check if this slot is the first in an expanded sleep range
              const expandedRange = sleepRanges.find(r => r.start === slotIdx && !effectiveCollapsed.has(r.key));

              return (
                <tr key={time} className={slotIdx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                  <td className="sticky left-0 z-10 bg-inherit p-1 text-muted-foreground font-mono text-[10px] border-r whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {expandedRange && (
                        <button onClick={() => toggleSleepRange(expandedRange.key)} className="text-muted-foreground hover:text-foreground">
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      )}
                      {time}
                    </div>
                  </td>
                  {DAYS.map((day, dayIdx) => {
                    const value = schedule[day][slotIdx];
                    const bgColor = value ? getCategoryColor(value, categories) : 'transparent';
                    const selected = isInSelection(dayIdx, slotIdx);
                    const isActive = showAutocomplete?.day === day && showAutocomplete?.slot === slotIdx;

                    return (
                      <td
                        key={day}
                        className={`p-0 border-r border-b cursor-pointer transition-all ${selected ? 'ring-2 ring-inset ring-primary' : ''} ${value ? 'cell-filled' : 'hover:bg-muted/50'}`}
                        style={{ backgroundColor: bgColor }}
                        tabIndex={0}
                        onMouseDown={() => handleMouseDown(dayIdx, slotIdx)}
                        onMouseEnter={() => handleMouseEnter(dayIdx, slotIdx)}
                        onClick={() => handleCellClick(day, slotIdx)}
                        onKeyDown={(e) => handleKeyDown(e, day, slotIdx)}
                      >
                        <div className="h-6 flex items-center justify-center text-[10px] font-medium" style={{ color: value ? 'white' : undefined }}>
                          {value && !isActive ? value : ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Autocomplete dropdown */}
      {showAutocomplete && (
        <div className="fixed inset-0 z-50" onClick={() => setShowAutocomplete(null)}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border rounded-lg shadow-lg p-3 w-64 space-y-2" onClick={e => e.stopPropagation()}>
            <input
              ref={inputRef}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Type or select category..."
              className="w-full h-8 px-2 text-sm border rounded bg-background text-foreground outline-none focus:ring-1 ring-ring"
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredCats.map(name => (
                <button
                  key={name}
                  className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                  onClick={() => {
                    if (selectionStart && selectionEnd) {
                      applyToSelection(name);
                    } else {
                      const newSchedule = { ...schedule };
                      const slots = [...newSchedule[showAutocomplete.day as keyof ScheduleData]];
                      slots[showAutocomplete.slot] = name;
                      newSchedule[showAutocomplete.day as keyof ScheduleData] = slots;
                      onChange(newSchedule);
                      setShowAutocomplete(null);
                    }
                  }}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: getCategoryColor(name, categories) }} />
                  <span className="text-foreground">{name}</span>
                </button>
              ))}
              <button
                className="w-full text-left px-2 py-1.5 rounded text-sm text-muted-foreground hover:bg-muted transition-colors"
                onClick={() => {
                  const day = showAutocomplete.day as keyof ScheduleData;
                  const newSchedule = { ...schedule };
                  const slots = [...newSchedule[day]];
                  slots[showAutocomplete.slot] = '';
                  newSchedule[day] = slots;
                  onChange(newSchedule);
                  setShowAutocomplete(null);
                }}
              >
                ✕ Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection action bar */}
      {selectionStart && selectionEnd && !showAutocomplete && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card border shadow-xl rounded-full px-4 py-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Fill selection:</span>
          {catNames.map(name => (
            <button
              key={name}
              className="w-6 h-6 rounded-full border-2 border-transparent hover:border-foreground transition-all"
              title={name}
              style={{ background: getCategoryColor(name, categories) }}
              onClick={() => applyToSelection(name)}
            />
          ))}
          <button
            className="text-xs text-muted-foreground hover:text-foreground ml-2"
            onClick={() => applyToSelection('')}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
