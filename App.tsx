


import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import Planner from './components/Planner';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import TestPlanner from './components/TestPlanner';
import Timeline from './components/Timeline';
import Mentor from './components/Mentor';
import SelfTracker from './components/SelfTracker';
import Insights from './components/Insights';
import { ClipboardListIcon, LayoutDashboardIcon, SettingsIcon, FileTextIcon, CalendarClockIcon, PlayIcon, PauseIcon, StopCircleIcon, MegaphoneIcon, XIcon, BrainCircuitIcon, ActivityIcon, HistoryIcon, AlertTriangleIcon, MaximizeIcon, MinimizeIcon, CoffeeIcon, UtensilsIcon, DumbbellIcon, PaintBrushIcon, BedIcon, PlusIcon, BarChartIcon, WrenchIcon } from './components/ui/Icons';
import { Task, ActiveTimer, StudySession, TestPlan, TopicPracticeAttempt, RevisionAttempt, ActiveBreak, BreakType, BreakSession, TaskType } from './types';
import LiveBackground from './components/LiveBackground';
import useStorageUsage from './hooks/useStorageUsage';
import { generatePerformanceSummary, formatDuration, cn, getCurrentWeekString } from './lib/utils';
import { Button, Modal, Input, Textarea, Select } from './components/ui/StyledComponents';
import { TimeEditor } from './components/ui/TimeEditor';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, setMiscItem, getMiscItem } from './services/db';
import DailyReport from './components/DailyReport';
import WeeklyReport from './components/WeeklyReport';
import MonthlyReport from './components/MonthlyReport';
import OverallReport from './components/OverallReport';


// --- ADMIN NOTIFICATION CONFIG ---
// To show a new notification, change the id, update content, and set active to true.
const adminNotificationConfig = {
  id: 'update-2024-07-30-theme', // IMPORTANT: Change this ID for every new notification to re-show it.
  active: true, // Set to 'false' to hide the notification entirely.
  title: 'New "Solaris" Theme!',
  message: 'The app has been updated with a warmer, eye-friendly color palette to reduce blue light strain during long study sessions. Enjoy the new look!',
  link: undefined,
  linkText: undefined,
};

