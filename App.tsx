
import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Planner from './components/Planner';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import TestPlanner from './components/TestPlanner';
import Timeline from './components/Timeline';
import { ClipboardListIcon, LayoutDashboardIcon, SettingsIcon, FileTextIcon, CalendarClockIcon, PlayIcon, PauseIcon, StopCircleIcon, MegaphoneIcon, XIcon } from './components/ui/Icons';
import { Task, ActiveTimer, StudySession, TestPlan, TopicPracticeAttempt } from './types';
import LiveBackground from './components/LiveBackground';
import useLocalStorage from './hooks/useLocalStorage';
import { generatePerformanceSummary, parseDurationFromInput, formatDuration } from './lib/utils';
import { Button, Modal, Input } from './components/ui/StyledComponents';
import { TimeEditor } from './components/ui/TimeEditor';


// --- ADMIN NOTIFICATION CONFIG ---
// To show a new notification, change the id, update content, and set active to true.
const adminNotificationConfig = {
  id: 'update-2024-07-29-v1', // IMPORTANT: Change this ID for every new notification to re-show it.
  active: true, // Set to 'false' to hide the notification entirely.
  title: 'Message from the Developer',
  message: 'Welcome to NEET Synapse! This app is a work in progress, and your feedback is valuable. Please share your thoughts on my social channels linked in the Settings page.',
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
                // If localStorage is unavailable, just show the notification
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
        <div className="sticky top-16 z-40 bg-slate-900/70 backdrop-blur-xl border-b border-brand-cyan-500/20 animate-fadeIn" role="alert">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3">
                        <MegaphoneIcon className="w-6 h-6 text-brand-cyan-400 flex-shrink-0" />
                        <div className="text-sm">
                            <p className="font-bold text-brand-cyan-400">{title}</p>
                            <p className="text-gray-300">
                                {message}{' '}
                                {link && linkText && (
                                    <a href={link} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-cyan-300 font-semibold">
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
        <div className="fixed bottom-20 md:bottom-5 right-5 z-[60] bg-slate-900/70 backdrop-blur-xl border border-brand-cyan-500/20 rounded-lg shadow-glow-cyan-intense flex items-center justify-between gap-4 p-3 animate-fadeIn">
            <div className="flex-1 min-w-0">
                <p className="font-bold text-brand-cyan-400 text-lg">{displayTime}</p>
                <p className="text-xs text-gray-300 truncate" title={timerName}>{timerName}</p>
            </div>
            <div className="flex items-center gap-2">
                {activeTimer.isPaused ? (
                    <Button onClick={resumeTimer} size="sm" variant="secondary" aria-label="Resume Timer"><PlayIcon className="w-4 h-4" /></Button>
                ) : (
                    <Button onClick={pauseTimer} size="sm" variant="secondary" aria-label="Pause Timer"><PauseIcon className="w-4 h-4" /></Button>
                )}
                <Button onClick={stopTimer} size="sm" variant="danger" aria-label="Stop Timer"><StopCircleIcon className="w-4 h-4" /></Button>
            </div>
        </div>
    );
};


const Header: React.FC = () => {
    const activeLinkStyle = {
        background: 'rgba(0, 239, 255, 0.1)',
        boxShadow: '0 0 15px rgba(0, 239, 255, 0.4)',
        color: '#00EFFF',
        borderBottom: '2px solid #00EFFF'
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-xl border-b border-brand-cyan-500/20">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <span className="font-bold text-xl text-brand-cyan-500 tracking-wider drop-shadow-[0_0_5px_rgba(0,239,255,0.7)]">
                            NEET Synapse
                        </span>
                    </div>
                    <div className="hidden md:flex items-center space-x-4">
                        <NavLink
                            to="/"
                            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300"
                            style={({ isActive }) => isActive ? activeLinkStyle : { borderBottom: '2px solid transparent' }}
                        >
                           <ClipboardListIcon className="w-5 h-5 mr-2" /> Planner
                        </NavLink>
                        <NavLink
                            to="/test-planner"
                            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300"
                            style={({ isActive }) => isActive ? activeLinkStyle : { borderBottom: '2px solid transparent' }}
                        >
                           <FileTextIcon className="w-5 h-5 mr-2" /> Test Planner
                        </NavLink>
                         <NavLink
                            to="/timeline"
                            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300"
                            style={({ isActive }) => isActive ? activeLinkStyle : { borderBottom: '2px solid transparent' }}
                        >
                           <CalendarClockIcon className="w-5 h-5 mr-2" /> View Agenda
                        </NavLink>
                        <NavLink
                            to="/dashboard"
                            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300"
                            style={({ isActive }) => isActive ? activeLinkStyle : { borderBottom: '2px solid transparent' }}
                        >
                            <LayoutDashboardIcon className="w-5 h-5 mr-2" /> Dashboard
                        </NavLink>
                        <NavLink
                            to="/settings"
                            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300"
                            style={({ isActive }) => isActive ? activeLinkStyle : { borderBottom: '2px solid transparent' }}
                        >
                            <SettingsIcon className="w-5 h-5 mr-2" /> Settings
                        </NavLink>
                    </div>
                </div>
            </nav>
        </header>
    );
};

const BottomNavBar: React.FC = () => {
    const activeLinkStyle = {
        color: '#00EFFF', // brand-cyan-500
        background: 'linear-gradient(to top, rgba(0, 239, 255, 0.2), transparent)',
        borderTop: '2px solid #00EFFF' 
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-xl border-t border-brand-cyan-500/20">
            <div className="container mx-auto flex justify-around h-16">
                 <NavLink
                    to="/"
                    className="flex flex-col items-center justify-center w-full text-xs font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300 pt-1"
                    style={({ isActive }) => isActive ? activeLinkStyle : {}}
                >
                   <ClipboardListIcon className="w-6 h-6 mb-1" /> Planner
                </NavLink>
                <NavLink
                    to="/test-planner"
                    className="flex flex-col items-center justify-center w-full text-xs font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300 pt-1"
                    style={({ isActive }) => isActive ? activeLinkStyle : {}}
                >
                   <FileTextIcon className="w-6 h-6 mb-1" /> Test Planner
                </NavLink>
                <NavLink
                    to="/timeline"
                    className="flex flex-col items-center justify-center w-full text-xs font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300 pt-1"
                    style={({ isActive }) => isActive ? activeLinkStyle : {}}
                >
                   <CalendarClockIcon className="w-6 h-6 mb-1" /> View Agenda
                </NavLink>
                <NavLink
                    to="/dashboard"
                    className="flex flex-col items-center justify-center w-full text-xs font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300 pt-1"
                    style={({ isActive }) => isActive ? activeLinkStyle : {}}
                >
                    <LayoutDashboardIcon className="w-6 h-6 mb-1" /> Dashboard
                </NavLink>
                <NavLink
                    to="/settings"
                    className="flex flex-col items-center justify-center w-full text-xs font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300 pt-1"
                    style={({ isActive }) => isActive ? activeLinkStyle : {}}
                >
                    <SettingsIcon className="w-6 h-6 mb-1" /> Settings
                </NavLink>
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
                <label className="block mb-2">How difficult was this topic? (1: Easy - 5: Hard)</label>
                <div className="flex items-center gap-4 my-4">
                    <span>1</span>
                    <input type="range" min="1" max="5" value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} className="w-full" />
                    <span>5</span>
                    <span className="font-bold text-brand-cyan-400 w-4">{difficulty}</span>
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
                        <label className="block mb-1">Total Questions Attempted</label>
                        <Input type="number" value={total} onChange={e => setTotal(e.target.value)} min="1" required />
                    </div>
                    <div>
                        <label className="block mb-1">Number of Correct Answers</label>
                        <Input type="number" value={correct} onChange={e => setCorrect(e.target.value)} min="0" max={total || undefined} required />
                    </div>
                    <div>
                        <label className="block mb-1">Number of Incorrect Answers</label>
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

    useEffect(() => {
        // One-time data migrations for tasks
        const runMigrations = () => {
            setTasks(currentTasks => {
                let needsUpdate = false;
                const migratedTasks = currentTasks.map(t => {
                    let task: Task = { ...t };
                    
                    // Migration 1: microtopic string to microtopics array
                    const oldTask = task as any;
                    if (oldTask.microtopic && !t.microtopics) {
                        needsUpdate = true;
                        const { microtopic, ...rest } = oldTask;
                        task = { ...rest, microtopics: [microtopic], sessions: t.sessions || [] };
                    }
                    
                    // Migration 2: duration number to sessions array
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
    }, []); // Only run once on mount
    
    // Effect to trigger modal after timer stops for a test-prep task
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
                // For test prep tasks, we always open the finalization modal, even if duration is 0
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

            // Update the TestPlan's topicStatus
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

            // Update the TestPlan's topicStatus
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
        <div className="relative min-h-screen text-gray-200 font-sans transition-colors duration-500">
            <LiveBackground />
            <div className="absolute inset-0 -z-10 bg-brand-blue-900/95"></div>
            <Header />
            <AdminNotification />
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