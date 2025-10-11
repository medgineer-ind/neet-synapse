
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
import { ClipboardListIcon, LayoutDashboardIcon, SettingsIcon, FileTextIcon, CalendarClockIcon, PlayIcon, PauseIcon, StopCircleIcon, MegaphoneIcon, XIcon, BrainCircuitIcon, ActivityIcon, HistoryIcon, AlertTriangleIcon, MaximizeIcon, MinimizeIcon } from './components/ui/Icons';
import { Task, ActiveTimer, StudySession, TestPlan, TopicPracticeAttempt, RevisionAttempt } from './types';
import LiveBackground from './components/LiveBackground';
import useStorageUsage from './hooks/useStorageUsage';
import { generatePerformanceSummary, formatDuration, cn } from './lib/utils';
import { Button, Modal, Input, Textarea } from './components/ui/StyledComponents';
import { TimeEditor } from './components/ui/TimeEditor';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, setMiscItem, getMiscItem } from './services/db';


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
const CircularProgress: React.FC<{ progress: number; isUrgent: boolean; isOverTime: boolean }> = ({ progress, isUrgent, isOverTime }) => {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    
    const colorClass = isOverTime ? 'text-red-500' : isUrgent ? 'text-yellow-500' : 'text-brand-amber-400';

    return (
        <svg className="w-32 h-32" viewBox="0 0 120 120">
            <circle className="text-slate-800" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
            <circle
                className={cn(colorClass, "transition-all duration-500")}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="60"
                cy="60"
                transform="rotate(-90 60 60)"
            />
        </svg>
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
        <div className={cn(baseClasses, dynamicClasses, "bottom-5 right-5 p-4 animate-fadeIn w-80")}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-200 truncate pr-2" title={timerName}>{timerName}</h3>
                <Button onClick={() => setIsMinimized(true)} size="sm" variant="ghost" className="p-2"><MinimizeIcon className="w-5 h-5" /></Button>
            </div>

            <div className="relative flex justify-center items-center my-4">
                {targetDuration && <CircularProgress progress={progress} isUrgent={isUrgent} isOverTime={isOverTime} />}
                <div className={cn("absolute font-display font-bold text-4xl tracking-wider", timeColorClass)}>
                    {isOverTime ? overtimeDisplay : displayTime}
                </div>
            </div>

            {targetDuration && (
                <div className="text-center text-xs space-y-1 mb-4">
                    <p>Target: <span className="font-semibold text-gray-300">{formatDuration(targetDuration)}</span></p>
                    {isOverTime 
                        ? <p className="font-bold text-red-400">OVER TIME</p> 
                        : <p>Remaining: <span className="font-semibold text-gray-300">{formatDuration(timeRemaining!)}</span></p>
                    }
                </div>
            )}

            <div className="flex justify-center gap-3">
                {activeTimer.isPaused ? (
                    <Button onClick={resumeTimer} variant="secondary" className="flex-1"><PlayIcon className="w-5 h-5" /> Resume</Button>
                ) : (
                    <Button onClick={pauseTimer} variant="secondary" className="flex-1"><PauseIcon className="w-5 h-5" /> Pause</Button>
                )}
                <Button onClick={stopTimer} variant="danger" className="flex-1"><StopCircleIcon className="w-5 h-5" /> Stop</Button>
            </div>
        </div>
    );
};