// --- Admin Notification Component ---
const AdminNotification: React.FC = () => {
    const { id, active, title, message, link, linkText } = adminNotificationConfig;
    const storageKey = `dismissed_notification_${id}`;
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (active) {
            try {
                const isDismissed = window.localStorage.getItem(storageKey);
                if (!isDismissed) {
                    setIsVisible(true);
                }
            } catch (error) {
                console.error("Could not access localStorage:", error);
                setIsVisible(true);
            }
        }
    }, [id, active, storageKey]);

    const handleDismiss = () => {
        try {
            window.localStorage.setItem(storageKey, 'true');
        } catch (error) {
            console.error("Could not write to localStorage:", error);
        }
        setIsVisible(false);
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="sticky top-16 z-40 bg-slate-900/70 backdrop-blur-xl border-b border-brand-amber-500/20 animate-fadeIn" role="alert">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3">
                        <MegaphoneIcon className="w-6 h-6 text-brand-amber-400 flex-shrink-0" />
                        <div className="text-sm">
                            <p className="font-display font-bold text-brand-amber-400">{title}</p>
                            <p className="text-gray-300">
                                {message}{' '}
                                {link && linkText && (
                                    <a href={link} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-amber-300 font-semibold">
                                        {linkText}
                                    </a>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="p-1 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                        aria-label="Dismiss notification"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Storage Warning Banner ---
const StorageWarningBanner: React.FC<{ usagePercentage: number }> = ({ usagePercentage }) => {
    const storageKey = 'dismissed_storage_warning';
    const [isVisible, setIsVisible] = useState(false);

    const isCritical = usagePercentage > 95;
    const isWarning = usagePercentage > 80;

    useEffect(() => {
        if (isWarning) {
            const isDismissed = window.sessionStorage.getItem(storageKey);
            if (!isDismissed) {
                setIsVisible(true);
            }
        } else {
            setIsVisible(false);
        }
    }, [isWarning, storageKey, usagePercentage]);

    const handleDismiss = () => {
        window.sessionStorage.setItem(storageKey, 'true');
        setIsVisible(false);
    };

    if (!isVisible) {
        return null;
    }
    
    const bannerClass = isCritical 
        ? "bg-red-900/70 border-red-500/30" 
        : "bg-yellow-900/70 border-yellow-500/30";
    const iconColor = isCritical ? "text-red-400" : "text-yellow-400";
    const title = isCritical ? "Critical Storage Alert" : "Storage Capacity Warning";
    const message = isCritical 
        ? "You are about to run out of storage space. To prevent data loss, please export your data now and consider removing old entries." 
        : "Your local storage is getting full. It's recommended to export a backup of your data soon.";

    return (
         <div className={`sticky top-16 z-40 backdrop-blur-xl border-b animate-fadeIn ${bannerClass}`} role="alert">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3">
                        <AlertTriangleIcon className={`w-6 h-6 ${iconColor} flex-shrink-0`} />
                        <div className="text-sm">
                            <p className={`font-display font-bold ${iconColor}`}>{title} ({usagePercentage.toFixed(1)}% full)</p>
                            <p className="text-gray-300">
                                {message}{' '}
                                <Link to="/settings" className="underline hover:text-white font-semibold">
                                    Go to Settings
                                </Link>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="p-1 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                        aria-label="Dismiss notification"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Global Timer Components ---
const CircularProgress: React.FC<{ progress: number; isUrgent: boolean; isOverTime: boolean; className?: string; color?: 'amber' | 'orange' }> = ({ progress, isUrgent, isOverTime, className, color = 'amber' }) => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    
    const colorClasses = {
        amber: {
            main: 'text-brand-amber-400',
            glow: 'animate-pulse-glow-amber',
        },
        orange: {
            main: 'text-brand-orange-400',
            glow: 'animate-pulse-glow-orange',
        },
    };
    
    const progressColorClass = isOverTime ? 'text-red-500' : isUrgent ? 'text-yellow-500' : colorClasses[color].main;

    return (
        <div className={cn("relative", className)}>
            <svg className="w-full h-full" viewBox="0 0 200 200">
                <defs>
                    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                        <stop offset="60%" stopColor={isOverTime ? 'rgba(239, 68, 68, 0.1)' : isUrgent ? 'rgba(234, 179, 8, 0.1)' : color === 'amber' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 146, 60, 0.1)'} />
                        <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                    <filter id="glow-filter">
                        <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background Grid */}
                <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                {/* Central pulse */}
                <circle cx="100" cy="100" r="85" fill="url(#glow)" className={color === 'amber' ? 'animate-pulse-glow-amber' : 'animate-pulse-glow-orange'} />

                {/* Rotating scanners */}
                <g className="animate-rotate">
                    <path d="M 100,20 a 80,80 0 0,1 0,160" stroke={progressColorClass} strokeWidth="2" fill="none" opacity="0.5" strokeDasharray="5 20" />
                </g>
                 <g className="animate-rotate-fast" style={{ animationDirection: 'reverse' }}>
                    <path d="M 20,100 a 80,80 0 0,1 160,0" stroke={progressColorClass} strokeWidth="1" fill="none" opacity="0.3" strokeDasharray="2 10" />
                </g>

                {/* Progress Track */}
                <circle className="text-slate-800/50" strokeWidth="6" stroke="currentColor" fill="transparent" r={radius} cx="100" cy="100" />
                
                {/* Progress Bar */}
                <circle
                    className={cn(progressColorClass, "transition-all duration-500")}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    r={radius}
                    cx="100"
                    cy="100"
                    transform="rotate(-90 100 100)"
                    style={{ filter: `drop-shadow(0 0 5px currentColor)` }}
                />
            </svg>
        </div>
    );
};

const GlobalTimer: React.FC<{
    activeTimer: ActiveTimer | null;
    pauseTimer: () => void;
    resumeTimer: () => void;
    stopTimer: () => void;
}> = ({ activeTimer, pauseTimer, resumeTimer, stopTimer }) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isMinimized, setIsMinimized] = useState(true);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (activeTimer && !activeTimer.isPaused) {
            interval = setInterval(() => {
                const elapsed = activeTimer.elapsedTime + (Date.now() - activeTimer.startTime);
                setElapsedSeconds(Math.floor(elapsed / 1000));
            }, 1000);
        } else if (activeTimer) {
             setElapsedSeconds(Math.floor(activeTimer.elapsedTime / 1000));
        }
        return () => clearInterval(interval);
    }, [activeTimer]);

    if (!activeTimer) return null;

    const timerName = activeTimer.task?.name || activeTimer.test?.name || "Timer";
    const { targetDuration } = activeTimer;

    let timeRemaining = targetDuration ? targetDuration - elapsedSeconds : null;
    let isOverTime = timeRemaining !== null && timeRemaining < 0;
    let isUrgent = targetDuration ? !isOverTime && timeRemaining! <= targetDuration * 0.2 : false;
    let progress = targetDuration ? Math.min(100, (elapsedSeconds / targetDuration) * 100) : 0;

    const baseClasses = "fixed z-[60] bg-slate-900/80 backdrop-blur-xl border rounded-lg transition-all duration-300";
    const dynamicClasses = targetDuration 
        ? isOverTime 
            ? "border-red-500/80 shadow-glow-amber-lg animate-pulseGlowEnergetic" 
            : isUrgent 
            ? "border-yellow-500/80 animate-pulseGlow" 
            : "border-brand-amber-500/30 shadow-glow-amber"
        : "border-brand-amber-500/30 shadow-glow-amber";

    const timeColorClass = isOverTime ? "text-red-400" : isUrgent ? "text-yellow-400" : "text-brand-amber-400";
    
    const displayTime = formatDuration(elapsedSeconds).replace(/ /g, '');
    const overtimeDisplay = isOverTime ? `+${formatDuration(Math.abs(timeRemaining!))}` : null;

    if (isMinimized) {
        return (
            <div className={cn(baseClasses, dynamicClasses, "bottom-20 md:bottom-5 right-5 flex items-center justify-between gap-4 p-3 animate-fadeIn w-64")}>
                <div className="flex-1 min-w-0">
                    <p className={cn("font-display font-bold text-2xl tracking-wider", timeColorClass)}>
                        {isOverTime ? overtimeDisplay : displayTime}
                    </p>
                    <p className="text-xs text-gray-300 truncate" title={timerName}>{timerName}</p>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                    <Button onClick={() => setIsMinimized(false)} size="sm" variant="ghost" className="p-2"><MaximizeIcon className="w-4 h-4" /></Button>
                    {activeTimer.isPaused ? (
                        <Button onClick={resumeTimer} size="sm" variant="secondary" aria-label="Resume Timer" className="p-2"><PlayIcon className="w-4 h-4" /></Button>
                    ) : (
                        <Button onClick={pauseTimer} size="sm" variant="secondary" aria-label="Pause Timer" className="p-2"><PauseIcon className="w-4 h-4" /></Button>
                    )}
                    <Button onClick={stopTimer} size="sm" variant="danger" aria-label="Stop Timer" className="p-2"><StopCircleIcon className="w-4 h-4" /></Button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/50" aria-modal="true" role="dialog">
            <div className={cn(
                "relative bg-slate-900/80 backdrop-blur-xl border rounded-lg transition-all duration-300",
                dynamicClasses,
                "w-full h-full md:w-[80vw] md:h-[80vh] flex flex-col items-center justify-center p-4 md:p-8 animate-fadeIn"
            )}>
                <div className="absolute top-4 right-4">
                    <Button onClick={() => setIsMinimized(true)} size="sm" variant="ghost" className="p-2"><MinimizeIcon className="w-8 h-8" /></Button>
                </div>
                <h3 className="font-display font-semibold text-gray-200 truncate text-2xl md:text-3xl mb-4 md:mb-8 text-center" title={timerName}>{timerName}</h3>
                <div className="relative flex justify-center items-center my-4 flex-grow w-full max-w-lg aspect-square">
                     <CircularProgress progress={progress} isUrgent={isUrgent} isOverTime={isOverTime} className="w-full h-full" color="amber" />
                     <div className={cn("absolute font-display font-bold text-7xl md:text-8xl tracking-wider", timeColorClass)}>
                        {isOverTime ? overtimeDisplay : displayTime}
                    </div>
                </div>
                {targetDuration && (
                    <div className="text-center text-base md:text-lg space-y-1 my-4 md:my-8 font-display">
                        <p>Target: <span className="font-semibold text-gray-300">{formatDuration(targetDuration)}</span></p>
                        {isOverTime 
                            ? <p className="font-bold text-red-400">OVER TIME</p> 
                            : <p>Remaining: <span className="font-semibold text-gray-300">{formatDuration(timeRemaining!)}</span></p>
                        }
                    </div>
                )}
                <div className="flex justify-center gap-4 mt-4 md:mt-8 w-full max-w-md">
                    {activeTimer.isPaused ? (
                        <Button onClick={resumeTimer} variant="secondary" size="lg" className="flex-1"><PlayIcon className="w-6 h-6" /> Resume</Button>
                    ) : (
                        <Button onClick={pauseTimer} variant="secondary" size="lg" className="flex-1"><PauseIcon className="w-6 h-6" /> Pause</Button>
                    )}
                    <Button onClick={stopTimer} variant="danger" size="lg" className="flex-1"><StopCircleIcon className="w-6 h-6" /> Stop</Button>
                </div>
            </div>
        </div>
    );
};

