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
import { ClipboardListIcon, LayoutDashboardIcon, SettingsIcon, FileTextIcon, CalendarClockIcon, PlayIcon, PauseIcon, StopCircleIcon, MegaphoneIcon, XIcon, BrainCircuitIcon, ActivityIcon, HistoryIcon, AlertTriangleIcon } from './components/ui/Icons';
import { Task, ActiveTimer, StudySession, TestPlan, TopicPracticeAttempt } from './types';
import LiveBackground from './components/LiveBackground';
import useLocalStorage from './hooks/useLocalStorage';
import useStorageUsage from './hooks/useStorageUsage';
import { generatePerformanceSummary, formatDuration } from './lib/utils';
import { Button, Modal, Input } from './components/ui/StyledComponents';
import { TimeEditor } from './components/ui/TimeEditor';


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
    }, [isWarning, storageKey]);

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


// --- Global Timer Bar ---
const TimerBar: React.FC<{
    activeTimer: ActiveTimer | null;
    pauseTimer: () => void;
    resumeTimer: () => void;
    stopTimer: () => void;
}> = ({ activeTimer, pauseTimer, resumeTimer, stopTimer }) => {
    const [displayTime, setDisplayTime] = useState('00:00:00');

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (activeTimer && !activeTimer.isPaused) {
            interval = setInterval(() => {
                const elapsed = activeTimer.elapsedTime + (Date.now() - activeTimer.startTime);
                const totalSeconds = Math.floor(elapsed / 1000);
                const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
                const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
                const seconds = String(totalSeconds % 60).padStart(2, '0');
                setDisplayTime(`${hours}:${minutes}:${seconds}`);
            }, 1000);
        } else if (activeTimer && activeTimer.isPaused) {
            const totalSeconds = Math.floor(activeTimer.elapsedTime / 1000);
            const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
            const seconds = String(totalSeconds % 60).padStart(2, '0');
            setDisplayTime(`${hours}:${minutes}:${seconds}`);
        }

        return () => clearInterval(interval);
    }, [activeTimer]);

    if (!activeTimer) return null;

    const timerName = activeTimer.task?.name || activeTimer.test?.name || "Timer";

    return (
        <div className="fixed bottom-20 md:bottom-5 right-5 z-[60] bg-slate-900/80 backdrop-blur-xl border border-brand-amber-500/30 rounded-lg shadow-glow-amber flex items-center justify-between gap-4 p-3 animate-fadeIn w-64">
            <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-brand-amber-400 text-2xl tracking-wider">{displayTime}</p>
                <p className="text-xs text-gray-300 truncate" title={timerName}>{timerName}</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
                {activeTimer.isPaused ? (
                    <Button onClick={resumeTimer} size="sm" variant="secondary" aria-label="Resume Timer" className="p-2"><PlayIcon className="w-4 h-4" /></Button>
                ) : (
                    <Button onClick={pauseTimer} size="sm" variant="secondary" aria-label="Pause Timer" className="p-2"><PauseIcon className="w-4 h-4" /></Button>
                )}
                <Button onClick={stopTimer} size="sm" variant="danger" aria-label="Stop Timer" className="p-2"><StopCircleIcon className="w-4 h-4" /></Button>
            </div>
        </div>
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

const CompleteStudyModal: React.FC<{ 
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
    const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
    const [testPlans, setTestPlans] = useLocalStorage<TestPlan[]>('testPlans', []);
    const [activeTimer, setActiveTimer] = useLocalStorage<ActiveTimer | null>('activeTimer', null);
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
    const [taskToFinalize, setTaskToFinalize] = useState<{ task: Task; duration: number } | null>(null);
    const [sessionToConfirm, setSessionToConfirm] = useState<{ task: Task; duration: number } | null>(null);
    const [completedTestInfo, setCompletedTestInfo] = useState<{ test: TestPlan, duration: number } | null>(null);
    const [targetScore, setTargetScore] = useLocalStorage<number>('targetScore', 680);
    const { usagePercentage, refreshUsage } = useStorageUsage();
    const location = useLocation();

    useEffect(() => {
        refreshUsage();
    }, [tasks, testPlans, refreshUsage]);

    useEffect(() => {
        // One-time data migrations for tasks
        const runMigrations = () => {
            setTasks(currentTasks => {
                let needsUpdate = false;
                const migratedTasks = currentTasks.map(t => {
                    let task: Task = { ...t };
                    
                    // Fix: Cast task to 'any' to check for legacy 'microtopic' property for data migration.
                    const oldTask = t as any;
                    if (oldTask.microtopic && !t.microtopics) {
                        needsUpdate = true;
                        const { microtopic, ...rest } = oldTask;
                        task = { ...rest, microtopics: [microtopic], sessions: t.sessions || [] };
                    }
                    
                    const taskWithDuration = t as Task & { duration?: number };
                    if (taskWithDuration.duration !== undefined && !t.sessions) {
                        needsUpdate = true;
                        const { duration, ...rest } = taskWithDuration;
                        task = {
                            ...rest,
                            sessions: duration > 0 ? [{ date: t.date, duration: duration }] : [],
                        };
                    } else if (!t.sessions) {
                         needsUpdate = true;
                         task.sessions = [];
                    }

                    return task;
                });
                
                if (needsUpdate) {
                    console.log("Running data migrations for tasks...");
                    return migratedTasks;
                }
                return currentTasks;
            });
        };
        runMigrations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setActiveTimer({ task, startTime: Date.now(), elapsedTime: 0, isPaused: false });
    };

    const startTestTimer = (test: TestPlan) => {
        if (activeTimer) {
             alert("Another timer is already running. Please stop it before starting a new one.");
            return;
        }
        setActiveTimer({ test, startTime: Date.now(), elapsedTime: 0, isPaused: false });
    };

    const pauseTimer = () => {
        setActiveTimer(prev => {
            if (!prev || prev.isPaused) return prev;
            return { ...prev, elapsedTime: prev.elapsedTime + (Date.now() - prev.startTime), isPaused: true };
        });
    };

    const resumeTimer = () => {
        setActiveTimer(prev => {
            if (!prev || !prev.isPaused) return prev;
            return { ...prev, startTime: Date.now(), isPaused: false };
        });
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
        
        setActiveTimer(null);
    };

    const handleConfirmSession = (task: Task, duration: number) => {
        const newSession: StudySession = {
            date: new Date().toISOString(),
            duration: duration,
        };
        setTasks(prevTasks =>
            prevTasks.map(t =>
                t.id === task.id
                    ? { ...t, sessions: [...(t.sessions || []), newSession] }
                    : t
            )
        );
        setSessionToConfirm(null);
    };

    // --- Task Completion Logic ---
     const handleCompleteStudy = (difficulty: number, duration: number) => {
        if (!taskToComplete) return;

        if (taskToFinalize) { // This is a new task from the TestPlanner timer
            const performanceSummary = generatePerformanceSummary(difficulty, undefined, undefined, duration);
            const finalTask: Task = {
                ...taskToFinalize.task,
                status: 'Completed',
                difficulty,
                notes: (taskToFinalize.task.notes || '') + performanceSummary,
                sessions: [{ date: new Date().toISOString(), duration: duration }],
            };
            setTasks(prev => [...prev, finalTask].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

            const testNameMatch = taskToFinalize.task.notes.match(/For upcoming test: "([^"]+)"/);
            if (testNameMatch) {
                const testName = testNameMatch[1];
                setTestPlans(prevTests => prevTests.map(test => {
                    if (test.name === testName && test.status === 'Upcoming') {
                        const updatedTopicStatus = test.topicStatus.map(topic => {
                            if (
                                topic.subject === taskToFinalize.task.subject &&
                                topic.chapter === taskToFinalize.task.chapter &&
                                taskToFinalize.task.microtopics.includes(topic.microtopic)
                            ) {
                                return { ...topic, revisionDifficulty: difficulty };
                            }
                            return topic;
                        });
                        return { ...test, topicStatus: updatedTopicStatus };
                    }
                    return test;
                }));
            }
        } else { // This is an existing task from the Planner
            const performanceSummary = generatePerformanceSummary(difficulty, undefined, undefined, duration);
            const updatedNotes = (taskToComplete.notes || '') + performanceSummary;
            setTasks(prevTasks => prevTasks.map(t => t.id === taskToComplete.id ? { ...t, status: 'Completed', difficulty, notes: updatedNotes, sessions: [{ date: t.date, duration }] } : t));
        }
        
        setTaskToComplete(null);
        setTaskToFinalize(null);
    };

    const handleCompletePractice = (total: number, correct: number, duration: number, incorrectCount: number) => {
        if (!taskToComplete) return;

        if (taskToFinalize) { // New task from TestPlanner timer
            const performanceSummary = generatePerformanceSummary(undefined, total, correct, duration, incorrectCount);
             const finalTask: Task = {
                ...taskToFinalize.task,
                status: 'Completed',
                totalQuestions: total,
                correctAnswers: correct,
                incorrectAnswers: incorrectCount,
                notes: (taskToFinalize.task.notes || '') + performanceSummary,
                sessions: [{ date: new Date().toISOString(), duration: duration }],
            };
            setTasks(prev => [...prev, finalTask].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

            const testNameMatch = taskToFinalize.task.notes.match(/For upcoming test: "([^"]+)"/);
            if (testNameMatch) {
                const testName = testNameMatch[1];
                setTestPlans(prevTests => prevTests.map(test => {
                    if (test.name === testName && test.status === 'Upcoming') {
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
                        return { ...test, topicStatus: updatedTopicStatus };
                    }
                    return test;
                }));
            }
        } else { // Existing task from Planner
            const performanceSummary = generatePerformanceSummary(undefined, total, correct, duration, incorrectCount);
            const updatedNotes = (taskToComplete.notes || '') + performanceSummary;
            setTasks(prevTasks => prevTasks.map(t => t.id === taskToComplete.id ? { ...t, status: 'Completed', totalQuestions: total, correctAnswers: correct, incorrectAnswers: incorrectCount, notes: updatedNotes, sessions: [{ date: t.date, duration }] } : t));
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

    return (
        <div className="relative min-h-screen text-gray-200 font-sans bg-slate-950">
            <LiveBackground />
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95"></div>
            <Header />
            <AdminNotification />
            <StorageWarningBanner usagePercentage={usagePercentage} />
            <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
                <Routes>
                    <Route path="/" element={
                        <Planner 
                            tasks={tasks} 
                            setTasks={setTasks} 
                            activeTimer={activeTimer}
                            startTimer={startTaskTimer}
                            onCompleteTask={setTaskToComplete}
                        />
                    } />
                    <Route path="/test-planner" element={
                        <TestPlanner
                            tasks={tasks}
                            setTasks={setTasks}
                            testPlans={testPlans}
                            setTestPlans={setTestPlans}
                            activeTimer={activeTimer}
                            startPrepTimer={startTaskTimer}
                            startTestTimer={startTestTimer}
                            completedTestInfo={completedTestInfo}
                            onAnalysisComplete={() => setCompletedTestInfo(null)}
                        />
                    } />
                    <Route path="/timeline" element={<Timeline />} />
                    <Route path="/mentor" element={
                        <Mentor 
                            tasks={tasks} 
                            testPlans={testPlans} 
                            targetScore={targetScore} 
                            setTargetScore={setTargetScore} 
                        />
                    } />
                    <Route path="/self-tracker" element={<SelfTracker tasks={tasks} testPlans={testPlans} />} />
                    <Route path="/insights" element={<Insights tasks={tasks} testPlans={testPlans} targetScore={targetScore} />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </main>
            <TimerBar activeTimer={activeTimer} pauseTimer={pauseTimer} resumeTimer={resumeTimer} stopTimer={stopTimer} />
            <BottomNavBar />
            
            <ConfirmSessionModal 
                sessionInfo={sessionToConfirm}
                onConfirm={handleConfirmSession}
                onClose={() => setSessionToConfirm(null)}
            />

            <CompleteStudyModal 
                task={taskToComplete && (taskToComplete.taskType === 'Study' || taskToComplete.taskType === 'Revision') ? taskToComplete : null}
                initialDuration={completionTaskDuration}
                onComplete={handleCompleteStudy}
                onClose={closeCompletionModals}
            />
            <CompletePracticeModal 
                task={taskToComplete && taskToComplete.taskType === 'Practice' ? taskToComplete : null}
                initialDuration={completionTaskDuration}
                onComplete={handleCompletePractice}
                onClose={closeCompletionModals}
            />
        </div>
    );
}

export default App;