// --- Modals ---

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
                        <item.icon className="w-6 h-6 mb-1 transition-transform group-hover:scale-110" /> {item.label}
                        {({ isActive }) => isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-amber-400 rounded-full shadow-glow-amber-xs"></div>}
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

const SpacedRevisionModal: React.FC<{
    task: Task | null;
    onClose: () => void;
    onComplete: (revisionTask: Task, duration: number, difficulty: number, notes: string) => void;
}> = ({ task, onClose, onComplete }) => {
    const targetTimes: { [key: number]: number } = { 3: 15 * 60, 5: 10 * 60, 7: 5 * 60, 15: 5 * 60, 30: 5 * 60 };
    const targetDuration = task?.revisionDay ? targetTimes[task.revisionDay] : 0;

    const [time, setTime] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [difficulty, setDifficulty] = useState(3);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isActive) {
            interval = setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        } else if (!isActive && time !== 0) {
            clearInterval(interval!);
        }
        return () => clearInterval(interval!);
    }, [isActive, time]);
    
    useEffect(() => {
        setTime(0);
        setIsActive(true);
        setDifficulty(3);
        setNotes('');
    }, [task]);

    if (!task) return null;
    
    const timeRemaining = targetDuration - time;
    const isOverTime = timeRemaining < 0;
    const urgencyThreshold = targetDuration * 0.2; // 20% remaining
    const isUrgent = !isOverTime && timeRemaining <= urgencyThreshold;

    const displayTime = isOverTime ? `+${formatDuration(time - targetDuration)}` : formatDuration(timeRemaining);

    const modalBorderClass = isOverTime 
        ? 'border-red-500/80 shadow-glow-amber-lg animate-pulseGlow' 
        : isUrgent 
        ? 'border-yellow-500/80 animate-pulseGlow' 
        : 'border-cyan-400/20';

    const handleComplete = () => {
        setIsActive(false);
        onComplete(task, time, difficulty, notes);
    };

    return (
        <Modal isOpen={!!task} onClose={onClose} title={`Grab It Completely`} maxWidth="max-w-xl">
             <div className={cn("relative bg-slate-900/80 backdrop-blur-2xl border-2 rounded-lg p-6 w-full my-4 transition-all duration-500", modalBorderClass)}>
                <h3 className="font-semibold text-gray-200 text-center text-lg mb-4 truncate" title={task.name}>{task.name}</h3>
                <div className="text-center">
                    <p className="font-display text-lg text-gray-400">Target Time: {formatDuration(targetDuration)}</p>
                    <p className="font-display font-bold text-7xl my-4 tracking-wider">{displayTime}</p>
                    {isOverTime && <p className="text-red-400 font-bold text-lg animate-fadeIn">DANGER: TIME OVER LIMIT!</p>}
                    {isUrgent && <p className="text-yellow-400 font-bold text-lg animate-fadeIn">HURRY UP!</p>}
                </div>

                <div className="my-6">
                    <label className="block mb-2 font-display text-lg text-center">How difficult did you feel instantly?</label>
                    <div className="flex items-center gap-4 my-4">
                        <span className="text-sm text-gray-400">Easy</span>
                        <input type="range" min="1" max="5" value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-500" />
                        <span className="text-sm text-gray-400">Hard</span>
                        <span className="font-bold text-cyan-400 text-2xl w-8 text-center">{difficulty}</span>
                    </div>
                </div>

                {task.notes && (
                    <div className="my-6">
                        <label className="block mb-2 font-display text-lg text-center">Notes from Previous Revisions</label>
                        <div className="max-h-24 overflow-y-auto p-3 bg-black/30 rounded-md text-sm text-gray-300 whitespace-pre-wrap font-mono">
                            {task.notes}
                        </div>
                    </div>
                )}

                <div className="my-6">
                    <label className="block mb-2 font-display text-lg text-center">Add Notes for this Revision</label>
                    <Textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="e.g., Found a tricky concept, need to review again..."
                        rows={3}
                    />
                </div>

                <div className="flex justify-center gap-4 mt-6">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleComplete} className="bg-cyan-500 text-cyan-900 hover:bg-cyan-400 focus:ring-cyan-500 shadow-glow-amber">Finish Revision</Button>
                </div>
            </div>
        </Modal>
    )
};