const GlobalBreakTimer: React.FC<{
    activeBreak: ActiveBreak | null;
    pauseTimer: () => void;
    resumeTimer: () => void;
    stopTimer: () => void;
}> = ({ activeBreak, pauseTimer, resumeTimer, stopTimer }) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isMinimized, setIsMinimized] = useState(true);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (activeBreak && !activeBreak.isPaused) {
            interval = setInterval(() => {
                const elapsed = activeBreak.elapsedTime + (Date.now() - activeBreak.startTime);
                setElapsedSeconds(Math.floor(elapsed / 1000));
            }, 1000);
        } else if (activeBreak) {
             setElapsedSeconds(Math.floor(activeBreak.elapsedTime / 1000));
        }
        return () => clearInterval(interval);
    }, [activeBreak]);

    if (!activeBreak) return null;

    const timerName = activeBreak.type === 'Other' ? activeBreak.customType : activeBreak.type;
    const { targetDuration } = activeBreak;
    
    const baseClasses = "fixed z-[60] bg-slate-900/80 backdrop-blur-xl border rounded-lg transition-all duration-300";
    const dynamicClasses = "border-brand-orange-400/30 shadow-[0_0_15px_rgba(251,146,60,0.4)]";
    const timeColorClass = "text-brand-orange-400";
    
    const displayTime = formatDuration(elapsedSeconds).replace(/ /g, '');

    if (isMinimized) {
        return (
            <div className={cn(baseClasses, dynamicClasses, "bottom-20 md:bottom-5 right-5 flex items-center justify-between gap-4 p-3 animate-fadeIn w-64")}>
                <div className="flex-1 min-w-0">
                    <p className={cn("font-display font-bold text-2xl tracking-wider", timeColorClass)}>
                        {displayTime}
                    </p>
                    <p className="text-xs text-gray-300 truncate" title={timerName}>{timerName}</p>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                    <Button onClick={() => setIsMinimized(false)} size="sm" variant="ghost" className="p-2"><MaximizeIcon className="w-4 h-4" /></Button>
                    {activeBreak.isPaused ? (
                        <Button onClick={resumeTimer} size="sm" variant="secondary" aria-label="Resume Timer" className="p-2"><PlayIcon className="w-4 h-4" /></Button>
                    ) : (
                        <Button onClick={pauseTimer} size="sm" variant="secondary" aria-label="Pause Timer" className="p-2"><PauseIcon className="w-4 h-4" /></Button>
                    )}
                    <Button onClick={stopTimer} size="sm" variant="danger" aria-label="Stop Timer" className="p-2"><StopCircleIcon className="w-4 h-4" /></Button>
                </div>
            </div>
        );
    }
    
    let timeRemaining = targetDuration ? targetDuration - elapsedSeconds : null;
    let isOverTime = timeRemaining !== null && timeRemaining < 0;
    const overtimeDisplay = isOverTime ? `+${formatDuration(Math.abs(timeRemaining!))}` : null;
    const displayFullTime = isOverTime ? overtimeDisplay : displayTime;
    let progress = targetDuration ? Math.min(100, (elapsedSeconds / targetDuration) * 100) : 0;


    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/50" aria-modal="true" role="dialog">
            <div className={cn(
                "relative bg-slate-900/80 backdrop-blur-xl border rounded-lg transition-all duration-300",
                dynamicClasses,
                "w-full h-full md:w-[80vw] md:h-[80vh] flex flex-col items-center justify-center p-4 md:p-8 animate-fadeIn"
            )}>
                <div className="absolute top-4 right-4">
                    <Button onClick={() => setIsMinimized(true)} size="sm" variant="ghost" className="p-2"><MinimizeIcon className="w-8 h-8" /></Button>
                </div>
                <h3 className="font-display font-semibold text-gray-200 truncate text-2xl md:text-3xl mb-4 md:mb-8 text-center" title={timerName}>{timerName}</h3>
                <div className="relative flex justify-center items-center my-4 flex-grow w-full max-w-lg aspect-square">
                     <CircularProgress progress={progress} isUrgent={false} isOverTime={isOverTime} className="w-full h-full" color="orange" />
                     <div className={cn("absolute font-display font-bold text-7xl md:text-8xl tracking-wider", isOverTime ? 'text-red-400' : timeColorClass)}>
                        {displayFullTime}
                    </div>
                </div>
                 {targetDuration && (
                    <div className="text-center text-base md:text-lg space-y-1 my-4 md:my-8 font-display">
                        <p>Target: <span className="font-semibold text-gray-300">{formatDuration(targetDuration)}</span></p>
                        {isOverTime 
                            ? <p className="font-bold text-red-400">OVER TIME</p> 
                            : <p>Remaining: <span className="font-semibold text-gray-300">{formatDuration(timeRemaining!)}</span></p>
                        }
                    </div>
                )}
                 <div className="flex justify-center gap-4 mt-4 md:mt-8 w-full max-w-md">
                    {activeBreak.isPaused ? (
                        <Button onClick={resumeTimer} variant="secondary" size="lg" className="flex-1"><PlayIcon className="w-6 h-6" /> Resume</Button>
                    ) : (
                        <Button onClick={pauseTimer} variant="secondary" size="lg" className="flex-1"><PauseIcon className="w-6 h-6" /> Pause</Button>
                    )}
                    <Button onClick={stopTimer} variant="danger" size="lg" className="flex-1"><StopCircleIcon className="w-6 h-6" /> Stop</Button>
                </div>
            </div>
        </div>
    );
};


// --- Modals ---

const ConfirmBreakModal: React.FC<{
    breakInfo: { type: BreakType; customType?: string; duration: number } | null;
    onConfirm: (duration: number, notes?: string) => void;
    onClose: () => void;
}> = ({ breakInfo, onConfirm, onClose }) => {
    const [duration, setDuration] = useState(breakInfo?.duration || 0);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        setDuration(breakInfo?.duration || 0);
        setNotes('');
    }, [breakInfo]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (breakInfo) {
            onConfirm(duration, notes.trim() ? notes : undefined);
        }
    };

    if (!breakInfo) return null;
    const breakName = breakInfo.type === 'Other' ? breakInfo.customType : breakInfo.type;

    return (
        <Modal isOpen={!!breakInfo} onClose={onClose} title={`Log Break Session: ${breakName}`}>
            <form onSubmit={handleSubmit}>
                <p className="text-sm text-gray-300">Your break was automatically timed. Confirm or edit the duration before saving.</p>
                <TimeEditor initialDuration={breakInfo.duration} onDurationChange={setDuration} />
                <div className="mt-4">
                    <label className="block text-sm font-medium mb-1 font-display">Notes (Optional)</label>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Quick chat with family" rows={2}/>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Log Break</Button>
                </div>
            </form>
        </Modal>
    );
};


const AddManualBreakModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (session: Omit<BreakSession, 'id'>) => void;
}> = ({ isOpen, onClose, onAdd }) => {
    const [breakType, setBreakType] = useState<BreakType>('Short Break');
    const [customType, setCustomType] = useState('');
    const [duration, setDuration] = useState(900); // 15 mins
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const breakOptions: { value: BreakType, label: string, icon: React.ReactElement }[] = [
        { value: 'Short Break', label: 'Short Break', icon: <CoffeeIcon className="w-5 h-5" /> },
        { value: 'Meal', label: 'Meal', icon: <UtensilsIcon className="w-5 h-5" /> },
        { value: 'Exercise', label: 'Exercise', icon: <DumbbellIcon className="w-5 h-5" /> },
        { value: 'Hobby', label: 'Hobby', icon: <PaintBrushIcon className="w-5 h-5" /> },
        { value: 'Nap', label: 'Nap', icon: <BedIcon className="w-5 h-5" /> },
        { value: 'Other', label: 'Other', icon: <div className="w-5 h-5" /> },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (breakType === 'Other' && !customType.trim()) {
            alert('Please specify your activity for "Other".');
            return;
        }
        if (duration <= 0) {
            alert('Please enter a valid duration.');
            return;
        }
        const sessionDate = new Date(date);
        onAdd({
            type: breakType,
            customType,
            date: sessionDate.toISOString(),
            duration,
            notes: notes.trim() ? notes : undefined,
        });
        // Reset form
        setBreakType('Short Break');
        setCustomType('');
        setDuration(900);
        setDate(new Date().toISOString().split('T')[0]);
        setNotes('');
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manually Add Break">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 font-display">Activity Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {breakOptions.map(opt => (
                            <button
                                type="button"
                                key={opt.value}
                                onClick={() => setBreakType(opt.value)}
                                className={cn(
                                    "flex items-center gap-2 p-3 rounded-lg border-2 transition-all",
                                    breakType === opt.value ? "border-brand-orange-400 bg-brand-orange-400/10" : "border-slate-700 bg-slate-800/50 hover:bg-slate-700/50"
                                )}
                            >
                                {opt.icon}
                                <span className="text-sm font-semibold">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {breakType === 'Other' && (
                    <div className="animate-fadeIn">
                        <label className="block text-sm font-medium mb-1 font-display">Specify Activity</label>
                        <Input type="text" value={customType} onChange={e => setCustomType(e.target.value)} placeholder="e.g., Family time, errands" required/>
                    </div>
                )}

                <TimeEditor initialDuration={duration} onDurationChange={setDuration} label="Break Duration" />

                <div>
                    <label className="block text-sm font-medium mb-1 font-display">Date</label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-1 font-display">Notes (Optional)</label>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any details about this break?" rows={2}/>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" className="bg-brand-orange-400 text-brand-orange-900 hover:bg-brand-orange-400/80 focus:ring-brand-orange-400">Add Break</Button>
                </div>
            </form>
        </Modal>
    );
};


const TakeBreakModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onStart: (type: BreakType, customType?: string, duration?: number) => void;
}> = ({ isOpen, onClose, onStart }) => {
    const [breakType, setBreakType] = useState<BreakType>('Short Break');
    const [customType, setCustomType] = useState('');
    const [duration, setDuration] = useState(900); // 15 mins

    const breakOptions: { value: BreakType, label: string, icon: React.ReactElement }[] = [
        { value: 'Short Break', label: 'Short Break', icon: <CoffeeIcon className="w-5 h-5" /> },
        { value: 'Meal', label: 'Meal', icon: <UtensilsIcon className="w-5 h-5" /> },
        { value: 'Exercise', label: 'Exercise', icon: <DumbbellIcon className="w-5 h-5" /> },
        { value: 'Hobby', label: 'Hobby', icon: <PaintBrushIcon className="w-5 h-5" /> },
        { value: 'Nap', label: 'Nap', icon: <BedIcon className="w-5 h-5" /> },
        { value: 'Other', label: 'Other', icon: <div className="w-5 h-5" /> },
    ];
    
    const handleStart = (withTarget: boolean) => {
        if (breakType === 'Other' && !customType.trim()) {
            alert('Please specify your activity for "Other".');
            return;
        }
        onStart(breakType, customType, withTarget ? duration : undefined);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Take a Break">
            <p className="text-sm text-gray-300 mb-4">Choose your break activity. A timer will help you get back to your studies on time.</p>
            
            <label className="block text-sm font-medium mb-1 font-display">Activity Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {breakOptions.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => setBreakType(opt.value)}
                        className={cn(
                            "flex items-center gap-2 p-3 rounded-lg border-2 transition-all",
                            breakType === opt.value ? "border-brand-orange-400 bg-brand-orange-400/10" : "border-slate-700 bg-slate-800/50 hover:bg-slate-700/50"
                        )}
                    >
                        {opt.icon}
                        <span className="text-sm font-semibold">{opt.label}</span>
                    </button>
                ))}
            </div>

            {breakType === 'Other' && (
                <div className="animate-fadeIn">
                    <label className="block text-sm font-medium mb-1 font-display">Specify Activity</label>
                    <Input 
                        type="text" 
                        value={customType} 
                        onChange={e => setCustomType(e.target.value)} 
                        placeholder="e.g., Family time, errands"
                    />
                </div>
            )}

            <TimeEditor initialDuration={duration} onDurationChange={setDuration} label="Set Break Duration (Optional)" />

            <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="secondary" onClick={() => handleStart(false)}>Start Open-ended</Button>
                <Button type="button" onClick={() => handleStart(true)} className="bg-brand-orange-400 text-brand-orange-900 hover:bg-brand-orange-400/80 focus:ring-brand-orange-400">Start Timed Break</Button>
            </div>
        </Modal>
    );
};

