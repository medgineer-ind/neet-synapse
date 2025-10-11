import React, { useMemo, useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
// Fix: Imported SubjectTestPerformance to resolve type error.
import { Task, ProgressStats, SubjectName, SubjectStats, AnalyzedTopic, TaskType, TestPlan, ChapterStats, MicrotopicStats, SubjectTestPerformance } from '../types';
import { calculateProgress, analyzeTopicsForSubject, formatDuration, calculateStudyTimeStats, calculateOverallScore, getScoreColorClass, getScoreBgClass } from '../lib/utils';
import { cn } from '../lib/utils';
import { ChevronDownIcon, AtomIcon, FlaskConicalIcon, LeafIcon, DnaIcon, BookOpenIcon, RepeatIcon, TargetIcon, CheckCircleIcon, TrophyIcon, ClockIcon, BrainCircuitIcon } from './ui/Icons';
import { Card, Select, Modal } from './ui/StyledComponents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


// Fix: Defined ChapterFrequency type to resolve type errors within the component.
type ChapterFrequency = {
    [key in SubjectName]?: {
        [chapter: string]: number;
    };
};

const MicrotopicHistoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    topic: { subject: SubjectName; chapter: string; microtopic: string; } | null;
}> = ({ isOpen, onClose, tasks, topic }) => {
    const relevantTasks = useMemo(() => {
        if (!topic) return [];
        return tasks
            .filter(task =>
                task.subject === topic.subject &&
                task.chapter === topic.chapter &&
                task.microtopics.includes(topic.microtopic) &&
                task.status === 'Completed'
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [tasks, topic]);

    if (!isOpen || !topic) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`History for: ${topic.microtopic}`} maxWidth="max-w-3xl">
            <div className="max-h-[70vh] overflow-y-auto space-y-3 pr-2">
                {relevantTasks.length > 0 ? (
                    relevantTasks.map(task => {
                        const isTestPrepTask = task.notes?.includes('For upcoming test:');
                        const accuracy = task.totalQuestions && task.correctAnswers !== undefined ? (task.correctAnswers / task.totalQuestions) * 100 : null;
                        const totalDuration = (task.sessions || []).reduce((sum, s) => sum + s.duration, 0);
                        
                        // Fix: Replaced legacy 'Study' TaskType with 'Lecture' and added 'SpacedRevision'.
                        const typeStyles: Record<TaskType, string> = {
                           Lecture: "bg-brand-amber-900/50 text-brand-amber-300 border-brand-amber-700",
                           Revision: "bg-green-900/50 text-green-300 border-green-700",
                           Practice: "bg-brand-orange-900/50 text-brand-orange-400 border-brand-orange-700",
                           SpacedRevision: "bg-cyan-900/50 text-cyan-300 border-cyan-700",
                        };

                        return (
                            <div key={task.id} className={cn(
                                "p-3 rounded-lg border-l-4",
                                isTestPrepTask 
                                    ? "bg-yellow-900/20 border-yellow-500" 
                                    : "bg-slate-800/50 border-brand-amber-700"
                            )}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{task.name}</p>
                                        <p className="text-xs text-gray-400">{new Date(new Date(task.date).toLocaleString("en-US", { timeZone: "UTC" })).toLocaleDateString()}</p>
                                    </div>
                                    <span className={cn("px-2 py-1 text-xs font-medium rounded-full border", typeStyles[task.taskType])}>
                                        {task.taskType}
                                    </span>
                                </div>
                                <div className="mt-2 text-xs grid grid-cols-2 md:grid-cols-3 gap-2 text-gray-300">
                                    {totalDuration > 0 && <div><ClockIcon className="w-3 h-3 inline mr-1"/>Time: <span className="font-bold">{formatDuration(totalDuration)}</span></div>}
                                    {task.difficulty !== undefined && <div>Difficulty: <span className="font-bold">{task.difficulty}/5</span></div>}
                                    {accuracy !== null && <div>Accuracy: <span className="font-bold">{accuracy.toFixed(0)}%</span> ({task.correctAnswers}/{task.totalQuestions})</div>}
                                </div>
                                {(task.sessions || []).length > 0 && (
                                    <details className="mt-2 text-xs">
                                        <summary className="cursor-pointer text-gray-400 hover:text-white font-display">View Sessions ({task.sessions.length})</summary>
                                        <ul className="mt-1 p-2 bg-black/30 rounded space-y-1">
                                            {task.sessions.map((session, index) => (
                                                <li key={index} className="flex justify-between">
                                                    <span>Session {index + 1} ({new Date(session.date).toLocaleDateString()})</span>
                                                    <strong>{formatDuration(session.duration)}</strong>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                )}
                                {task.notes && (
                                    <details className="mt-2 text-xs">
                                        <summary className="cursor-pointer text-gray-400 hover:text-white font-display">View Notes</summary>
                                        <p className="mt-1 p-2 bg-black/30 rounded whitespace-pre-wrap font-mono text-gray-400">{task.notes}</p>
                                    </details>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <p className="text-center text-gray-400 py-8">No completed task history found for this microtopic.</p>
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

    // Fix: Replaced legacy 'Study' TaskType with 'Lecture' and added 'SpacedRevision'.
    const iconMap: Record<TaskType, React.ReactElement> = {
        Lecture: <BookOpenIcon className="w-5 h-5 text-brand-amber-400" />,
        Revision: <RepeatIcon className="w-5 h-5 text-green-400" />,
        Practice: <TargetIcon className="w-5 h-5 text-brand-orange-400" />,
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

const StudyTimeAnalytics: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    type Period = 'Daily' | 'Weekly' | 'Monthly';
    const [activePeriod, setActivePeriod] = useState<Period>('Daily');

    const studyTimeStats = useMemo(() => calculateStudyTimeStats(tasks), [tasks]);

    const chartData = useMemo(() => {
        let data;
        if (activePeriod === 'Daily') {
            data = studyTimeStats.daily.slice(-30);
            return data.map(d => ({
                name: new Date(new Date(d.date).toLocaleString("en-US", { timeZone: "UTC" })).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                'Study Time': d.totalTime
            }));
        }
        if (activePeriod === 'Weekly') {
            data = studyTimeStats.weekly.slice(-12);
            return data.map(d => ({
                name: `W/o ${new Date(new Date(d.week).toLocaleString("en-US", { timeZone: "UTC" })).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                'Study Time': d.totalTime
            }));
        }
        if (activePeriod === 'Monthly') {
            data = studyTimeStats.monthly.slice(-12);
            return data.map(d => ({
                name: new Date(new Date(d.month).toLocaleString("en-US", { timeZone: "UTC" })).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
                'Study Time': d.totalTime
            }));
        }
        return [];
    }, [activePeriod, studyTimeStats]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900/80 backdrop-blur-sm p-2 border border-brand-amber-500/30 rounded-md text-sm">
                    <p className="label text-gray-300">{`${label}`}</p>
                    <p className="intro text-brand-amber-400">{`Total: ${formatDuration(payload[0].value)}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                <h3 className="font-display text-lg font-semibold text-brand-amber-400">Study Time Analytics</h3>
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
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <YAxis tickFormatter={(tick) => `${(tick / 3600).toFixed(1)}h`} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(251, 191, 36, 0.1)'}}/>
                            <Bar dataKey="Study Time" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>Log some study time to see your analytics.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};


const SubjectStatsCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="p-4 bg-slate-800/50 rounded-lg text-center">
        <p className="font-display text-sm text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="font-display text-2xl font-bold text-brand-amber-400">{value}</p>
    </div>
);

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
                        {/* Fix: Cast `value` to number to resolve TypeScript error. */}
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
}


const Dashboard: React.FC = () => {
    const [tasks] = useLocalStorage<Task[]>('tasks', []);
    const [testPlans] = useLocalStorage<TestPlan[]>('testPlans', []);
    const stats = useMemo(() => calculateProgress(tasks), [tasks]);
    const [activeTab, setActiveTab] = useState<SubjectName>('Physics');
    const [historyModalTopic, setHistoryModalTopic] = useState<{ subject: SubjectName; chapter: string; microtopic: string; } | null>(null);

    const completedTests = useMemo(() => testPlans.filter(t => t.status === 'Completed' && t.analysis), [testPlans]);

    const chapterTestFrequency: ChapterFrequency = useMemo(() => {
        const frequency: ChapterFrequency = {};
        for (const testPlan of testPlans) {
            if (!testPlan.syllabus) continue;
            for (const subjectName of Object.keys(testPlan.syllabus) as SubjectName[]) {
                if (!frequency[subjectName]) frequency[subjectName] = {};
                const chapters = testPlan.syllabus[subjectName] || [];
                for (const chapterName of chapters) {
                    const subjectFreq = frequency[subjectName]!;
                    if (!subjectFreq[chapterName]) subjectFreq[chapterName] = 0;
                    // Fix: Changed `++` to `+= 1` to avoid potential TypeScript type inference issues.
                    subjectFreq[chapterName] = subjectFreq[chapterName] + 1;
                }
            }
        }
        return frequency;
    }, [testPlans]);

    const activeSubjectStats = stats.subjects[activeTab];

    const handleMicrotopicClick = (subject: SubjectName, chapter: string, microtopic: string) => {
        setHistoryModalTopic({ subject, chapter, microtopic });
    };

    return (
        <div className="space-y-8">
            <h1 className="font-display text-4xl font-bold text-brand-amber-400 tracking-wide">Dashboard</h1>
            
            <CountdownTimer />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <OverallProgressSummary stats={stats} />
            </div>

            <TestPerformanceSummary completedTests={completedTests} />

            <ActivityTracker tasks={tasks} />
            
            <StudyTimeAnalytics tasks={tasks} />
            
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
        </div>
    );
};

export default Dashboard;