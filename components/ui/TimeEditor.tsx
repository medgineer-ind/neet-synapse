import React, { useState, useEffect } from 'react';
import { formatDurationForInput, parseDurationFromInput, formatDuration } from '../../lib/utils';
import { Input } from './StyledComponents';

export const TimeEditor: React.FC<{ initialDuration: number; onDurationChange: (newDuration: number) => void; label?: string; }> = ({ initialDuration, onDurationChange, label = "Logged Time (HH:MM:SS)" }) => {
    const [timeString, setTimeString] = useState(() => formatDurationForInput(initialDuration));

    useEffect(() => {
        setTimeString(formatDurationForInput(initialDuration));
    }, [initialDuration]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTimeString = e.target.value;
        setTimeString(newTimeString);
        const newDuration = parseDurationFromInput(newTimeString);
        onDurationChange(newDuration);
    };

    return (
        <div className="space-y-2 border-t border-white/10 pt-4 mt-4">
            <label className="block font-display text-lg mb-1">{label}</label>
            <Input
                type="text"
                value={timeString}
                onChange={handleChange}
                pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
                placeholder="HH:MM:SS"
            />
            <p className="text-xs text-gray-400 mt-1">
                You can edit the time if you forgot to start/stop the timer. Current value: {formatDuration(parseDurationFromInput(timeString))}
            </p>
        </div>
    );
};