const WelcomeBackModal: React.FC<{
    breakInfo: { duration: number; type: BreakType; customType?: string } | null;
    tasks: Task[];
    onClose: () => void;
    onStartTask: (task: Task) => void;
}> = ({ breakInfo, tasks, onClose, onStartTask }) => {
    if (!breakInfo) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const pendingTodayTasks = tasks.filter(t => t.date === today && t.status === 'Pending');

    return (
        <Modal isOpen={!!breakInfo} onClose={onClose} title="Welcome Back!">
            <div className="text-center">
                <p className="text-gray-300">You took a <strong className="text-brand-orange-400">{formatDuration(breakInfo.duration)}</strong> break for</p>
                <p className="font-display text-2xl font-bold text-white my-2">{breakInfo.type === 'Other' ? breakInfo.customType : breakInfo.type}.</p>
                <p className="text-lg text-gray-300">Ready to get back to it?</p>
            </div>

            {pendingTodayTasks.length > 0 && (
                <div className="mt-6 border-t border-white/10 pt-4">
                    <h4 className="font-semibold text-center mb-3">What's next for today?</h4>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                        {pendingTodayTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                <div className="min-w-0">
                                    <p className="font-semibold truncate">{task.name}</p>
                                    <p className="text-xs text-gray-400">{task.chapter}</p>
                                </div>
                                <Button onClick={() => onStartTask(task)} size="sm">Start</Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-end mt-6">
                <Button type="button" variant="secondary" onClick={onClose}>Dismiss</Button>
            </div>
        </Modal>
    );
};

const TargetDurationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onStart: (duration?: number) => void;
    itemName: string;
}> = ({ isOpen, onClose, onStart, itemName }) => {
    const [duration, setDuration] = useState(3600); // Default to 1 hour

    const handleStartWithTarget = () => {
        onStart(duration);
    };

    const handleStartWithoutTarget = () => {
        onStart(undefined);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Set Target for: ${itemName}`}>
            <p className="text-sm text-gray-300 mb-4">Set a target duration for your study session to stay on track. This will enable visual cues to help you manage time.</p>
            <TimeEditor initialDuration={duration} onDurationChange={setDuration} label="Target Duration" />
            <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="secondary" onClick={handleStartWithoutTarget}>Start without Target</Button>
                <Button type="button" onClick={handleStartWithTarget}>Start with Target</Button>
            </div>
        </Modal>
    );
};

const Header: React.FC = () => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/60 backdrop-blur-xl border-b border-brand-amber-500/10">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                         <Link to="/" className="flex items-center gap-2">
                            <BrainCircuitIcon className="w-8 h-8 text-brand-amber-400" />
                            <span className="font-display font-bold text-2xl text-brand-amber-400 tracking-wider drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]">
                                NEET Synapse
                            </span>
                        </Link>
                    </div>
                    <div className="hidden md:flex items-center space-x-1">
                        {[
                            { to: "/", icon: ClipboardListIcon, label: "Planner" },
                            { to: "/test-planner", icon: FileTextIcon, label: "Test Planner" },
                            { to: "/timeline", icon: CalendarClockIcon, label: "Agenda" },
                            { to: "/mentor", icon: BrainCircuitIcon, label: "AI Mentor" },
                            { to: "/self-tracker", icon: ActivityIcon, label: "Tracker" },
                            { to: "/insights", icon: HistoryIcon, label: "Insights" },
                            { to: "/dashboard", icon: LayoutDashboardIcon, label: "Dashboard" },
                            { to: "/settings", icon: SettingsIcon, label: "Settings" },
                        ].map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `relative flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-brand-amber-400 transition-all duration-300 group ${isActive ? 'text-brand-amber-400' : ''}`}
                            >
                               <item.icon className="w-5 h-5 mr-2" /> {item.label}
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-brand-amber-400 transition-all duration-300 group-hover:w-full rounded-full group-[.active]:w-full"></span>
                            </NavLink>
                        ))}
                    </div>
                </div>
            </nav>
        </header>
    );
};

const BottomNavBar: React.FC = () => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/60 backdrop-blur-xl border-t border-brand-amber-500/10">
            <div className="container mx-auto grid grid-cols-8 h-16">
                {[
                    { to: "/", icon: ClipboardListIcon, label: "Planner" },
                    { to: "/test-planner", icon: FileTextIcon, label: "Tests" },
                    { to: "/timeline", icon: CalendarClockIcon, label: "Agenda" },
                    { to: "/mentor", icon: BrainCircuitIcon, label: "Mentor" },
                    { to: "/self-tracker", icon: ActivityIcon, label: "Tracker" },
                    { to: "/insights", icon: HistoryIcon, label: "Insights" },
                    { to: "/dashboard", icon: LayoutDashboardIcon, label: "Dashboard" },
                    { to: "/settings", icon: SettingsIcon, label: "Settings" },
                ].map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `relative flex flex-col items-center justify-center w-full text-xs font-medium text-gray-400 hover:text-brand-amber-400 transition-all duration-300 pt-1 group ${isActive ? 'text-brand-amber-400' : ''}`}
                    >
                        {/* FIX: Wrap NavLink children in a render prop function to correctly handle active state. */}
                        {({ isActive }) => (
                            <>
                                <item.icon className="w-6 h-6 mb-1 transition-transform group-hover:scale-110" /> {item.label}
                                {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-amber-400 rounded-full shadow-glow-amber-xs"></div>}
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

const ConfirmSessionModal: React.FC<{
    sessionInfo: { task: Task; duration: number } | null;
    onConfirm: (task: Task, duration: number) => void;
    onClose: () => void;
}> = ({ sessionInfo, onConfirm, onClose }) => {
    const [duration, setDuration] = useState(sessionInfo?.duration || 0);

    useEffect(() => {
        setDuration(sessionInfo?.duration || 0);
    }, [sessionInfo]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (sessionInfo) {
            onConfirm(sessionInfo.task, duration);
        }
    };

    if (!sessionInfo) return null;

    return (
        <Modal isOpen={!!sessionInfo} onClose={onClose} title={`Log Session for: ${sessionInfo.task.name}`}>
            <form onSubmit={handleSubmit}>
                <p className="text-sm text-gray-300">A session was automatically timed. Please confirm or edit the duration below before saving.</p>
                <TimeEditor initialDuration={sessionInfo.duration} onDurationChange={setDuration} />
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Log Session</Button>
                </div>
            </form>
        </Modal>
    );
};

const SimpleCompletionModal: React.FC<{
    task: Task | null;
    onConfirm: () => void;
    onClose: () => void;
}> = ({ task, onConfirm, onClose }) => {
    if (!task) return null;
    return (
        <Modal isOpen={!!task} onClose={onClose} title={`Complete Task: ${task.name}`}>
            <p className="mb-4">Mark this task as completed?</p>
            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm}>Complete</Button>
            </div>
        </Modal>
    )
}

const CompleteLectureModal: React.FC<{ 
    task: Task | null; 
    initialDuration: number;
    onComplete: (difficulty: number, duration: number) => void; 
    onClose: () => void 
}> = ({ task, initialDuration, onComplete, onClose }) => {
    const [difficulty, setDifficulty] = useState(3);
    const [duration, setDuration] = useState(initialDuration);

    useEffect(() => {
        setDuration(initialDuration);
        setDifficulty(3);
    }, [initialDuration, task]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onComplete(difficulty, duration);
    };

    return (
        <Modal isOpen={!!task} onClose={onClose} title={`Complete: ${task?.name}`}>
            <form onSubmit={handleSubmit}>
                <label className="block mb-2 font-display text-lg">How difficult was this topic?</label>
                <div className="flex items-center gap-4 my-4">
                    <span className="text-sm text-gray-400">Easy</span>
                    <input type="range" min="1" max="5" value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer range-lg accent-brand-amber-500" />
                    <span className="text-sm text-gray-400">Hard</span>
                    <span className="font-bold text-brand-amber-400 text-2xl w-8 text-center">{difficulty}</span>
                </div>
                <TimeEditor initialDuration={initialDuration} onDurationChange={setDuration} />
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save</Button>
                </div>
            </form>
        </Modal>
    );
};

const CompletePracticeModal: React.FC<{ 
    task: Task | null; 
    initialDuration: number;
    onComplete: (total: number, correct: number, duration: number, incorrectCount: number) => void; 
    onClose: () => void 
}> = ({ task, initialDuration, onComplete, onClose }) => {
    const [total, setTotal] = useState('');
    const [correct, setCorrect] = useState('');
    const [duration, setDuration] = useState(initialDuration);
    const [incorrect, setIncorrect] = useState('');
    
     useEffect(() => {
        setDuration(initialDuration);
        setTotal('');
        setCorrect('');
        setIncorrect('');
    }, [initialDuration, task]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const totalNum = Number(total);
        const correctNum = Number(correct);
        const incorrectNum = Number(incorrect || 0);

        if (totalNum > 0 && correctNum >= 0 && incorrectNum >= 0 && (correctNum + incorrectNum <= totalNum)) {
            onComplete(totalNum, correctNum, duration, incorrectNum);
        } else {
            alert("Please check your numbers. Correct + Incorrect answers must not exceed the total questions attempted.");
        }
    };

    return (
        <Modal isOpen={!!task} onClose={onClose} title={`Practice Feedback: ${task?.name}`}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className="block mb-1 font-display">Total Questions Attempted</label>
                        <Input type="number" value={total} onChange={e => setTotal(e.target.value)} min="1" required />
                    </div>
                    <div>
                        <label className="block mb-1 font-display">Number of Correct Answers</label>
                        <Input type="number" value={correct} onChange={e => setCorrect(e.target.value)} min="0" max={total || undefined} required />
                    </div>
                    <div>
                        <label className="block mb-1 font-display">Number of Incorrect Answers</label>
                        <Input type="number" value={incorrect} onChange={e => setIncorrect(e.target.value)} min="0" max={total && correct ? String(Number(total) - Number(correct)) : undefined} />
                    </div>
                </div>
                <TimeEditor initialDuration={initialDuration} onDurationChange={setDuration} />
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save</Button>
                </div>
            </form>
        </Modal>
    );
};


const App: React.FC = () => {
    const tasks = useLiveQuery(() => db.tasks.orderBy('date').toArray(), []);
    const testPlans = useLiveQuery(() => db.testPlans.orderBy('date').toArray(), []);
    const breakSessions = useLiveQuery(() => db.breakSessions.toArray(), []);
    const activeTimer = useLiveQuery(() => getMiscItem<ActiveTimer | null>('activeTimer', null), null);
    const activeBreak = useLiveQuery(() => getMiscItem<ActiveBreak | null>('activeBreak', null), null);
    const [targetScore, setTargetScore] = useState(680);

    const [timerSetup, setTimerSetup] = useState<{ task?: Task; test?: TestPlan } | null>(null);
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
    const [taskToFinalize, setTaskToFinalize] = useState<{ task: Task; duration: number } | null>(null);
    const [sessionToConfirm, setSessionToConfirm] = useState<{ task: Task; duration: number } | null>(null);
    const [completedTestInfo, setCompletedTestInfo] = useState<{ test: TestPlan, duration: number } | null>(null);
    
    // New: Handle simple "Notes" completion
    const [noteTaskToComplete, setNoteTaskToComplete] = useState<Task | null>(null);

    const { usagePercentage, refreshUsage } = useStorageUsage();
    
    const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
    const [isManualBreakModalOpen, setIsManualBreakModalOpen] = useState(false);
    const [breakToConfirm, setBreakToConfirm] = useState<{ type: BreakType; customType?: string; duration: number } | null>(null);
    const [breakToFinalize, setBreakToFinalize] = useState<{ duration: number; type: BreakType; customType?: string } | null>(null);
    
    // State for global report generation
    const [isGenerateReportModalOpen, setIsGenerateReportModalOpen] = useState(false);
    const [reportType, setReportType] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Overall'>('Daily');
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportWeek, setReportWeek] = useState(getCurrentWeekString());
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
    const [activeReport, setActiveReport] = useState<{ type: string; date?: string; week?: string; month?: string; } | null>(null);

    // State for Tools FAB
    const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);


    useEffect(() => {
        getMiscItem('targetScore', 680).then(setTargetScore);
    }, []);

    const handleSetTargetScore = (score: number) => {
        setTargetScore(score);
        setMiscItem('targetScore', score);
    };

    useEffect(() => {
        refreshUsage();
    }, [tasks, testPlans, refreshUsage]);

    useEffect(() => {
        const requestPersistence = async () => {
            if (navigator.storage && navigator.storage.persist) {
                try {
                    const isPersisted = await navigator.storage.persisted();
                    if (!isPersisted) {
                        const persisted = await navigator.storage.persist();
                        console.log(`Storage persistence requested: ${persisted}`);
                    }
                } catch (error) {
                    console.error("Could not request persistent storage:", error);
                }
            }
        };
        requestPersistence();
    }, []);
    
    useEffect(() => {
        if (taskToFinalize) {
            setTaskToComplete(taskToFinalize.task);
        }
    }, [taskToFinalize]);

    // --- Timer Logic ---
     const startTaskTimer = (task: Task) => {
        if (activeTimer || activeBreak) {
             alert("Another timer is already running. Please stop it before starting a new one.");
            return;
        }
        setTimerSetup({ task });
    };

    const startTestTimer = (test: TestPlan) => {
        if (activeTimer || activeBreak) {
             alert("Another timer is already running. Please stop it before starting a new one.");
            return;
        }
        setTimerSetup({ test });
    };

    const handleStartTimerWithDuration = (duration?: number) => {
        if (!timerSetup) return;

        const { task, test } = timerSetup;
        
        const newTimer: ActiveTimer = {
            task: task,
            test: test,
            startTime: Date.now(),
            elapsedTime: 0,
            isPaused: false,
            targetDuration: duration,
        };
        setMiscItem('activeTimer', newTimer);

        setTimerSetup(null); // Close modal and reset state
    };


    const pauseTimer = async () => {
        const timer = await getMiscItem<ActiveTimer | null>('activeTimer', null);
        if (!timer || timer.isPaused) return;
        const newTimer = { ...timer, elapsedTime: timer.elapsedTime + (Date.now() - timer.startTime), isPaused: true };
        setMiscItem('activeTimer', newTimer);
    };

    const resumeTimer = async () => {
        const timer = await getMiscItem<ActiveTimer | null>('activeTimer', null);
        if (!timer || !timer.isPaused) return;
        const newTimer = { ...timer, startTime: Date.now(), isPaused: false };
        setMiscItem('activeTimer', newTimer);
    };

    const stopStudyTimer = () => {
        if (!activeTimer) return;
        const finalElapsedTime = activeTimer.elapsedTime + (activeTimer.isPaused ? 0 : (Date.now() - activeTimer.startTime));
        const durationInSeconds = Math.round(finalElapsedTime / 1000);

        if (activeTimer.test) {
            setCompletedTestInfo({ test: activeTimer.test, duration: durationInSeconds });
        } else if (activeTimer.task) {
            const isTestPrepTask = activeTimer.task.notes?.includes('For upcoming test:');

            if (isTestPrepTask) {
                setTaskToFinalize({ task: activeTimer.task, duration: durationInSeconds });
            } else {
                if (durationInSeconds > 0) {
                    setSessionToConfirm({ task: activeTimer.task, duration: durationInSeconds });
                }
            }
        }
        
        setMiscItem('activeTimer', null);
    };

    const handleStartBreak = (type: BreakType, customType?: string, duration?: number) => {
        if (activeTimer || activeBreak) {
            alert("A timer is already running. Please stop it before starting a break.");
            return;
        }

        const newBreak: ActiveBreak = {
            type,
            customType,
            startTime: Date.now(),
            elapsedTime: 0,
            isPaused: false,
            targetDuration: duration,
        };
        setMiscItem('activeBreak', newBreak);
        setIsBreakModalOpen(false);
    };

    const pauseBreakTimer = async () => {
        const breakTimer = await getMiscItem<ActiveBreak | null>('activeBreak', null);
        if (!breakTimer || breakTimer.isPaused) return;
        const newTimer = { ...breakTimer, elapsedTime: breakTimer.elapsedTime + (Date.now() - breakTimer.startTime), isPaused: true };
        setMiscItem('activeBreak', newTimer);
    };

    const resumeBreakTimer = async () => {
        const breakTimer = await getMiscItem<ActiveBreak | null>('activeBreak', null);
        if (!breakTimer || !breakTimer.isPaused) return;
        const newTimer = { ...breakTimer, startTime: Date.now(), isPaused: false };
        setMiscItem('activeBreak', newTimer);
    };

    const stopBreakTimer = async () => {
        if (!activeBreak) return;
        const finalElapsedTime = activeBreak.elapsedTime + (activeBreak.isPaused ? 0 : (Date.now() - activeBreak.startTime));
        const durationInSeconds = Math.round(finalElapsedTime / 1000);

        await setMiscItem('activeBreak', null);
        
        if (durationInSeconds > 0) {
            setBreakToConfirm({
                duration: durationInSeconds,
                type: activeBreak.type,
                customType: activeBreak.customType,
            });
        }
    };
    
    const handleConfirmBreakSession = async (duration: number, notes?: string) => {
        if (!breakToConfirm) return;
        const newBreakSession: BreakSession = {
            id: crypto.randomUUID(),
            type: breakToConfirm.type,
            customType: breakToConfirm.customType,
            date: new Date().toISOString(),
            duration,
            notes,
        };

        await db.breakSessions.add(newBreakSession);
        
        setBreakToFinalize({
            duration,
            type: breakToConfirm.type,
            customType: breakToConfirm.customType,
        });
        setBreakToConfirm(null);
    };

    const handleAddManualBreak = async (session: Omit<BreakSession, 'id'>) => {
        await db.breakSessions.add({ ...session, id: crypto.randomUUID() });
        setIsManualBreakModalOpen(false);
    };


    const handleConfirmSession = (task: Task, duration: number) => {
        const newSession: StudySession = {
            date: new Date().toISOString(),
            duration: duration,
        };
        db.tasks.update(task.id, {
            sessions: [...(task.sessions || []), newSession]
        });
        setSessionToConfirm(null);
    };

    // --- Task Completion Logic ---

    const createPostLectureWorkflow = async (originalTask: Task, sourceTaskId: string | number) => {
        // Logic to create 5 specific follow-up tasks
        const todayStr = originalTask.date; // Use original planned date or today? Let's use the task's date to keep schedule aligned.
        const dateObj = new Date(todayStr);

        const getOffsetDate = (days: number) => {
            const d = new Date(dateObj);
            d.setDate(d.getDate() + days);
            return d.toISOString().split('T')[0];
        };

        const newTasks: Omit<Task, "id">[] = [
            {
                name: `Notes: ${originalTask.name}`,
                subject: originalTask.subject,
                chapter: originalTask.chapter,
                microtopics: originalTask.microtopics,
                taskType: 'Notes',
                date: todayStr, // Same day
                status: 'Pending',
                priority: 'High',
                sessions: [],
                sourceLectureTaskId: sourceTaskId as string,
            },
            {
                name: `Revision & HW: ${originalTask.name}`,
                subject: originalTask.subject,
                chapter: originalTask.chapter,
                microtopics: originalTask.microtopics,
                taskType: 'RevisionHW',
                date: todayStr, // Same day
                status: 'Pending',
                priority: 'High',
                sessions: [],
                sourceLectureTaskId: sourceTaskId as string,
            },
            {
                name: `4th Day Revision: ${originalTask.name}`,
                subject: originalTask.subject,
                chapter: originalTask.chapter,
                microtopics: originalTask.microtopics,
                taskType: 'Revision4th',
                date: getOffsetDate(4),
                status: 'Pending',
                priority: 'Medium',
                sessions: [],
                sourceLectureTaskId: sourceTaskId as string,
            },
            {
                name: `7th Day Practice: ${originalTask.name}`,
                subject: originalTask.subject,
                chapter: originalTask.chapter,
                microtopics: originalTask.microtopics,
                taskType: 'Practice7th',
                date: getOffsetDate(7),
                status: 'Pending',
                priority: 'Medium',
                sessions: [],
                sourceLectureTaskId: sourceTaskId as string,
            },
            {
                name: `9th Day Practice: ${originalTask.name}`,
                subject: originalTask.subject,
                chapter: originalTask.chapter,
                microtopics: originalTask.microtopics,
                taskType: 'Practice9th',
                date: getOffsetDate(9),
                status: 'Pending',
                priority: 'Medium',
                sessions: [],
                sourceLectureTaskId: sourceTaskId as string,
            },
        ];

        await db.tasks.bulkAdd(newTasks.map(t => ({...t, id: crypto.randomUUID()})));
    };

    const handleCompleteLecture = (difficulty: number, duration: number) => {
        if (!taskToComplete) return;

        const originalTask = taskToComplete;

        db.transaction('rw', db.tasks, async () => {
             if (taskToFinalize) { // New task from TestPlanner or Timer
                const performanceSummary = generatePerformanceSummary(difficulty, undefined, undefined, duration);
                const { id: _, ...taskData } = taskToFinalize.task;
                const finalTask: Omit<Task, 'id'> = {
                    ...taskData,
                    status: 'Completed',
                    difficulty,
                    notes: (taskToFinalize.task.notes || '') + performanceSummary,
                    sessions: [{ date: new Date().toISOString(), duration }],
                };
                const newTaskId = await db.tasks.add({ ...finalTask, id: crypto.randomUUID()});
                
                if (originalTask.taskType === 'Lecture') {
                    await createPostLectureWorkflow(originalTask, newTaskId as string);
                }

            } else { // Existing task from Planner
                const performanceSummary = generatePerformanceSummary(difficulty, undefined, undefined, duration);
                const updatedNotes = (originalTask.notes || '') + performanceSummary;
                
                await db.tasks.update(originalTask.id, {
                    status: 'Completed',
                    difficulty,
                    notes: updatedNotes,
                    sessions: [{ date: new Date().toISOString(), duration }] // Use current time for completion
                });

                if (originalTask.taskType === 'Lecture') {
                     await createPostLectureWorkflow(originalTask, originalTask.id);
                }
            }
        });

        setTaskToComplete(null);
        setTaskToFinalize(null);
    };

    const handleCompleteSimpleTask = () => {
        if (!noteTaskToComplete) return;
        db.tasks.update(noteTaskToComplete.id, {
            status: 'Completed',
            sessions: [{ date: new Date().toISOString(), duration: 0 }] // Minimal duration for simple tasks
        });
        setNoteTaskToComplete(null);
    }

    const handleCompletePractice = (total: number, correct: number, duration: number, incorrectCount: number) => {
        if (!taskToComplete) return;

        if (taskToFinalize) { // New task from TestPlanner timer
            const performanceSummary = generatePerformanceSummary(undefined, total, correct, duration, incorrectCount);
             // FIX: Destructure 'id' out to ensure it's not part of the spread, satisfying the Omit<Task, 'id'> type.
             const { id: _, ...taskData } = taskToFinalize.task;
             const finalTask: Omit<Task, 'id'> = {
                ...taskData,
                status: 'Completed',
                totalQuestions: total,
                correctAnswers: correct,
                incorrectAnswers: incorrectCount,
                notes: (taskToFinalize.task.notes || '') + performanceSummary,
                sessions: [{ date: new Date().toISOString(), duration: duration }],
            };
            db.tasks.add({ ...finalTask, id: crypto.randomUUID()});

            const testNameMatch = taskToFinalize.task.notes?.match(/For upcoming test: "([^"]+)"/);
            if (testNameMatch) {
                const testName = testNameMatch[1];
                 db.testPlans.where({ name: testName, status: 'Upcoming' }).first().then(test => {
                    if (test) {
                        const updatedTopicStatus = test.topicStatus.map(topic => {
                            if (
                                topic.subject === taskToFinalize.task.subject &&
                                topic.chapter === taskToFinalize.task.chapter &&
                                taskToFinalize.task.microtopics.includes(topic.microtopic)
                            ) {
                                const newAttempt: TopicPracticeAttempt = {
                                    id: crypto.randomUUID(),
                                    totalQuestions: total,
                                    correctAnswers: correct,
                                    incorrectAnswers: incorrectCount,
                                    duration: duration,
                                };
                                return {
                                    ...topic,
                                    practiceAttempts: [...topic.practiceAttempts, newAttempt],
                                };
                            }
                            return topic;
                        });
                        db.testPlans.update(test.id, { topicStatus: updatedTopicStatus });
                    }
                });
            }
        } else { // Existing task from Planner
            const performanceSummary = generatePerformanceSummary(undefined, total, correct, duration, incorrectCount);
            const updatedNotes = (taskToComplete.notes || '') + performanceSummary;
            db.tasks.update(taskToComplete.id, {
                status: 'Completed',
                totalQuestions: total,
                correctAnswers: correct,
                incorrectAnswers: incorrectCount,
                notes: updatedNotes,
                sessions: [{ date: new Date().toISOString(), duration }]
            });
        }

        setTaskToComplete(null);
        setTaskToFinalize(null);
    };

    const completionTaskDuration = taskToFinalize 
        ? taskToFinalize.duration 
        : taskToComplete 
            ? (taskToComplete.sessions || []).reduce((sum: number, s: StudySession) => sum + s.duration, 0)
            : 0;

    const closeCompletionModals = () => {
        setTaskToComplete(null);
        setTaskToFinalize(null);
    }

    const handleGenerateReport = () => {
        if (reportType === 'Daily' && !reportDate) {
            alert('Please select a date.');
            return;
        }
        if (reportType === 'Weekly' && !reportWeek) {
            alert('Please select a week.');
            return;
        }
        if (reportType === 'Monthly' && !reportMonth) {
            alert('Please select a month.');
            return;
        }
        setActiveReport({ type: reportType, date: reportDate, week: reportWeek, month: reportMonth });
        setIsGenerateReportModalOpen(false);
    };

    const GenerateReportModal: React.FC<{
        isOpen: boolean;
        onClose: () => void;
    }> = ({ isOpen, onClose }) => {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Generate Report">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 font-display">Report Type</label>
                        <Select value={reportType} onChange={e => setReportType(e.target.value as any)}>
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Overall">Overall</option>
                        </Select>
                    </div>
                    {reportType === 'Daily' && (
                        <div>
                            <label className="block text-sm font-medium mb-1 font-display">Date</label>
                            <Input 
                                type="date" 
                                value={reportDate} 
                                onChange={e => setReportDate(e.target.value)}
                            />
                        </div>
                    )}
                    {reportType === 'Weekly' && (
                        <div>
                            <label className="block text-sm font-medium mb-1 font-display">Week</label>
                            <Input 
                                type="week" 
                                value={reportWeek}
                                onChange={e => setReportWeek(e.target.value)}
                            />
                        </div>
                    )}
                    {reportType === 'Monthly' && (
                        <div>
                            <label className="block text-sm font-medium mb-1 font-display">Month</label>
                            <Input 
                                type="month"
                                value={reportMonth}
                                onChange={e => setReportMonth(e.target.value)}
                            />
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="button" onClick={handleGenerateReport}>Generate</Button>
                </div>
            </Modal>
        );
    };

    // Dispatcher for completing tasks based on type
    const onCompleteTaskDispatch = (task: Task) => {
        if (task.taskType === 'Notes') {
            setNoteTaskToComplete(task);
        } else {
            setTaskToComplete(task);
        }
    };

    if (tasks === undefined || testPlans === undefined || activeTimer === undefined || activeBreak === undefined) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-200 bg-slate-950">
                <p>Loading database...</p>
            </div>
        );
    }


    return (
        <div className="relative min-h-screen text-gray-200 font-sans">
            <LiveBackground />
            <Header />
            <AdminNotification />
            <StorageWarningBanner usagePercentage={usagePercentage} />
            <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
                <Routes>
                    <Route path="/" element={
                        <Planner 
                            activeTimer={activeTimer}
                            startTimer={startTaskTimer}
                            onCompleteTask={onCompleteTaskDispatch}
                        />
                    } />
                    <Route path="/test-planner" element={
                        <TestPlanner
                            tasks={tasks}
                            testPlans={testPlans}
                            activeTimer={activeTimer}
                            startPrepTimer={startTaskTimer}
                            startTestTimer={startTestTimer}
                            completedTestInfo={completedTestInfo}
                            onAnalysisComplete={() => setCompletedTestInfo(null)}
                        />
                    } />
                    <Route path="/timeline" element={<Timeline tasks={tasks} testPlans={testPlans} />} />
                    <Route path="/mentor" element={
                        <Mentor 
                            tasks={tasks} 
                            testPlans={testPlans} 
                            targetScore={targetScore} 
                            setTargetScore={handleSetTargetScore} 
                        />
                    } />
                    <Route path="/self-tracker" element={<SelfTracker tasks={tasks} testPlans={testPlans} />} />
                    <Route path="/insights" element={<Insights tasks={tasks} testPlans={testPlans} targetScore={targetScore} />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </main>
            <GlobalTimer activeTimer={activeTimer} pauseTimer={pauseTimer} resumeTimer={resumeTimer} stopTimer={stopStudyTimer} />
            <GlobalBreakTimer activeBreak={activeBreak} pauseTimer={pauseBreakTimer} resumeTimer={resumeBreakTimer} stopTimer={stopBreakTimer} />

            {!activeTimer && !activeBreak && (
                <>
                    {/* Backdrop */}
                    {isToolsMenuOpen && (
                        <div 
                            className="fixed inset-0 z-[55] bg-black/50 animate-fadeIn"
                            onClick={() => setIsToolsMenuOpen(false)}
                            aria-hidden="true"
                        ></div>
                    )}

                    <div className="fixed bottom-20 md:bottom-5 right-5 z-[60] flex flex-col items-end gap-4">
                        {/* Secondary actions */}
                        <div
                            className={cn(
                                "flex flex-col items-end gap-4 transition-all duration-300 ease-in-out",
                                isToolsMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                            )}
                        >
                            {[
                                { label: "Take a Break", icon: <CoffeeIcon className="w-6 h-6" />, action: () => setIsBreakModalOpen(true), className: "bg-brand-orange-400/90 hover:bg-brand-orange-400" },
                                { label: "Add Manual Break", icon: <PlusIcon className="w-6 h-6" />, action: () => setIsManualBreakModalOpen(true), className: "bg-slate-600/90 hover:bg-slate-500" },
                                { label: "Generate Report", icon: <BarChartIcon className="w-6 h-6" />, action: () => setIsGenerateReportModalOpen(true), className: "bg-cyan-500/90 hover:bg-cyan-500" },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-3">
                                    <span className="bg-slate-900/80 text-white text-sm font-semibold px-3 py-1 rounded-md shadow-lg">{item.label}</span>
                                    <Button 
                                        onClick={() => { item.action(); setIsToolsMenuOpen(false); }}
                                        className={cn("h-12 w-12 rounded-full shadow-lg flex items-center justify-center text-white", item.className)}
                                        aria-label={item.label}
                                        tabIndex={isToolsMenuOpen ? 0 : -1}
                                    >
                                        {item.icon}
                                    </Button>
                                </div>
                            ))}
                        </div>
                        
                        {/* Main FAB */}
                        <Button 
                            onClick={() => setIsToolsMenuOpen(prev => !prev)}
                            className="h-16 w-16 rounded-full shadow-lg flex items-center justify-center bg-brand-amber-500 text-white hover:bg-brand-amber-400 focus:ring-brand-amber-500"
                            aria-label="Toggle tools menu"
                            aria-expanded={isToolsMenuOpen}
                        >
                            <div className="relative h-8 w-8 flex items-center justify-center">
                                <WrenchIcon className={cn("absolute transition-all duration-300", isToolsMenuOpen ? "opacity-0 -rotate-45 scale-50" : "opacity-100 rotate-0 scale-100")} />
                                <XIcon className={cn("absolute transition-all duration-300", isToolsMenuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-45 scale-50")} />
                            </div>
                        </Button>
                    </div>
                </>
            )}
            
            <BottomNavBar />
            
            <TargetDurationModal 
                isOpen={!!timerSetup}
                onClose={() => setTimerSetup(null)}
                onStart={handleStartTimerWithDuration}
                itemName={timerSetup?.task?.name || timerSetup?.test?.name || ''}
            />

            <ConfirmSessionModal 
                sessionInfo={sessionToConfirm}
                onConfirm={handleConfirmSession}
                onClose={() => setSessionToConfirm(null)}
            />

             <TakeBreakModal 
                isOpen={isBreakModalOpen}
                onClose={() => setIsBreakModalOpen(false)}
                onStart={handleStartBreak}
            />

            <ConfirmBreakModal
                breakInfo={breakToConfirm}
                onConfirm={handleConfirmBreakSession}
                onClose={() => setBreakToConfirm(null)}
            />

            <AddManualBreakModal
                isOpen={isManualBreakModalOpen}
                onClose={() => setIsManualBreakModalOpen(false)}
                onAdd={handleAddManualBreak}
            />

            <WelcomeBackModal
                breakInfo={breakToFinalize}
                tasks={tasks || []}
                onClose={() => setBreakToFinalize(null)}
                onStartTask={(task) => {
                    setBreakToFinalize(null);
                    startTaskTimer(task);
                }}
            />

            <SimpleCompletionModal
                task={noteTaskToComplete}
                onClose={() => setNoteTaskToComplete(null)}
                onConfirm={handleCompleteSimpleTask}
            />

            <CompleteLectureModal 
                task={taskToComplete && ['Lecture', 'Revision', 'RevisionHW', 'Revision4th'].includes(taskToComplete.taskType) ? taskToComplete : null}
                initialDuration={completionTaskDuration}
                onComplete={handleCompleteLecture}
                onClose={closeCompletionModals}
            />
            <CompletePracticeModal 
                task={taskToComplete && ['Practice', 'Practice7th', 'Practice9th'].includes(taskToComplete.taskType) ? taskToComplete : null}
                initialDuration={completionTaskDuration}
                onComplete={handleCompletePractice}
                onClose={closeCompletionModals}
            />
            
            <GenerateReportModal isOpen={isGenerateReportModalOpen} onClose={() => setIsGenerateReportModalOpen(false)} />

            {activeReport && activeReport.type === 'Daily' && (
                <DailyReport
                    date={new Date(new Date(activeReport.date!).toLocaleString("en-US", { timeZone: "UTC" }))}
                    allTasks={tasks || []}
                    allTestPlans={testPlans || []}
                    allBreakSessions={breakSessions || []}
                    onClose={() => setActiveReport(null)}
                />
            )}
            {activeReport && activeReport.type === 'Weekly' && (
                <WeeklyReport
                    week={activeReport.week!}
                    allTasks={tasks || []}
                    allTestPlans={testPlans || []}
                    allBreakSessions={breakSessions || []}
                    onClose={() => setActiveReport(null)}
                />
            )}
            {activeReport && activeReport.type === 'Monthly' && (
                <MonthlyReport
                    month={activeReport.month!}
                    allTasks={tasks || []}
                    allTestPlans={testPlans || []}
                    allBreakSessions={breakSessions || []}
                    onClose={() => setActiveReport(null)}
                />
            )}
            {activeReport && activeReport.type === 'Overall' && (
                <OverallReport
                    allTasks={tasks || []}
                    allTestPlans={testPlans || []}
                    allBreakSessions={breakSessions || []}
                    onClose={() => setActiveReport(null)}
                />
            )}
        </div>
    );
}

export default App;
