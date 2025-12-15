
import React, { useMemo, useState, useEffect } from 'react';
import { Task, ProgressStats, SubjectName, SubjectStats, AnalyzedTopic, TaskType, TestPlan, ChapterStats, MicrotopicStats, SubjectTestPerformance, Priority, StudySession, RevisionAttempt, BreakSession, DailyLog, TaskStatus } from '../types';
import { calculateProgress, analyzeTopicsForSubject, formatDuration, calculateStudyTimeStats, calculateOverallScore, getScoreColorClass, getScoreBgClass, getCurrentWeekString } from '../lib/utils';
import { cn } from '../lib/utils';
import { ChevronDownIcon, AtomIcon, FlaskConicalIcon, LeafIcon, DnaIcon, BookOpenIcon, RepeatIcon, TargetIcon, CheckCircleIcon, TrophyIcon, ClockIcon, BrainCircuitIcon, AlertTriangleIcon, ShareIcon, CopyIcon, StickyNoteIcon } from './ui/Icons';
import { Card, Select, Modal, Input, Button } from './ui/StyledComponents';
import DailyReport from './DailyReport';
import WeeklyReport from './WeeklyReport';
import MonthlyReport from './MonthlyReport';
import OverallReport from './OverallReport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';


type ChapterFrequency = {
    [key in SubjectName]?: {
        [chapter: string]: number;
    };
};

type HistoryItem = {
    id: string;
    name: string;
    date: string; // YYYY-MM-DD for tasks, ISO for revisions initially
    displayDateStr: string;
    sortDate: Date;
    type: TaskType;
    duration: number;
    difficulty?: number;
    accuracy?: number | null;
    notes?: string;
    sessions?: StudySession[];
    isTestPrep?: boolean;
    questionSummary?: string;
    originalTask?: Task;
    sourceLectureTaskId?: string; // New field for grouping
    children?: HistoryItem[]; // Nested subtasks
    status?: TaskStatus; // Status for subtasks
    aggregatedTime?: number; // Total time for lecture + subtasks
};


const MicrotopicHistoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    topic: { subject: SubjectName; chapter: string; microtopic: string; } | null;
}> = ({ isOpen, onClose, tasks, topic }) => {
    const [expandedHistoryItems, setExpandedHistoryItems] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string) => {
        setExpandedHistoryItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const groupedHistory = useMemo(() => {
        if (!topic) return [];

        // 1. Get all completed tasks for this topic to show as main history entries
        const relevantCompletedTasks = tasks.filter(task =>
            task.subject === topic.subject &&
            task.chapter === topic.chapter &&
            task.microtopics.includes(topic.microtopic) &&
            task.status === 'Completed' &&
            task.taskType !== 'SpacedRevision' // Legacy handling
        );

        const historyItems: HistoryItem[] = [];
        const processedSubtaskIds = new Set<string>();

        // 2. Process Lecture tasks first to establish them as parents
        const lectureTasks = relevantCompletedTasks.filter(t => t.taskType === 'Lecture');
        
        lectureTasks.forEach(lectureTask => {
            // Find all linked tasks (subtasks) from the GLOBAL tasks list (pending or completed)
            // matching the sourceLectureTaskId
            const linkedSubtasks = tasks.filter(t => t.sourceLectureTaskId === lectureTask.id);
            
            // Mark these IDs so we don't add them as standalone items later if they happen to be completed
            linkedSubtasks.forEach(t => processedSubtaskIds.add(t.id));

            // Calculate aggregated stats
            const lectureDuration = (lectureTask.sessions || []).reduce((sum, s) => sum + s.duration, 0);
            const subtasksDuration = linkedSubtasks.reduce((sum, t) => sum + (t.sessions || []).reduce((s, sess) => s + sess.duration, 0), 0);
            
            // Map subtasks to HistoryItem-like structure for rendering
            const childrenItems: HistoryItem[] = linkedSubtasks.map(sub => {
                const subDuration = (sub.sessions || []).reduce((s, sess) => s + sess.duration, 0);
                const subAccuracy = sub.totalQuestions != null && sub.correctAnswers != null && sub.totalQuestions > 0 
                    ? (sub.correctAnswers / sub.totalQuestions) * 100 
                    : null;

                return {
                    id: sub.id,
                    name: sub.name,
                    date: sub.date,
                    displayDateStr: new Date(new Date(sub.date).toLocaleString("en-US", { timeZone: "UTC" })).toLocaleDateString(),
                    sortDate: new Date(sub.date),
                    type: sub.taskType,
                    duration: subDuration,
                    difficulty: sub.difficulty,
                    accuracy: subAccuracy,
                    notes: sub.notes,
                    sessions: sub.sessions,
                    status: sub.status,
                    isTestPrep: sub.notes?.includes('For upcoming test:'),
                    questionSummary: subAccuracy !== null ? `(${sub.correctAnswers}/${sub.totalQuestions})` : undefined,
                };
            });

            // Sort children by workflow order
            const orderMap: Record<string, number> = { 'Notes': 1, 'RevisionHW': 2, 'Revision4th': 3, 'Practice7th': 4, 'Practice9th': 5 };
            childrenItems.sort((a, b) => (orderMap[a.type] || 99) - (orderMap[b.type] || 99));

            const aggregatedTime = lectureDuration + subtasksDuration;

            historyItems.push({
                id: lectureTask.id,
                name: lectureTask.name,
                date: lectureTask.date,
                displayDateStr: new Date(new Date(lectureTask.date).toLocaleString("en-US", { timeZone: "UTC" })).toLocaleDateString(),
                sortDate: new Date(lectureTask.sessions?.[0]?.date || lectureTask.date),
                type: lectureTask.taskType,
                duration: lectureDuration, // Base duration
                aggregatedTime: aggregatedTime, // Total workflow time
                difficulty: lectureTask.difficulty,
                accuracy: null,
                notes: lectureTask.notes,
                sessions: lectureTask.sessions,
                children: childrenItems,
                originalTask: lectureTask // Keep ref for legacy check
            });
        });

        // 3. Process other completed tasks that are NOT subtasks of the above lectures
        relevantCompletedTasks.forEach(task => {
            if (task.taskType !== 'Lecture' && !processedSubtaskIds.has(task.id)) {
                 const duration = (task.sessions || []).reduce((sum, s) => sum + s.duration, 0);
                 const accuracy = task.totalQuestions != null && task.correctAnswers != null && task.totalQuestions > 0 ? (task.correctAnswers / task.totalQuestions) * 100 : null;
                 
                 historyItems.push({
                    id: task.id,
                    name: task.name,
                    date: task.date,
                    displayDateStr: new Date(new Date(task.date).toLocaleString("en-US", { timeZone: "UTC" })).toLocaleDateString(),
                    sortDate: new Date(task.sessions?.[0]?.date || task.date),
                    type: task.taskType,
                    duration: duration,
                    difficulty: task.difficulty,
                    accuracy: accuracy,
                    notes: task.notes,
                    sessions: task.sessions,
                    status: task.status,
                    questionSummary: accuracy !== null ? `(${task.correctAnswers}/${task.totalQuestions})` : undefined,
                 });
            }
        });

        // 4. Handle Legacy Revisions (SpacedRevision type) if any - treat as standalone for now or attach?
        // Let's attach legacy revisions to parents if parent exists in list
        const legacyRevisions = tasks.filter(t => t.taskType === 'SpacedRevision' && t.subject === topic.subject && t.chapter === topic.chapter && t.microtopics.includes(topic.microtopic));
        
        legacyRevisions.forEach(rev => {
             // Find parent
             const parent = historyItems.find(h => h.id === rev.sourceLectureTaskId);
             const duration = (rev.sessions || []).reduce((sum, s) => sum + s.duration, 0);
             
             const revItem: HistoryItem = {
                id: rev.id,
                name: rev.name,
                date: rev.date,
                displayDateStr: new Date(new Date(rev.date).toLocaleString("en-US", { timeZone: "UTC" })).toLocaleDateString(),
                sortDate: new Date(rev.date),
                type: 'SpacedRevision',
                duration: duration,
                difficulty: rev.difficulty,
                accuracy: null,
                notes: rev.notes,
                status: rev.status,
                sessions: rev.sessions
             };

             if (parent) {
                 if (!parent.children) parent.children = [];
                 parent.children.push(revItem);
                 if (parent.aggregatedTime !== undefined) parent.aggregatedTime += duration;
             } else if (rev.status === 'Completed') {
                 // Only show standalone legacy revision if completed
                 historyItems.push(revItem);
             }
        });

        // Sort all by date descending
        return historyItems.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

    }, [tasks, topic]);
    
    // Legacy calculation for old revisionHistory array inside Lecture Task object (Pre-SpacedRevision TaskType)
    const calculateLegacyRevisionDetails = (lectureTask: Task) => {
        if (!lectureTask.revisionHistory || lectureTask.revisionHistory.length === 0) return [];
        const REVISION_SCHEDULE = [3, 5, 7, 15, 30];
        
        return REVISION_SCHEDULE.map(day => {
            const completedData = lectureTask.revisionHistory?.find(rev => rev.revisionDay === day);
            if (completedData) return { day, status: 'Completed' as const, data: completedData };
            return null;
        }).filter(Boolean);
    };

    if (!isOpen || !topic) return null;

    const renderHistoryItem = (item: HistoryItem, isChild = false) => {
        const typeStyles: Record<TaskType, string> = {
            Lecture: "bg-brand-amber-900/50 text-brand-amber-300 border-brand-amber-700",
            Revision: "bg-green-900/50 text-green-300 border-green-700",
            Practice: "bg-brand-orange-900/50 text-brand-orange-400 border-brand-orange-700",
            Notes: "bg-slate-700/50 text-slate-300 border-slate-600",
            RevisionHW: "bg-teal-900/50 text-teal-300 border-teal-700",
            Revision4th: "bg-cyan-900/50 text-cyan-300 border-cyan-700",
            Practice7th: "bg-violet-900/50 text-violet-300 border-violet-700",
            Practice9th: "bg-pink-900/50 text-pink-300 border-pink-700",
            SpacedRevision: "bg-cyan-900/50 text-cyan-300 border-cyan-700",
        };

        const isExpanded = !!expandedHistoryItems[item.id];
        const hasChildren = item.children && item.children.length > 0;
        const legacyRevisions = !hasChildren && item.type === 'Lecture' && item.originalTask ? calculateLegacyRevisionDetails(item.originalTask) : [];
        const hasLegacyRevisions = legacyRevisions.length > 0;
        
        const showExpandButton = hasChildren || hasLegacyRevisions || item.notes || (item.sessions && item.sessions.length > 0);
        
        // Status checks for children
        const isCompleted = item.status === 'Completed' || (item.type === 'Lecture'); // Root lecture is always completed in history
        const taskDate = new Date(new Date(item.date).toLocaleString("en-US", { timeZone: "UTC" }));
        const isOverdue = !isCompleted && taskDate < new Date(new Date().setHours(0,0,0,0));

        return (
            <div key={item.id} className={cn(
                "p-3 rounded-lg border-l-4 transition-all",
                item.isTestPrep 
                    ? "bg-yellow-900/20 border-yellow-500" 
                    : item.type === 'SpacedRevision'
                    ? "bg-cyan-900/20 border-cyan-500"
                    : isChild 
                    ? "bg-slate-800/30 border-l-2 border-slate-600 ml-4 mt-2" 
                    : "bg-slate-800/50 border-brand-amber-700"
            )}>
                <div className="flex justify-between items-start" onClick={() => showExpandButton && toggleExpand(item.id)}>
                    <div className={cn("flex-1 cursor-pointer", !showExpandButton && "cursor-default")}>
                        <div className="flex items-center gap-2">
                            {isChild && (
                                isCompleted ? <CheckCircleIcon className="w-4 h-4 text-green-400" /> : 
                                isOverdue ? <AlertTriangleIcon className="w-4 h-4 text-red-400" /> : 
                                <ClockIcon className="w-4 h-4 text-gray-500" />
                            )}
                            <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider", typeStyles[item.type])}>
                                {item.type === 'SpacedRevision' ? 'Spaced Rev.' : item.type}
                            </span>
                            <p className={cn("font-semibold", isChild ? "text-sm" : "")}>
                                {item.name.replace(/^.*: /, '')} 
                                {/* Removes prefix like "Notes: " for clean subtask display if desired, or keep full name */}
                            </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 ml-1">
                            {item.displayDateStr} {isChild && !isCompleted && isOverdue ? <span className="text-red-400 font-bold ml-1">(Overdue)</span> : null}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {item.aggregatedTime !== undefined && !isChild && (
                             <span className="text-xs font-bold text-brand-amber-300 bg-brand-amber-900/40 px-2 py-1 rounded border border-brand-amber-700/50">
                                Total: {formatDuration(item.aggregatedTime)}
                            </span>
                        )}
                        {showExpandButton && (
                            <button onClick={(e) => { e.stopPropagation(); toggleExpand(item.id); }} className="p-1 rounded-full hover:bg-white/10 text-gray-400" aria-label="Show details">
                                <ChevronDownIcon className={cn("w-5 h-5 transition-transform", isExpanded && "rotate-180")} />
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Stats Row */}
                {(item.duration > 0 || item.difficulty !== undefined || item.accuracy !== null) && (
                    <div className="mt-2 text-xs grid grid-cols-2 md:grid-cols-3 gap-2 text-gray-300 pl-1">
                        {item.duration > 0 && <div><ClockIcon className="w-3 h-3 inline mr-1"/>Time: <span className="font-bold">{formatDuration(item.duration)}</span></div>}
                        {item.difficulty !== undefined && <div>Difficulty: <span className="font-bold">{item.difficulty}/5</span></div>}
                        {item.accuracy !== null && <div>Accuracy: <span className="font-bold">{item.accuracy?.toFixed(0)}%</span> {item.questionSummary}</div>}
                    </div>
                )}

                {isExpanded && (
                    <div className="animate-fadeIn mt-3 space-y-3">
                        {(item.sessions || []).length > 0 && (
                            <div className="text-xs bg-black/20 p-2 rounded">
                                <strong className="text-gray-400 block mb-1">Sessions:</strong>
                                <ul className="space-y-1">
                                    {item.sessions?.map((session, index) => (
                                        <li key={index} className="flex justify-between">
                                            <span>Session {index + 1} ({new Date(session.date).toLocaleDateString()})</span>
                                            <strong>{formatDuration(session.duration)}</strong>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {item.notes && (
                            <div className="text-xs bg-black/20 p-2 rounded">
                                <strong className="text-gray-400 block mb-1">Notes:</strong>
                                <p className="whitespace-pre-wrap font-mono text-gray-300">{item.notes}</p>
                            </div>
                        )}

                        {/* Render Nested Children (Subtasks) */}
                        {hasChildren && (
                            <div className="pt-2 border-t border-white/10">
                                <strong className="text-gray-400 text-xs uppercase tracking-wider block mb-2">Workflow & Related Tasks</strong>
                                <div className="space-y-2">
                                    {item.children!.map(child => renderHistoryItem(child, true))}
                                </div>
                            </div>
                        )}

                        {/* Legacy Revisions Rendering */}
                        {hasLegacyRevisions && (
                            <div className="pt-2 border-t border-white/10">
                                <strong className="text-gray-400 font-display text-xs">Legacy Revision Data:</strong>
                                <div className="space-y-2 mt-2">
                                    {legacyRevisions.map(rev => {
                                        if (!rev) return null;
                                        const { day, status, data } = rev;
                                        if (status === 'Completed') {
                                            const details = data as RevisionAttempt;
                                            return (
                                                <div key={day} className="flex items-start gap-3 text-xs bg-slate-800/30 p-2 rounded border-l-2 border-green-600">
                                                    <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="font-semibold text-gray-200">Day {day} Revision</p>
                                                        <p className="text-gray-400">Diff: {details.difficulty}/5 | Time: {formatDuration(details.duration)}</p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`History for: ${topic.microtopic}`} maxWidth="max-w-3xl">
            <div className="max-h-[70vh] overflow-y-auto space-y-3 pr-2">
                {groupedHistory.length > 0 ? (
                    groupedHistory.map(item => renderHistoryItem(item))
                ) : (
                    <p className="text-center text-gray-400 py-8">No completed lecture history found for this microtopic.</p>
                )}
            </div>
        </Modal>
    );
};


const OverallProgressSummary: React.FC<{ stats: ProgressStats }> = ({ stats }) => {
    const percentage = stats.completionRate;
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <Card className="col-span-1 md:col-span-3 flex flex-col md:flex-row items-center justify-around p-6 gap-6">
            <div className="relative flex items-center justify-center w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                    <circle
                        className="text-slate-800"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="60"
                        cy="60"
                    />
                    <circle
                        className="text-brand-amber-400"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="60"
                        cy="60"
                        transform="rotate(-90 60 60)"
                        style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                    />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="font-display text-4xl font-bold text-brand-amber-400">{percentage.toFixed(1)}%</span>
                    <span className="font-display text-sm text-gray-400">Completed</span>
                </div>
            </div>
            <div className="flex flex-col gap-6 text-center md:text-left">
                 <div>
                    <h3 className="font-display text-gray-400 text-sm font-medium uppercase tracking-wider">Total Time Studied</h3>
                    <p className="font-display text-3xl font-bold text-brand-amber-300 mt-1">{formatDuration(stats.totalTimeStudied)}</p>
                    <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 text-xs text-gray-400 border-t border-white/10 pt-4">
                        <div className="flex items-center gap-1.5" title="Study Time">
                            <BookOpenIcon className="w-4 h-4 text-brand-amber-400" />
                            <span><strong className="text-gray-200">{formatDuration(stats.timeByCategory.Lecture)}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Revision Time">
                            <RepeatIcon className="w-4 h-4 text-green-400" />
                            <span><strong className="text-gray-200">{formatDuration(stats.timeByCategory.Revision)}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Practice Time">
                            <TargetIcon className="w-4 h-4 text-brand-orange-400" />
                            <span><strong className="text-gray-200">{formatDuration(stats.timeByCategory.Practice)}</strong></span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
                    <div>
                        <h3 className="font-display text-gray-400 text-sm font-medium uppercase tracking-wider">Completed</h3>
                        <p className="font-display text-3xl font-bold text-green-400 mt-1">{stats.completedTasks}</p>
                    </div>
                    <div>
                        <h3 className="font-display text-gray-400 text-sm font-medium uppercase tracking-wider">Pending</h3>
                        <p className="font-display text-3xl font-bold text-yellow-400 mt-1">{(stats.totalTasks - stats.completedTasks)}</p>
                    </div>
                     <div>
                        <h3 className="font-display text-gray-400 text-sm font-medium uppercase tracking-wider">Practiced</h3>
                        <p className="font-display text-3xl font-bold text-brand-orange-400 mt-1">{stats.totalQuestions}</p>
                         {stats.totalQuestions > 0 && (
                            <p className="text-xs text-gray-300">
                                {stats.totalCorrect} correct ({((stats.totalCorrect / stats.totalQuestions) * 100).toFixed(1)}%)
                            </p>
                        )}
                    </div>
                     <div>
                        <h3 className="font-display text-gray-400 text-sm font-medium uppercase tracking-wider">Incorrect</h3>
                        <p className="font-display text-3xl font-bold text-red-400 mt-1">{stats.totalIncorrect}</p>
                    </div>
                    <div>
                        <h3 className="font-display text-gray-400 text-sm font-medium uppercase tracking-wider">Skipped</h3>
                        <p className="font-display text-3xl font-bold text-gray-400 mt-1">{stats.totalSkipped}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

const ActivityTracker: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    type Period = 'Today' | 'This Week' | 'This Month';
    const [activePeriod, setActivePeriod] = useState<Period>('Today');

    const filteredTasks = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        let startDate: Date;
        let endDate: Date = new Date(today);
        endDate.setDate(endDate.getDate() + 1);

        if (activePeriod === 'Today') {
            startDate = today;
        } else if (activePeriod === 'This Week') {
            startDate = new Date(today);
            startDate.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday as start of week
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 7);
        } else { // This Month
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        }

        return tasks.filter(task => {
            const taskDate = new Date(new Date(task.date).toLocaleString("en-US", { timeZone: "UTC" }));
            return taskDate >= startDate && taskDate < endDate;
        });
    }, [tasks, activePeriod]);

    const completed = filteredTasks.filter(t => t.status === 'Completed').length;
    const total = filteredTasks.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    const iconMap: Record<TaskType, React.ReactElement> = {
        Lecture: <BookOpenIcon className="w-5 h-5 text-brand-amber-400" />,
        Revision: <RepeatIcon className="w-5 h-5 text-green-400" />,
        Practice: <TargetIcon className="w-5 h-5 text-brand-orange-400" />,
        Notes: <StickyNoteIcon className="w-5 h-5 text-slate-400" />,
        RevisionHW: <RepeatIcon className="w-5 h-5 text-teal-400" />,
        Revision4th: <RepeatIcon className="w-5 h-5 text-cyan-400" />,
        Practice7th: <TargetIcon className="w-5 h-5 text-violet-400" />,
        Practice9th: <TargetIcon className="w-5 h-5 text-pink-400" />,
        SpacedRevision: <BrainCircuitIcon className="w-5 h-5 text-cyan-400" />,
    };

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-display text-lg font-semibold text-brand-amber-400">Activity Tracker</h3>
                <div className="flex items-center bg-black/20 rounded-lg p-1">
                    {(['Today', 'This Week', 'This Month'] as Period[]).map(period => (
                        <button key={period} onClick={() => setActivePeriod(period)} className={cn("px-3 py-1 text-sm rounded-md transition-colors font-display", activePeriod === period ? "bg-brand-amber-400 text-brand-amber-900 font-semibold" : "text-gray-300 hover:bg-white/10")}>
                            {period}
                        </button>
                    ))}
                </div>
            </div>
            
            {total > 0 ? (
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{completed} / {total} tasks completed</span>
                        <span className="font-semibold text-brand-amber-400">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4">
                        <div className="bg-gradient-to-r from-brand-amber-700 to-brand-amber-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                        {filteredTasks.filter(t => t.status === 'Completed').map(task => (
                             <div key={task.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-md text-sm">
                                <div className="flex items-center gap-3 min-w-0">
                                    {iconMap[task.taskType]}
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{task.name}</p>
                                        <p className="text-xs text-gray-400 truncate" title={task.microtopics.join(', ')}>{task.microtopics.join(', ')}</p>
                                    </div>
                                </div>
                                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="text-center text-gray-400 py-8">No tasks scheduled for {activePeriod.toLowerCase()}.</p>
            )}
        </Card>
    );
}

const StudyVsBreakTimeAnalytics: React.FC<{ tasks: Task[]; breakSessions: BreakSession[] }> = ({ tasks, breakSessions }) => {
    type Period = 'Daily' | 'Weekly' | 'Monthly';
    const [activePeriod, setActivePeriod] = useState<Period>('Daily');

    const chartData = useMemo(() => {
        const studyTimeStats = calculateStudyTimeStats(tasks);
        
        const dailyBreakTotals: { [date: string]: number } = {};
        breakSessions.forEach(session => {
            const dateStr = session.date.split('T')[0];
            dailyBreakTotals[dateStr] = (dailyBreakTotals[dateStr] || 0) + session.duration;
        });
        const sortedDailyBreaks = Object.entries(dailyBreakTotals)
            .map(([date, totalTime]) => ({ date, totalTime }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
        const getStartOfWeek = (date: Date): Date => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            d.setHours(0, 0, 0, 0);
            return new Date(d.setDate(diff));
        };
        
        const weeklyBreakTotals: { [week: string]: number } = {};
        sortedDailyBreaks.forEach(({ date, totalTime }) => {
            const d = new Date(new Date(date).toLocaleString("en-US", { timeZone: "UTC" }));
            const weekStart = getStartOfWeek(d);
            const weekKey = weekStart.toISOString().split('T')[0];
            weeklyBreakTotals[weekKey] = (weeklyBreakTotals[weekKey] || 0) + totalTime;
        });
        const sortedWeeklyBreaks = Object.entries(weeklyBreakTotals)
            .map(([week, totalTime]) => ({ week, totalTime }))
            .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());

        const monthlyBreakTotals: { [month: string]: number } = {};
        sortedDailyBreaks.forEach(({ date, totalTime }) => {
            const monthKey = date.substring(0, 7) + '-01';
            monthlyBreakTotals[monthKey] = (monthlyBreakTotals[monthKey] || 0) + totalTime;
        });
        const sortedMonthlyBreaks = Object.entries(monthlyBreakTotals)
            .map(([month, totalTime]) => ({ month, totalTime }))
            .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

        const breakTimeStats = {
            daily: sortedDailyBreaks,
            weekly: sortedWeeklyBreaks,
            monthly: sortedMonthlyBreaks,
        };
        
        let studyData, breakData;
        let nameFn: (date: string) => string;
        let keyName = 'date';

        if (activePeriod === 'Daily') {
            studyData = studyTimeStats.daily.slice(-30);
            breakData = breakTimeStats.daily.slice(-30);
            nameFn = (date) => new Date(new Date(date).toLocaleString("en-US", { timeZone: "UTC" })).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else if (activePeriod === 'Weekly') {
            studyData = studyTimeStats.weekly.slice(-12);
            breakData = breakTimeStats.weekly.slice(-12);
            keyName = 'week';
            nameFn = (date) => `W/o ${new Date(new Date(date).toLocaleString("en-US", { timeZone: "UTC" })).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        } else { // Monthly
            studyData = studyTimeStats.monthly.slice(-12);
            breakData = breakTimeStats.monthly.slice(-12);
            keyName = 'month';
            nameFn = (date) => new Date(new Date(date).toLocaleString("en-US", { timeZone: "UTC" })).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        }
        
        const combinedDataMap = new Map<string, { name: string; 'Study Time': number; 'Break Time': number }>();

        studyData.forEach(d => {
            const key = (d as any)[keyName];
            combinedDataMap.set(key, { name: nameFn(key), 'Study Time': d.totalTime, 'Break Time': 0 });
        });
        
        breakData.forEach(d => {
            const key = (d as any)[keyName];
            if (combinedDataMap.has(key)) {
                combinedDataMap.get(key)!['Break Time'] = d.totalTime;
            } else {
                combinedDataMap.set(key, { name: nameFn(key), 'Study Time': 0, 'Break Time': d.totalTime });
            }
        });
        
        const sortedKeys = Array.from(combinedDataMap.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        return sortedKeys.map(key => combinedDataMap.get(key)!);
        
    }, [activePeriod, tasks, breakSessions]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const studyTime = payload.find((p: any) => p.dataKey === 'Study Time')?.value || 0;
            const breakTime = payload.find((p: any) => p.dataKey === 'Break Time')?.value || 0;
            return (
                <div className="bg-slate-900/80 backdrop-blur-sm p-2 border border-brand-amber-500/30 rounded-md text-sm">
                    <p className="label text-gray-300">{`${label}`}</p>
                    {studyTime > 0 && <p className="text-brand-amber-400">{`Study: ${formatDuration(studyTime)}`}</p>}
                    {breakTime > 0 && <p className="text-cyan-400">{`Break: ${formatDuration(breakTime)}`}</p>}
                    <p className="font-bold text-white mt-1">{`Total: ${formatDuration(studyTime + breakTime)}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                <h3 className="font-display text-lg font-semibold text-brand-amber-400">Study vs. Break Time Analytics</h3>
                <div className="flex items-center bg-black/20 rounded-lg p-1 self-start md:self-center">
                    {(['Daily', 'Weekly', 'Monthly'] as Period[]).map(period => (
                        <button key={period} onClick={() => setActivePeriod(period)} className={cn("px-3 py-1 text-sm rounded-md transition-colors font-display", activePeriod === period ? "bg-brand-amber-400 text-brand-amber-900 font-semibold" : "text-gray-300 hover:bg-white/10")}>
                            {period}
                        </button>
                    ))}
                </div>
            </div>
            <div className="h-80">
                {chartData.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#D97706" stopOpacity={0.2}/>
                                </linearGradient>
                                <linearGradient id="breakBarGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#0891b2" stopOpacity={0.4}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <YAxis tickFormatter={(tick) => `${(tick / 3600).toFixed(1)}h`} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(251, 191, 36, 0.1)'}}/>
                            <Legend />
                            <Bar dataKey="Study Time" stackId="a" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Break Time" stackId="a" fill="url(#breakBarGradient)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>Log some study or break time to see your analytics.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};


const DetailedStatsTable: React.FC<{ 
    subjectStats: SubjectStats, 
    subjectName: SubjectName, 
    onMicrotopicClick: (subject: SubjectName, chapter: string, microtopic: string) => void,
    chapterTestFrequency: ChapterFrequency
}> = ({ subjectStats, subjectName, onMicrotopicClick, chapterTestFrequency }) => {
    const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});

    const toggleExpand = (key: string) => {
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const hasData = (data: { total: number }) => data.total > 0;

    return (
        <Card className="p-6">
            <h3 className="font-display text-lg font-semibold text-brand-amber-400 mb-4">Detailed Topic Performance</h3>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-900/80 backdrop-blur-sm z-10">
                        <tr className="border-b border-white/20 text-xs uppercase text-gray-400 font-display">
                            <th className="p-3">Topic</th>
                            <th className="p-3 text-center">Time</th>
                            <th className="p-3 text-center" title="Number of times chapter is included in test plans">In Tests</th>
                            <th className="p-3 text-center">Tasks</th>
                            <th className="p-3 text-center">Avg. Diff</th>
                            <th className="p-3 text-center">Accuracy</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(Object.entries(subjectStats.chapters) as [string, ChapterStats][]).filter(([,data]) => hasData(data)).map(([chapterName, chapterData]) => {
                            const chapterMicrotopicScores = Object.values(chapterData.microtopics)
                                .filter(mt => mt.completed > 0 && (mt.avgDifficulty > 0 || mt.avgAccuracy !== null))
                                .map(mt => calculateOverallScore(mt.avgDifficulty, mt.avgAccuracy));
                            
                            const chapterAvgScore = chapterMicrotopicScores.length > 0
                                ? chapterMicrotopicScores.reduce((a, b) => a + b, 0) / chapterMicrotopicScores.length
                                : 0;

                            return (
                                <React.Fragment key={chapterName}>
                                    <tr className={cn("border-b border-white/10 bg-slate-800/40 cursor-pointer", chapterAvgScore > 0 && getScoreBgClass(chapterAvgScore))} onClick={() => toggleExpand(chapterName)}>
                                        <td className="p-3 font-semibold flex items-center gap-2">
                                            <ChevronDownIcon className={cn("w-4 h-4 transition-transform", expanded[chapterName] ? 'rotate-180' : '')}/>
                                            {chapterName}
                                        </td>
                                        <td className="p-3 text-center font-mono">{formatDuration(chapterData.totalTime)}</td>
                                        <td className="p-3 text-center font-semibold">{chapterTestFrequency[subjectName]?.[chapterName] || 0}</td>
                                        <td className="p-3 text-center">{chapterData.completed}/{chapterData.total}</td>
                                        <td className="p-3 text-center">{chapterData.avgDifficulty > 0 ? chapterData.avgDifficulty.toFixed(2) : 'N/A'}</td>
                                        <td className="p-3 text-center">{chapterData.avgAccuracy !== null ? `${chapterData.avgAccuracy.toFixed(1)}%` : 'N/A'}</td>
                                    </tr>
                                    {expanded[chapterName] && (Object.entries(chapterData.microtopics) as [string, MicrotopicStats][]).filter(([,data]) => hasData(data)).map(([microtopicName, microtopicData]) => {
                                        const microtopicScore = calculateOverallScore(microtopicData.avgDifficulty, microtopicData.avgAccuracy);
                                        return (
                                            <tr key={microtopicName} className="bg-slate-900/50 text-gray-400 cursor-pointer transition-colors hover:bg-slate-800" onClick={(e) => { e.stopPropagation(); onMicrotopicClick(subjectName, chapterName, microtopicName)}}>
                                                <td className={cn("py-2 px-3 pl-12 text-xs", microtopicScore > 0 && getScoreColorClass(microtopicScore))}>{microtopicName}</td>
                                                <td className="py-2 px-3 text-center text-xs font-mono">{formatDuration(microtopicData.totalTime)}</td>
                                                <td></td>
                                                <td className="py-2 px-3 text-center">{microtopicData.completed}/{microtopicData.total}</td>
                                                <td className="py-2 px-3 text-center">{microtopicData.avgDifficulty > 0 ? microtopicData.avgDifficulty.toFixed(2) : 'N/A'}</td>
                                                <td className="py-2 px-3 text-center">{microtopicData.avgAccuracy !== null ? `${microtopicData.avgAccuracy.toFixed(1)}%` : 'N/A'}</td>
                                            </tr>
                                        )
                                    })}
                                </React.Fragment>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    )
};

const SubjectDetailView: React.FC<{ 
    subjectName: SubjectName; 
    subjectStats: SubjectStats;
    onMicrotopicClick: (subject: SubjectName, chapter: string, microtopic: string) => void;
    chapterTestFrequency: ChapterFrequency;
    completedTests: TestPlan[];
}> = ({ subjectName, subjectStats, onMicrotopicClick, chapterTestFrequency, completedTests }) => {
    return (
        <div className="animate-fadeIn space-y-8 mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SubjectStatsCard title="Completion" value={`${subjectStats.completionRate.toFixed(1)}%`} />
                <SubjectStatsCard title="Completed Tasks" value={`${subjectStats.completed}/${subjectStats.total}`} />
                <SubjectStatsCard title="Avg. Difficulty" value={subjectStats.avgDifficulty > 0 ? subjectStats.avgDifficulty.toFixed(2) : 'N/A'} />
                <SubjectStatsCard title="Avg. Accuracy" value={subjectStats.avgAccuracy !== null ? `${subjectStats.avgAccuracy.toFixed(1)}%` : 'N/A'} />
            </div>
            <DetailedStatsTable subjectStats={subjectStats} subjectName={subjectName} onMicrotopicClick={onMicrotopicClick} chapterTestFrequency={chapterTestFrequency}/>
        </div>
    );
}

const subjectTabs: { name: SubjectName, icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { name: 'Physics', icon: AtomIcon },
    { name: 'Chemistry', icon: FlaskConicalIcon },
    { name: 'Botany', icon: LeafIcon },
    { name: 'Zoology', icon: DnaIcon },
];

const CountdownTimer = () => {
    const targetDate = useMemo(() => new Date('2026-05-03T14:00:00'), []);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const timer = setInterval(() => {
            const difference = targetDate.getTime() - new Date().getTime();
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                clearInterval(timer);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);
    
    const pad = (num: number) => num.toString().padStart(2, '0');

    return (
        <Card className="flex flex-col items-center justify-center p-6 text-center">
            <h2 className="font-display flex items-center gap-2 text-xl font-semibold text-brand-amber-400 mb-4">
                <TrophyIcon className="w-6 h-6" />
                Countdown to NEET 2026
            </h2>
            <div className="flex space-x-4 md:space-x-8">
                {Object.entries(timeLeft).map(([unit, value]) => (
                     <div key={unit} className="flex flex-col items-center w-20">
                        <span className="font-display text-4xl md:text-5xl font-bold tracking-tighter text-white">{pad(value as number)}</span>
                        <span className="font-display text-xs text-gray-400 uppercase">{unit}</span>
                    </div>
                ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">Target: 3rd May 2026, 2:00 PM</p>
        </Card>
    );
};

const TestPerformanceSummary: React.FC<{ completedTests: TestPlan[] }> = ({ completedTests }) => {
    const summary = useMemo(() => {
        if (completedTests.length === 0) return null;
        let totalMarksObtained = 0, totalPossibleMarks = 0, totalQuestions = 0, totalCorrect = 0, totalIncorrect = 0, totalSkipped = 0, totalTestDuration = 0;
        completedTests.forEach(test => {
            if (test.analysis) {
                totalMarksObtained += test.analysis.marksObtained || 0;
                totalPossibleMarks += test.analysis.totalMarks || 0;
                totalTestDuration += test.analysis.testDuration || 0;
                if (test.analysis.subjectWisePerformance) {
                    (Object.values(test.analysis.subjectWisePerformance) as SubjectTestPerformance[]).forEach(data => {
                        totalQuestions += data.totalQuestions;
                        totalCorrect += data.correct;
                        totalIncorrect += data.incorrect;
                        totalSkipped += data.skipped;
                    });
                }
            }
        });
        const avgPercentage = totalPossibleMarks > 0 ? (totalMarksObtained / totalPossibleMarks) * 100 : 0;
        const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
        return { totalTests: completedTests.length, avgPercentage, overallAccuracy, totalQuestions, totalCorrect, totalIncorrect, totalSkipped, totalTestDuration };
    }, [completedTests]);

    if (!summary) return null;

    return (
        <Card>
            <h2 className="font-display text-xl font-bold text-brand-amber-400 p-6 border-b border-white/10">Test Performance Summary</h2>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 flex flex-col items-center justify-center text-center p-4 bg-slate-800/50 rounded-lg">
                    <p className="font-display text-sm text-gray-400">Average Percentage</p>
                    <p className="font-display text-5xl font-bold text-brand-amber-400 my-2">{summary.avgPercentage.toFixed(2)}%</p>
                    <p className="text-xs text-gray-300">Across {summary.totalTests} tests</p>
                </div>
                <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-4">
                     <div className="p-4 bg-slate-800/50 rounded-lg text-center"><p className="font-display text-sm text-gray-400">Overall Accuracy</p><p className="font-display text-3xl font-bold text-green-400 mt-1">{summary.overallAccuracy.toFixed(2)}%</p></div>
                     <div className="p-4 bg-slate-800/50 rounded-lg text-center"><p className="font-display text-sm text-gray-400">Total Questions</p><p className="font-display text-3xl font-bold text-brand-orange-400 mt-1">{summary.totalQuestions}</p></div>
                     <div className="p-4 bg-slate-800/50 rounded-lg text-center"><p className="font-display text-sm text-gray-400">Total Test Time</p><p className="font-display text-3xl font-bold text-yellow-400 mt-1">{formatDuration(summary.totalTestDuration)}</p></div>
                     <div className="p-4 bg-slate-800/50 rounded-lg text-center"><p className="font-display text-sm text-gray-400">Correct</p><p className="font-display text-3xl font-bold text-green-400 mt-1">{summary.totalCorrect}</p></div>
                     <div className="p-4 bg-slate-800/50 rounded-lg text-center"><p className="font-display text-sm text-gray-400">Incorrect</p><p className="font-display text-3xl font-bold text-red-400 mt-1">{summary.totalIncorrect}</p></div>
                     <div className="p-4 bg-slate-800/50 rounded-lg text-center"><p className="font-display text-sm text-gray-400">Skipped</p><p className="font-display text-3xl font-bold text-gray-400 mt-1">{summary.totalSkipped}</p></div>
                </div>
            </div>
        </Card>
    )
};

const TimeAllocationChart: React.FC<{ studyTime: number, breakTime: number }> = ({ studyTime, breakTime }) => {
    const data = [
        { name: 'Study', value: studyTime },
        { name: 'Breaks', value: breakTime },
    ].filter(d => d.value > 0);

    const COLORS = ['#F59E0B', '#06B6D4'];

    if (data.length === 0) {
        return <p className="text-center text-gray-400 py-8">No time logged for this period.</p>;
    }

    return (
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                            return (
                                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="bold">
                                    {`${(percent * 100).toFixed(0)}%`}
                                </text>
                            );
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '0.5rem' }}
                        formatter={(value: number) => formatDuration(value)}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

const BreakdownOfBreaksChart: React.FC<{ breakSessions: BreakSession[] }> = ({ breakSessions }) => {
    const breakData = useMemo(() => {
        if (breakSessions.length === 0) return [];
        const grouped = breakSessions.reduce((acc, session) => {
            const type = session.type === 'Other' && session.customType ? session.customType : session.type;
            if (!acc[type]) {
                acc[type] = 0;
            }
            acc[type] += session.duration;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(grouped).map(([name, time]) => ({ name, time }));
    }, [breakSessions]);

    if (breakData.length === 0) {
        return <p className="text-center text-gray-400 py-8">No breaks logged for this period.</p>;
    }
    
     const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900/80 backdrop-blur-sm p-2 border border-cyan-500/30 rounded-md text-sm">
                    <p className="label text-gray-300">{`${label}`}</p>
                    <p className="intro text-cyan-400">{`Total: ${formatDuration(payload[0].value)}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                        <linearGradient id="breakBarGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#0891b2" stopOpacity={0.4}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis type="number" tickFormatter={(tick) => `${(tick / 3600).toFixed(1)}h`} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(34, 211, 238, 0.1)'}}/>
                    <Bar dataKey="time" fill="url(#breakBarGradient)" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};


const DailyLogCard: React.FC<{
    onSave: (data: Omit<DailyLog, 'date'>) => void;
}> = ({ onSave }) => {
    const [mood, setMood] = useState(3);
    const [energy, setEnergy] = useState(3);
    const [distractions, setDistractions] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    const dailyLog = useLiveQuery(() => db.dailyLogs.get(todayStr), [todayStr]);

    useEffect(() => {
        if (dailyLog) {
            setMood(dailyLog.mood);
            setEnergy(dailyLog.energy);
            setDistractions(dailyLog.distractions);
        }
    }, [dailyLog]);
    
    const moodEmoji = ['😞', '😕', '😐', '🙂', '😄'];
    const energyEmoji = ['🪫', '🔋', '⚡️', '🚀', '🔥'];

    const handleSave = () => {
        onSave({ mood, energy, distractions });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div>
            <h2 className="font-display text-lg font-semibold text-brand-amber-400 mb-4">Daily Log</h2>
            <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium mb-2 font-display">Mood {moodEmoji[mood-1]}</label>
                    <input type="range" min="1" max="5" value={mood} onChange={e => setMood(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer range-lg accent-brand-amber-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-2 font-display">Energy Level {energyEmoji[energy-1]}</label>
                    <input type="range" min="1" max="5" value={energy} onChange={e => setEnergy(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer range-lg accent-brand-amber-500" />
                </div>
                <div>
                     <label className="block text-sm font-medium mb-1 font-display">Distractions / Notes</label>
                    <Input type="text" value={distractions} onChange={e => setDistractions(e.target.value)} placeholder="e.g., Social media, family talk..." />
                </div>
                <Button onClick={handleSave} variant="secondary" className="w-full">
                    {isSaved ? 'Log Saved!' : 'Save Daily Log'}
                </Button>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const tasks = useLiveQuery(() => db.tasks.toArray(), []);
    const testPlans = useLiveQuery(() => db.testPlans.toArray(), []);
    const breakSessions = useLiveQuery(() => db.breakSessions.toArray(), []);
    const [stats, setStats] = useState<ProgressStats | null>(null);

    const [activeTab, setActiveTab] = useState<SubjectName>('Physics');
    const [historyModalTopic, setHistoryModalTopic] = useState<{ subject: SubjectName; chapter: string; microtopic: string; } | null>(null);
    const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

    const [reportType, setReportType] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Overall'>('Daily');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportWeek, setReportWeek] = useState(getCurrentWeekString());
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));


    useEffect(() => {
        if (tasks) {
            setTimeout(() => {
                const calculatedStats = calculateProgress(tasks);
                setStats(calculatedStats);
            }, 10);
        }
    }, [tasks]);

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    const completedTests = useMemo(() => testPlans?.filter(t => t.status === 'Completed' && t.analysis) || [], [testPlans]);

    const chapterTestFrequency: ChapterFrequency = useMemo(() => {
        if (!testPlans) return {};
        const frequency: ChapterFrequency = {};
        for (const testPlan of testPlans) {
            if (!testPlan.syllabus) continue;
            for (const subjectName of Object.keys(testPlan.syllabus) as SubjectName[]) {
                if (!frequency[subjectName]) frequency[subjectName] = {};
                const chapters = testPlan.syllabus[subjectName] || [];
                for (const chapterName of chapters) {
                    const subjectFreq = frequency[subjectName]!;
                    if (!subjectFreq[chapterName]) subjectFreq[chapterName] = 0;
                    subjectFreq[chapterName] += 1;
                }
            }
        }
        return frequency;
    }, [testPlans]);

    const handleMicrotopicClick = (subject: SubjectName, chapter: string, microtopic: string) => {
        setHistoryModalTopic({ subject, chapter, microtopic });
    };

    const handleSaveLog = async (data: Omit<DailyLog, 'date'>) => {
        await db.dailyLogs.put({ date: todayStr, ...data });
    };
    
    const getStartDate = (period: 'today' | 'week' | 'month' | 'all'): Date | null => {
        const now = new Date();
        if (period === 'all') return null;

        const start = new Date(now);
        start.setHours(0, 0, 0, 0);

        if (period === 'today') {
            return start;
        }
        if (period === 'week') {
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(start.setDate(diff));
        }
        if (period === 'month') {
            return new Date(start.getFullYear(), start.getMonth(), 1);
        }
        return null;
    };
    
    const studyTimeForPeriod = useMemo(() => {
        const startDate = getStartDate(period);
        if (!startDate) return stats?.totalTimeStudied || 0;
        let totalDuration = 0;
        (tasks || []).forEach(task => {
            (task.sessions || []).forEach(session => {
                if (new Date(session.date) >= startDate) {
                    totalDuration += session.duration;
                }
            });
        });
        return totalDuration;
    }, [tasks, period, stats]);

    const filteredBreakSessions = useMemo(() => {
        const startDate = getStartDate(period);
        if (!startDate) return breakSessions || [];
        return (breakSessions || []).filter(session => new Date(session.date) >= startDate);
    }, [breakSessions, period]);

    const totalBreakTimeForPeriod = useMemo(() => filteredBreakSessions.reduce((sum, s) => sum + s.duration, 0), [filteredBreakSessions]);
    
    const openReportModal = () => {
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
        setIsReportModalOpen(true);
    };

    if (tasks === undefined || testPlans === undefined || stats === null || breakSessions === undefined) {
        return (
            <div className="space-y-8">
                 <h1 className="font-display text-4xl font-bold text-brand-amber-400 tracking-wide">Dashboard</h1>
                 <div className="flex items-center justify-center min-h-[50vh] text-gray-300">
                    <p className="font-display text-xl animate-pulse">Loading and analyzing your progress...</p>
                </div>
            </div>
        );
    }

    const activeSubjectStats = stats.subjects[activeTab];

    return (
        <div className="space-y-8">
            <h1 className="font-display text-4xl font-bold text-brand-amber-400 tracking-wide">Dashboard</h1>
            
            <CountdownTimer />
            
            <Card className="p-6">
                <DailyLogCard onSave={handleSaveLog} />
                <div className="border-t border-white/10 mt-6 pt-4">
                     <label className="block text-sm font-medium mb-2 font-display">Generate Report</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                         <Select value={reportType} onChange={e => setReportType(e.target.value as any)}>
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Overall">Overall</option>
                        </Select>
                        <div className="sm:col-span-2 flex gap-2">
                             {reportType === 'Daily' && (
                                <Input 
                                    type="date" 
                                    value={reportDate} 
                                    onChange={e => setReportDate(e.target.value)} 
                                    className="flex-grow"
                                />
                            )}
                            {reportType === 'Weekly' && (
                                <Input 
                                    type="week" 
                                    value={reportWeek}
                                    onChange={e => setReportWeek(e.target.value)}
                                    className="flex-grow"
                                />
                            )}
                            {reportType === 'Monthly' && (
                                <Input 
                                    type="month"
                                    value={reportMonth}
                                    onChange={e => setReportMonth(e.target.value)}
                                    className="flex-grow"
                                />
                            )}
                            <Button onClick={openReportModal} className={cn(reportType === 'Overall' && 'flex-grow')}>Generate</Button>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <OverallProgressSummary stats={stats} />
            </div>

            <TestPerformanceSummary completedTests={completedTests} />

            <Card className="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                    <h2 className="font-display text-lg font-semibold text-brand-amber-400">Time Analysis</h2>
                    <div className="flex items-center bg-black/20 rounded-lg p-1 self-start md:self-center">
                        {(['today', 'week', 'month', 'all'] as const).map(p => (
                            <button key={p} onClick={() => setPeriod(p)} className={cn("px-3 py-1 text-sm rounded-md transition-colors font-display capitalize", period === p ? "bg-brand-amber-400 text-brand-amber-900 font-semibold" : "text-gray-300 hover:bg-white/10")}>
                                {p === 'all' ? 'All Time' : `This ${p}`}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-semibold text-center mb-2">Study vs. Break Allocation</h3>
                        <TimeAllocationChart studyTime={studyTimeForPeriod} breakTime={totalBreakTimeForPeriod} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-center mb-2">Breakdown of Breaks</h3>
                        <BreakdownOfBreaksChart breakSessions={filteredBreakSessions} />
                    </div>
                </div>
            </Card>
            
            <StudyVsBreakTimeAnalytics tasks={tasks} breakSessions={breakSessions} />

            <ActivityTracker tasks={tasks} />
            
            <Card>
                <div className="border-b border-white/10">
                    <div className="flex space-x-1 overflow-x-auto p-2">
                        {subjectTabs.map(tab => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-display font-medium rounded-md transition-colors duration-300",
                                    activeTab === tab.name
                                        ? 'bg-brand-amber-400 text-brand-amber-900 shadow-md'
                                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                )}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.name}
                            </button>
                        ))}
                    </div>
                </div>

                {activeSubjectStats && (
                    <SubjectDetailView
                        key={activeTab}
                        subjectName={activeTab}
                        subjectStats={activeSubjectStats}
                        onMicrotopicClick={handleMicrotopicClick}
                        chapterTestFrequency={chapterTestFrequency}
                        completedTests={completedTests}
                    />
                )}
            </Card>

            <MicrotopicHistoryModal
                isOpen={!!historyModalTopic}
                onClose={() => setHistoryModalTopic(null)}
                tasks={tasks}
                topic={historyModalTopic}
            />
            
            {isReportModalOpen && reportType === 'Daily' && (
                <DailyReport
                    date={new Date(new Date(reportDate).toLocaleString("en-US", { timeZone: "UTC" }))}
                    allTasks={tasks}
                    allTestPlans={testPlans}
                    allBreakSessions={breakSessions}
                    onClose={() => setIsReportModalOpen(false)}
                />
            )}
            {isReportModalOpen && reportType === 'Weekly' && reportWeek && (
                <WeeklyReport
                    week={reportWeek}
                    allTasks={tasks}
                    allTestPlans={testPlans}
                    allBreakSessions={breakSessions}
                    onClose={() => setIsReportModalOpen(false)}
                />
            )}
            {isReportModalOpen && reportType === 'Monthly' && reportMonth && (
                <MonthlyReport
                    month={reportMonth}
                    allTasks={tasks}
                    allTestPlans={testPlans}
                    allBreakSessions={breakSessions}
                    onClose={() => setIsReportModalOpen(false)}
                />
            )}
            {isReportModalOpen && reportType === 'Overall' && (
                <OverallReport
                    allTasks={tasks}
                    allTestPlans={testPlans}
                    allBreakSessions={breakSessions}
                    onClose={() => setIsReportModalOpen(false)}
                />
            )}
        </div>
    );
};

const SubjectStatsCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="p-4 bg-slate-800/50 rounded-lg text-center">
        <p className="font-display text-sm text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="font-display text-2xl font-bold text-brand-amber-400">{value}</p>
    </div>
);
export default Dashboard;