const App: React.FC = () => {
    const tasks = useLiveQuery(() => db.tasks.orderBy('date').toArray(), []);
    const testPlans = useLiveQuery(() => db.testPlans.orderBy('date').toArray(), []);
    const activeTimer = useLiveQuery(() => getMiscItem<ActiveTimer | null>('activeTimer', null), null);
    const [targetScore, setTargetScore] = useState(680);

    const [timerSetup, setTimerSetup] = useState<{ task?: Task; test?: TestPlan } | null>(null);
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
    const [taskToFinalize, setTaskToFinalize] = useState<{ task: Task; duration: number } | null>(null);
    const [sessionToConfirm, setSessionToConfirm] = useState<{ task: Task; duration: number } | null>(null);
    const [completedTestInfo, setCompletedTestInfo] = useState<{ test: TestPlan, duration: number } | null>(null);
    const [revisingTask, setRevisingTask] = useState<Task | null>(null);
    const { usagePercentage, refreshUsage } = useStorageUsage();
    
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
        if (activeTimer) {
             alert("Another timer is already running. Please stop it before starting a new one.");
            return;
        }
        setTimerSetup({ task });
    };

    const startTestTimer = (test: TestPlan) => {
        if (activeTimer) {
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

    const stopTimer = () => {
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
    const handleCompleteLecture = (difficulty: number, duration: number) => {
        if (!taskToComplete) return;

        const originalTask = taskToComplete;

        db.transaction('rw', db.tasks, async () => {
             if (taskToFinalize) { // New task from TestPlanner
                const performanceSummary = generatePerformanceSummary(difficulty, undefined, undefined, duration);
                // FIX: Object literal may only specify known properties, and 'id' does not exist in type 'Omit<Task, "id">'.
                // The original logic was incorrect. A new Task needs a unique ID to be added to the database.
                const finalTask: Task = {
                    ...taskToFinalize.task,
                    id: crypto.randomUUID(),
                    status: 'Completed',
                    difficulty,
                    notes: (taskToFinalize.task.notes || '') + performanceSummary,
                    sessions: [{ date: new Date().toISOString(), duration }],
                };
                const newTaskId = await db.tasks.add(finalTask);
                
                if (originalTask.taskType === 'Lecture') {
                    await createSpacedRevisionTasks(originalTask, newTaskId);
                }

            } else { // Existing task from Planner
                const performanceSummary = generatePerformanceSummary(difficulty, undefined, undefined, duration);
                const updatedNotes = (originalTask.notes || '') + performanceSummary;
                
                await db.tasks.update(originalTask.id, {
                    status: 'Completed',
                    difficulty,
                    notes: updatedNotes,
                    sessions: [{ date: originalTask.date, duration }]
                });

                if (originalTask.taskType === 'Lecture') {
                     await createSpacedRevisionTasks(originalTask, originalTask.id);
                }
            }
        });

        setTaskToComplete(null);
        setTaskToFinalize(null);
    };

    const createSpacedRevisionTasks = async (originalTask: Task, sourceTaskId: string | number) => {
        const revisionDays = [3, 5, 7, 15, 30];
        
        const existingRevisions = await db.tasks.where({ sourceLectureTaskId: sourceTaskId as string }).toArray();
        const existingDays = new Set(existingRevisions.map(t => t.revisionDay));

        // FIX: Explicitly type `newRevisionTasks` as `Task[]` to prevent TypeScript
        // from inferring `taskType` as a generic `string` instead of the specific `TaskType`.
        const newRevisionTasks: Task[] = revisionDays
            .filter(day => !existingDays.has(day))
            .map(day => {
                const revisionDate = new Date();
                revisionDate.setDate(revisionDate.getDate() + day);
                return {
                    id: crypto.randomUUID(),
                    name: `Day ${day} Spaced Revision for "${originalTask.name}"`,
                    subject: originalTask.subject,
                    chapter: originalTask.chapter,
                    microtopics: originalTask.microtopics,
                    taskType: 'SpacedRevision',
                    date: revisionDate.toISOString().split('T')[0],
                    status: 'Pending',
                    priority: 'High',
                    sessions: [],
                    sourceLectureTaskId: sourceTaskId as string,
                    revisionDay: day,
                };
            });
        
        if (newRevisionTasks.length > 0) {
            await db.tasks.bulkAdd(newRevisionTasks);
        }
    };

    const handleCompleteRevision = (revisionTask: Task, duration: number, difficulty: number, notes: string) => {
        db.transaction('rw', db.tasks, async () => {
            // Update original lecture task with revision history
            const originalLectureTask = await db.tasks.get(revisionTask.sourceLectureTaskId!);
            if (originalLectureTask) {
                const newAttempt: RevisionAttempt = {
                    revisionDay: revisionTask.revisionDay!,
                    date: new Date().toISOString(),
                    duration,
                    difficulty,
                    notes: notes,
                };
                await db.tasks.update(originalLectureTask.id, {
                    revisionHistory: [...(originalLectureTask.revisionHistory || []), newAttempt]
                });
            }

            // Update the revision task itself to be completed
            const currentNotes = revisionTask.notes || '';
            const newNotesEntry = notes.trim() ? `\n\n--- My Notes for Day ${revisionTask.revisionDay} ---\n${notes}` : '';
            await db.tasks.update(revisionTask.id, {
                status: 'Completed',
                sessions: [{ date: new Date().toISOString(), duration }],
                difficulty,
                notes: currentNotes + newNotesEntry,
            });

            // Carry over notes to the next revision task
            if (notes.trim() && revisionTask.revisionDay) {
                const revisionDays = [3, 5, 7, 15, 30];
                const currentDayIndex = revisionDays.indexOf(revisionTask.revisionDay);
                if (currentDayIndex !== -1 && currentDayIndex < revisionDays.length - 1) {
                    const nextRevisionDay = revisionDays[currentDayIndex + 1];
                    const nextRevisionTask = await db.tasks
                        .where({ sourceLectureTaskId: revisionTask.sourceLectureTaskId, revisionDay: nextRevisionDay })
                        .first();

                    if (nextRevisionTask) {
                        const notesHeader = `\n\n--- Notes from Day ${revisionTask.revisionDay} Revision ---\n`;
                        const newNotes = notesHeader + notes;
                        await db.tasks.update(nextRevisionTask.id, {
                            notes: (nextRevisionTask.notes || '') + newNotes
                        });
                    }
                }
            }
        });
        setRevisingTask(null);
    };

    const handleCompletePractice = (total: number, correct: number, duration: number, incorrectCount: number) => {
        if (!taskToComplete) return;

        if (taskToFinalize) { // New task from TestPlanner timer
            const performanceSummary = generatePerformanceSummary(undefined, total, correct, duration, incorrectCount);
             // FIX: Object literal may only specify known properties, and 'id' does not exist in type 'Omit<Task, "id">'.
             // The original logic was incorrect. A new Task needs a unique ID to be added to the database.
             const finalTask: Task = {
                ...taskToFinalize.task,
                id: crypto.randomUUID(),
                status: 'Completed',
                totalQuestions: total,
                correctAnswers: correct,
                incorrectAnswers: incorrectCount,
                notes: (taskToFinalize.task.notes || '') + performanceSummary,
                sessions: [{ date: new Date().toISOString(), duration: duration }],
            };
            db.tasks.add(finalTask);

            const testNameMatch = taskToFinalize.task.notes.match(/For upcoming test: "([^"]+)"/);
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
                sessions: [{ date: taskToComplete.date, duration }]
            });
        }

        setTaskToComplete(null);
        setTaskToFinalize(null);
    };

    const completionTaskDuration = taskToFinalize 
        ? taskToFinalize.duration 
        : taskToComplete 
            ? (taskToComplete.sessions || []).reduce((sum, s) => sum + s.duration, 0)
            : 0;

    const closeCompletionModals = () => {
        setTaskToComplete(null);
        setTaskToFinalize(null);
    }

    if (tasks === undefined || testPlans === undefined || activeTimer === undefined) {
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
                            onCompleteTask={setTaskToComplete}
                            onStartRevision={setRevisingTask}
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
            <GlobalTimer activeTimer={activeTimer} pauseTimer={pauseTimer} resumeTimer={resumeTimer} stopTimer={stopTimer} />
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

            <CompleteLectureModal 
                task={taskToComplete && (taskToComplete.taskType === 'Lecture' || taskToComplete.taskType === 'Revision') ? taskToComplete : null}
                initialDuration={completionTaskDuration}
                onComplete={handleCompleteLecture}
                onClose={closeCompletionModals}
            />
            <CompletePracticeModal 
                task={taskToComplete && taskToComplete.taskType === 'Practice' ? taskToComplete : null}
                initialDuration={completionTaskDuration}
                onComplete={handleCompletePractice}
                onClose={closeCompletionModals}
            />
            <SpacedRevisionModal
                task={revisingTask}
                onClose={() => setRevisingTask(null)}
                onComplete={handleCompleteRevision}
            />
        </div>
    );
}

export default App;