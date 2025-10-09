import React, { useMemo, useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Task, ProgressStats, SubjectName, SubjectStats, AnalyzedTopic, TaskType, TestPlan, ChapterStats, MicrotopicStats } from '../types';
import { calculateProgress, analyzeTopicsForSubject, formatDuration, calculateStudyTimeStats, calculateOverallScore, getScoreColorClass, getScoreBgClass } from '../lib/utils';
import { cn } from '../lib/utils';
import { ChevronDownIcon, AtomIcon, FlaskConicalIcon, LeafIcon, DnaIcon, BookOpenIcon, RepeatIcon, TargetIcon, CheckCircleIcon, TrophyIcon, ClockIcon } from './ui/Icons';
import { Card, Select, Modal } from './ui/StyledComponents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


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
                        const isTestPrepTask = task.notes?.includes('Auto-generated from test preparation');
                        const accuracy = task.totalQuestions && task.correctAnswers !== undefined ? (task.correctAnswers / task.totalQuestions) * 100 : null;
                        const totalDuration = (task.sessions || []).reduce((sum, s) => sum + s.duration, 0);
                        
                        const typeStyles: Record<TaskType, string> = {
                           Study: "bg-brand-cyan-500/20 text-brand-cyan-400",
                           Revision: "bg-green-500/20 text-green-400",
                           Practice: "bg-purple-500/20 text-purple-400",
                        };

                        return (
                            <div key={task.id} className={cn(
                                "p-3 rounded-lg border-l-4",
                                isTestPrepTask 
                                    ? "bg-yellow-500/10 border-yellow-500" 
                                    : "bg-slate-900/50 border-brand-cyan-700"
                            )}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{task.name}</p>
                                        <p className="text-xs text-gray-400">{new Date(new Date(task.date).toLocaleString("en-US", { timeZone: "UTC" })).toLocaleDateString()}</p>
                                    </div>
                                    <span className={cn("px-2 py-1 text-xs font-medium rounded-full", typeStyles[task.taskType])}>
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
                                        <summary className="cursor-pointer text-gray-400 hover:text-white">View Sessions ({task.sessions.length})</summary>
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
                                        <summary className="cursor-pointer text-gray-400 hover:text-white">View Notes</summary>
                                        <p className="mt-1 p-2 bg-black/30 rounded whitespace-pre-wrap">{task.notes}</p>
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
                        className="text-slate-900/50"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="60"
                        cy="60"
                    />
                    <circle
                        className="text-brand-cyan-500"
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
                    <span className="text-4xl font-bold text-brand-cyan-400">{percentage.toFixed(1)}%</span>
                    <span className="text-sm text-gray-400">Completed</span>
                </div>
            </div>
            <div className="flex flex-col gap-6 text-center md:text-left">
                 <div>
                    <h3 className="text-gray-400 text-sm font-medium">Total Time Studied</h3>
                    <p className="text-3xl font-bold text-brand-cyan-300 mt-1">{formatDuration(stats.totalTimeStudied)}</p>
                    <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 text-xs text-gray-400 border-t border-white/10 pt-4">
                        <div className="flex items-center gap-1.5" title="Study Time">
                            <BookOpenIcon className="w-4 h-4 text-brand-cyan-400" />
                            <span><strong className="text-gray-200">{formatDuration(stats.timeByCategory.Study)}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Revision Time">
                            <RepeatIcon className="w-4 h-4 text-green-400" />
                            <span><strong className="text-gray-200">{formatDuration(stats.timeByCategory.Revision)}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Practice Time">
                            <TargetIcon className="w-4 h-4 text-purple-400" />
                            <span><strong className="text-gray-200">{formatDuration(stats.timeByCategory.Practice)}</strong></span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
                    <div>
                        <h3 className="text-gray-400 text-sm font-medium">Completed Tasks</h3>
                        <p className="text-3xl font-bold text-green-400 mt-1">{stats.completedTasks}</p>
                    </div>
                    <div>
                        <h3 className="text-gray-400 text-sm font-medium">Pending Tasks</h3>
                        <p className="text-3xl font-bold text-yellow-400 mt-1">{(stats.totalTasks - stats.completedTasks)}</p>
                    </div>
                     <div>
                        <h3 className="text-gray-400 text-sm font-medium">Questions Practiced</h3>
                        <p className="text-3xl font-bold text-purple-400 mt-1">{stats.totalQuestions}</p>
                         {stats.totalQuestions > 0 && (
                            <p className="text-xs text-gray-300">
                                {stats.totalCorrect} correct ({((stats.totalCorrect / stats.totalQuestions) * 100).toFixed(1)}%)
                            </p>
                        )}
                    </div>
                     <div>
                        <h3 className="text-gray-400 text-sm font-medium">Incorrect Questions</h3>
                        <p className="text-3xl font-bold text-red-400 mt-1">{stats.totalIncorrect}</p>
                        {stats.totalQuestions > 0 && stats.totalIncorrect > 0 && (
                            <p className="text-xs text-gray-300">
                                {((stats.totalIncorrect / stats.totalQuestions) * 100).toFixed(1)}% of practiced
                            </p>
                        )}
                    </div>
                    <div>
                        <h3 className="text-gray-400 text-sm font-medium">Skipped Questions</h3>
                        <p className="text-3xl font-bold text-gray-400 mt-1">{stats.totalSkipped}</p>
                        {stats.totalQuestions > 0 && stats.totalSkipped > 0 && (
                            <p className="text-xs text-gray-300">
                                {((stats.totalSkipped / stats.totalQuestions) * 100).toFixed(1)}% of practiced
                            </p>
                        )}
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
        Study: <BookOpenIcon className="w-5 h-5 text-brand-cyan-400" />,
        Revision: <RepeatIcon className="w-5 h-5 text-green-400" />,
        Practice: <TargetIcon className="w-5 h-5 text-purple-400" />,
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-brand-cyan-400">Activity Tracker</h3>
                <div className="flex items-center bg-black/20 rounded-lg p-1">
                    {(['Today', 'This Week', 'This Month'] as Period[]).map(period => (
                        <button key={period} onClick={() => setActivePeriod(period)} className={cn("px-3 py-1 text-sm rounded-md transition-colors", activePeriod === period ? "bg-brand-cyan-600 text-brand-blue-900 font-semibold" : "text-gray-300 hover:bg-white/10")}>
                            {period}
                        </button>
                    ))}
                </div>
            </div>
            
            {total > 0 ? (
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{completed} / {total} tasks completed</span>
                        <span className="font-semibold text-brand-cyan-400">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-2.5 mb-4">
                        <div className="bg-brand-cyan-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                        {filteredTasks.filter(t => t.status === 'Completed').map(task => (
                             <div key={task.id} className="flex items-center justify-between p-2 bg-black/20 rounded-md text-sm">
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
                name: `Week of ${new Date(new Date(d.week).toLocaleString("en-US", { timeZone: "UTC" })).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
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
                <div className="bg-slate-800/80 backdrop-blur-sm p-2 border border-brand-cyan-500/30 rounded-md text-sm">
                    <p className="label text-gray-300">{`${label}`}</p>
                    <p className="intro text-brand-cyan-400">{`Total: ${formatDuration(payload[0].value)}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card>
            <div className="flex flex-col md:flex-row justify-between md:items-center p-4 border-b border-white/10 gap-4">
                <h3 className="text-lg font-semibold text-brand-cyan-400">Study Time Analytics</h3>
                <div className="flex items-center bg-black/20 rounded-lg p-1 self-start md:self-center">
                    {(['Daily', 'Weekly', 'Monthly'] as Period[]).map(period => (
                        <button key={period} onClick={() => setActivePeriod(period)} className={cn("px-3 py-1 text-sm rounded-md transition-colors", activePeriod === period ? "bg-brand-cyan-600 text-brand-blue-900 font-semibold" : "text-gray-300 hover:bg-white/10")}>
                            {period}
                        </button>
                    ))}
                </div>
            </div>
            <div className="p-4 h-80">
                {chartData.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <YAxis tickFormatter={(tick) => `${(tick / 3600).toFixed(1)}h`} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0, 239, 255, 0.1)'}}/>
                            <Bar dataKey="Study Time" fill="rgba(0, 239, 255, 0.7)" radius={[4, 4, 0, 0]} />
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
    <div className="p-4 bg-slate-900/50 rounded-lg text-center">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-brand-cyan-400">{value}</p>
    </div>
);

const SubjectTopicAnalysis: React.FC<{ weakTopics: AnalyzedTopic[]; averageTopics: AnalyzedTopic[]; strongTopics: AnalyzedTopic[] }> = ({ weakTopics, averageTopics, strongTopics }) => (
    <Card>
         <h3 className="text-lg font-semibold text-brand-cyan-400 mb-4">AI-Powered Topic Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <h4 className="font-semibold text-red-400 mb-2">Weak Topics (Focus Here)</h4>
                {weakTopics.length > 0 ? (
                    <ul className="text-sm space-y-2 max-h-60 overflow-y-auto pr-2">
                        {weakTopics.map(t => <li key={t.microtopic + t.chapter} className="p-2 bg-red-500/10 rounded-md"><strong>{t.microtopic}</strong> <br /> <span className="text-xs text-gray-400">{t.chapter}</span> <br /> <span className="text-red-300 text-xs">Score: {t.overallScore.toFixed(0)}/100</span></li>)}
                    </ul>
                ) : <p className="text-sm text-gray-400 italic">No specific weak topics found.</p>}
            </div>
            <div>
                <h4 className="font-semibold text-yellow-400 mb-2">Average Topics</h4>
                {averageTopics.length > 0 ? (
                    <ul className="text-sm space-y-2 max-h-60 overflow-y-auto pr-2">
                        {averageTopics.map(t => <li key={t.microtopic + t.chapter} className="p-2 bg-yellow-500/10 rounded-md"><strong>{t.microtopic}</strong> <br /> <span className="text-xs text-gray-400">{t.chapter}</span> <br /> <span className="text-yellow-300 text-xs">Score: {t.overallScore.toFixed(0)}/100</span></li>)}
                    </ul>
                ) : <p className="text-sm text-gray-400 italic">No topics with average performance found.</p>}
            </div>
            <div>
                <h4 className="font-semibold text-green-400 mb-2">Strong Topics</h4>
                {strongTopics.length > 0 ? (
                    <ul className="text-sm space-y-2 max-h-60 overflow-y-auto pr-2">
                        {strongTopics.map(t => <li key={t.microtopic + t.chapter} className="p-2 bg-green-500/10 rounded-md"><strong>{t.microtopic}</strong> <br /> <span className="text-xs text-gray-400">{t.chapter}</span> <br /> <span className="text-green-300 text-xs">Score: {t.overallScore.toFixed(0)}/100</span></li>)}
                    </ul>
                ) : <p className="text-sm text-gray-400 italic">Complete more tasks to identify your strong topics.</p>}
            </div>
        </div>
    </Card>
);

type ChapterFrequency = {
  [key in SubjectName]?: {
    [chapter: string]: number;
  };
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
        <Card>
            <h3 className="text-lg font-semibold text-brand-cyan-400 mb-4">Detailed Topic Performance</h3>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-brand-blue-900/80 backdrop-blur-sm z-10">
                        <tr className="border-b border-white/20 text-xs uppercase text-gray-400">
                            <th className="p-3">Topic</th>
                            <th className="p-3 text-center">Time Spent</th>
                            <th className="p-3 text-center" title="Number of times chapter is included in test plans">In Tests</th>
                            <th className="p-3 text-center">Tasks</th>
                            <th className="p-3 text-center">Avg. Diff</th>
                            <th className="p-3 text-center">Questions Practiced</th>
                            <th className="p-3 text-center">Accuracy %</th>
                            <th className="p-3 text-center">Incorrect</th>
                            <th className="p-3 text-center">Skipped</th>
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
                                    <tr className={cn("border-b border-white/10 bg-slate-900/30 cursor-pointer", chapterAvgScore > 0 && getScoreBgClass(chapterAvgScore))} onClick={() => toggleExpand(chapterName)}>
                                        <td className="p-3 font-semibold flex items-center gap-2">
                                            <ChevronDownIcon className={cn("w-4 h-4 transition-transform", expanded[chapterName] ? 'rotate-180' : '')}/>
                                            {chapterName}
                                        </td>
                                        <td className="p-3 text-center font-mono">{formatDuration(chapterData.totalTime)}</td>
                                        <td className="p-3 text-center font-semibold">{chapterTestFrequency[subjectName]?.[chapterName] || 0}</td>
                                        <td className="p-3 text-center">{chapterData.completed} / {chapterData.total}</td>
                                        <td className="p-3 text-center">{chapterData.avgDifficulty > 0 ? chapterData.avgDifficulty.toFixed(2) : 'N/A'}</td>
                                        <td className="p-3 text-center">{chapterData.totalQuestions > 0 ? `${chapterData.totalCorrect}/${chapterData.totalQuestions}` : 'N/A'}</td>
                                        <td className="p-3 text-center">{chapterData.totalQuestions > 0 ? `${((chapterData.totalCorrect / chapterData.totalQuestions) * 100).toFixed(1)}%` : 'N/A'}</td>
                                        <td className="p-3 text-center">{chapterData.totalIncorrect > 0 ? chapterData.totalIncorrect : 'N/A'}</td>
                                        <td className="p-3 text-center">{chapterData.totalSkipped > 0 ? chapterData.totalSkipped : 'N/A'}</td>
                                    </tr>
                                    {expanded[chapterName] && (Object.entries(chapterData.microtopics) as [string, MicrotopicStats][]).filter(([,data]) => hasData(data)).map(([microtopicName, microtopicData]) => {
                                        const microtopicScore = calculateOverallScore(microtopicData.avgDifficulty, microtopicData.avgAccuracy);
                                        return (
                                            <tr key={microtopicName} className="bg-black/20 text-gray-400 cursor-pointer transition-colors hover:bg-black/40" onClick={(e) => { e.stopPropagation(); onMicrotopicClick(subjectName, chapterName, microtopicName)}}>
                                                <td className={cn("py-2 px-3 pl-12 text-xs", microtopicScore > 0 && getScoreColorClass(microtopicScore))}>{microtopicName}</td>
                                                <td className="py-2 px-3 text-center text-xs font-mono">{formatDuration(microtopicData.totalTime)}</td>
                                                <td></td>
                                                <td className="py-2 px-3 text-center">{microtopicData.completed} / {microtopicData.total}</td>
                                                <td className="py-2 px-3 text-center">{microtopicData.avgDifficulty > 0 ? microtopicData.avgDifficulty.toFixed(2) : 'N/A'}</td>
                                                <td className="py-2 px-3 text-center text-xs">{microtopicData.totalQuestions > 0 ? `${Math.round(microtopicData.totalCorrect)}/${Math.round(microtopicData.totalQuestions)}` : 'N/A'}</td>
                                                <td className="py-2 px-3 text-center text-xs">{microtopicData.totalQuestions > 0 ? `${((microtopicData.totalCorrect / microtopicData.totalQuestions) * 100).toFixed(1)}%` : 'N/A'}</td>
                                                <td className="py-2 px-3 text-center text-xs">{microtopicData.totalIncorrect > 0 ? Math.round(microtopicData.totalIncorrect) : 'N/A'}</td>
                                                <td className="py-2 px-3 text-center text-xs">{microtopicData.totalSkipped > 0 ? Math.round(microtopicData.totalSkipped) : 'N/A'}</td>
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
    const [chapterFilter, setChapterFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState('score-asc'); // 'score-asc' for weakest first, 'score-desc' for strongest first

    const subjectTestSummary = useMemo(() => {
        let totalScore = 0;
        let totalMaxMarks = 0;
        let totalCorrect = 0;
        let totalQuestions = 0;
        let totalIncorrect = 0;
        let totalSkipped = 0;
        let testCount = 0;

        completedTests.forEach(test => {
            const performance = test.analysis?.subjectWisePerformance?.[subjectName];
            if (performance) {
                testCount++;
                totalScore += performance.score;
                totalMaxMarks += performance.totalQuestions * 4;
                totalCorrect += performance.correct;
                totalQuestions += performance.totalQuestions;
                totalIncorrect += performance.incorrect;
                totalSkipped += performance.skipped;
            }
        });

        if (testCount === 0) return null;

        return {
            avgScore: totalScore / testCount,
            avgMaxMarks: totalMaxMarks / testCount,
            avgPercentage: totalMaxMarks > 0 ? (totalScore / totalMaxMarks) * 100 : 0,
            avgAccuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
            testCount: testCount,
            totalCorrect,
            totalIncorrect,
            totalSkipped,
            totalQuestions,
        };
    }, [completedTests, subjectName]);

    const { weakTopics, averageTopics, strongTopics } = useMemo(() => {
        const analysis = analyzeTopicsForSubject(subjectStats, subjectName);
        let allAnalyzedTopics = [...analysis.weakTopics, ...analysis.averageTopics, ...analysis.strongTopics];

        // Filter by chapter
        if (chapterFilter !== 'All') {
            allAnalyzedTopics = allAnalyzedTopics.filter(topic => topic.chapter === chapterFilter);
        }

        // Sort by score
        if (sortOrder === 'score-asc') {
            allAnalyzedTopics.sort((a, b) => a.overallScore - b.overallScore);
        } else { // 'score-desc'
            allAnalyzedTopics.sort((a, b) => b.overallScore - a.overallScore);
        }

        // Re-categorize after filtering and sorting
        const weak = allAnalyzedTopics.filter(t => t.overallScore <= 40);
        const average = allAnalyzedTopics.filter(t => t.overallScore > 40 && t.overallScore <= 79);
        const strong = allAnalyzedTopics.filter(t => t.overallScore >= 80);

        return { weakTopics: weak, averageTopics: average, strongTopics: strong };

    }, [subjectStats, subjectName, chapterFilter, sortOrder]);


    return (
        <div className="animate-fadeIn space-y-8 mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SubjectStatsCard title="Completion" value={`${subjectStats.completionRate.toFixed(1)}%`} />
                <SubjectStatsCard title="Completed Tasks" value={`${subjectStats.completed} / ${subjectStats.total}`} />
                <SubjectStatsCard title="Avg. Difficulty" value={subjectStats.avgDifficulty > 0 ? subjectStats.avgDifficulty.toFixed(2) : 'N/A'} />
                <SubjectStatsCard title="Avg. Accuracy" value={subjectStats.avgAccuracy !== null ? `${subjectStats.avgAccuracy.toFixed(1)}%` : 'N/A'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 flex flex-col">
                    <div className="flex-grow">
                        <h3 className="text-gray-400 text-sm font-medium text-center mb-2">Time Spent on {subjectName}</h3>
                        <p className="text-3xl font-bold text-brand-cyan-300 mt-1 text-center">{formatDuration(subjectStats.totalTime)}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-400 border-t border-white/10 pt-4">
                        <div className="flex items-center gap-1.5" title="Study Time">
                            <BookOpenIcon className="w-4 h-4 text-brand-cyan-400" />
                            <span>Study: <strong className="text-gray-200">{formatDuration(subjectStats.timeByCategory.Study)}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Revision Time">
                            <RepeatIcon className="w-4 h-4 text-green-400" />
                            <span>Revision: <strong className="text-gray-200">{formatDuration(subjectStats.timeByCategory.Revision)}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Practice Time">
                            <TargetIcon className="w-4 h-4 text-purple-400" />
                            <span>Practice: <strong className="text-gray-200">{formatDuration(subjectStats.timeByCategory.Practice)}</strong></span>
                        </div>
                    </div>
                </Card>
                
                <Card className="p-6 flex flex-col justify-center">
                    <h3 className="text-gray-400 text-sm font-medium text-center mb-2 flex items-center justify-center gap-2">
                        <TrophyIcon className="w-4 h-4" /> Test Performance
                    </h3>
                    {subjectTestSummary ? (
                        <>
                            <p className="text-3xl font-bold text-yellow-300 mt-1 text-center">{subjectTestSummary.avgPercentage.toFixed(1)}%</p>
                            <div className="text-sm text-gray-300 text-center mt-2 space-y-1">
                                <p>Avg. Score: {subjectTestSummary.avgScore.toFixed(1)} / {subjectTestSummary.avgMaxMarks.toFixed(1)}</p>
                                <p>Avg. Accuracy: <span className="text-green-400">{subjectTestSummary.avgAccuracy.toFixed(1)}%</span></p>
                                
                                <div className="border-t border-white/10 mt-3 pt-3 space-y-1">
                                    <div className="flex justify-between text-xs"><span>Total Correct:</span> <span className="font-bold text-green-400">{subjectTestSummary.totalCorrect}</span></div>
                                    <div className="flex justify-between text-xs"><span>Total Incorrect:</span> <span className="font-bold text-red-400">{subjectTestSummary.totalIncorrect}</span></div>
                                    <div className="flex justify-between text-xs"><span>Total Skipped:</span> <span className="font-bold text-gray-400">{subjectTestSummary.totalSkipped}</span></div>
                                    <div className="flex justify-between text-xs"><span>Total Questions:</span> <span className="font-bold text-white">{subjectTestSummary.totalQuestions}</span></div>
                                </div>

                                <p className="text-xs text-gray-500 pt-2">Across {subjectTestSummary.testCount} tests</p>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center text-center text-gray-500 mt-4">
                            <p className="text-xs">No test data available for {subjectName}.</p>
                        </div>
                    )}
                </Card>

                <Card className="p-6 flex flex-col justify-center">
                    <h3 className="text-gray-400 text-sm font-medium text-center mb-2">Question Practice Stats for {subjectName}</h3>
                    <p className="text-3xl font-bold text-purple-300 mt-1 text-center">{subjectStats.totalQuestions} Questions</p>
                    {subjectStats.totalQuestions > 0 &&
                        <div className="text-sm text-gray-300 text-center mt-2 space-y-1">
                            <p className="text-green-400">{subjectStats.totalCorrect} correct ({((subjectStats.totalCorrect / subjectStats.totalQuestions) * 100).toFixed(1)}% accuracy)</p>
                            <p className="text-red-400">{subjectStats.totalIncorrect} incorrect</p>
                            <p className="text-gray-400">{subjectStats.totalSkipped} skipped</p>
                        </div>
                    }
                </Card>
            </div>

            <Card>
                <h3 className="text-lg font-semibold text-brand-cyan-400 mb-4">Analysis Filters</h3>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label htmlFor={`chapter-filter-${subjectName}`} className="block text-sm font-medium mb-1">Filter by Chapter</label>
                        <Select id={`chapter-filter-${subjectName}`} value={chapterFilter} onChange={e => setChapterFilter(e.target.value)}>
                            <option value="All">All Chapters</option>
                            {Object.keys(subjectStats.chapters).map(chapter => (
                                <option key={chapter} value={chapter}>{chapter}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex-1">
                        <label htmlFor={`sort-order-${subjectName}`} className="block text-sm font-medium mb-1">Sort by Score</label>
                        <Select id={`sort-order-${subjectName}`} value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                            <option value="score-asc">Weakest First</option>
                            <option value="score-desc">Strongest First</option>
                        </Select>
                    </div>
                </div>
            </Card>

            <SubjectTopicAnalysis weakTopics={weakTopics} averageTopics={averageTopics} strongTopics={strongTopics} />
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
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();

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
    
    const padWithZero = (num: number) => num.toString().padStart(2, '0');

    return (
        <Card className="flex flex-col items-center justify-center p-6 text-center">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-brand-cyan-400 mb-4">
                <TrophyIcon className="w-6 h-6" />
                Countdown to NEET 2026
            </h2>
            <div className="flex space-x-4 md:space-x-8">
                <div className="flex flex-col items-center w-20">
                    <span className="text-4xl md:text-5xl font-bold tracking-tighter">{timeLeft.days}</span>
                    <span className="text-xs text-gray-400 uppercase">Days</span>
                </div>
                <div className="flex flex-col items-center w-20">
                    <span className="text-4xl md:text-5xl font-bold tracking-tighter">{padWithZero(timeLeft.hours)}</span>
                    <span className="text-xs text-gray-400 uppercase">Hours</span>
                </div>
                <div className="flex flex-col items-center w-20">
                    <span className="text-4xl md:text-5xl font-bold tracking-tighter">{padWithZero(timeLeft.minutes)}</span>
                    <span className="text-xs text-gray-400 uppercase">Minutes</span>
                </div>
                <div className="flex flex-col items-center w-20">
                    <span className="text-4xl md:text-5xl font-bold tracking-tighter text-brand-cyan-500">{padWithZero(timeLeft.seconds)}</span>
                    <span className="text-xs text-gray-400 uppercase">Seconds</span>
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Target: 3rd May 2026, 2:00 PM</p>
        </Card>
    );
};

const TestPerformanceSummary: React.FC<{ completedTests: TestPlan[] }> = ({ completedTests }) => {
    const summary = useMemo(() => {
        if (completedTests.length === 0) return null;

        let totalMarksObtained = 0;
        let totalPossibleMarks = 0;
        let totalQuestions = 0;
        let totalCorrect = 0;
        let totalIncorrect = 0;
        let totalSkipped = 0;
        let totalTestDuration = 0;

        const subjectScores: { [key in SubjectName]?: { totalScore: number; count: number } } = {};

        completedTests.forEach(test => {
            if (test.analysis) {
                totalMarksObtained += test.analysis.marksObtained || 0;
                totalPossibleMarks += test.analysis.totalMarks || 0;
                totalTestDuration += test.analysis.testDuration || 0;

                if (test.analysis.subjectWisePerformance) {
                    (Object.keys(test.analysis.subjectWisePerformance) as SubjectName[]).forEach(subject => {
                        const data = test.analysis.subjectWisePerformance![subject]!;
                        if (!subjectScores[subject]) {
                            subjectScores[subject] = { totalScore: 0, count: 0 };
                        }
                        subjectScores[subject]!.totalScore += data.score;
                        subjectScores[subject]!.count++;
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

        const avgSubjectScores = (Object.keys(subjectScores) as SubjectName[]).reduce((acc, subject) => {
            const data = subjectScores[subject]!;
            acc[subject] = data.count > 0 ? data.totalScore / data.count : 0;
            return acc;
        }, {} as { [key in SubjectName]?: number });
        
        return {
            totalTests: completedTests.length,
            avgPercentage,
            overallAccuracy,
            avgSubjectScores,
            totalQuestions,
            totalCorrect,
            totalIncorrect,
            totalSkipped,
            totalTestDuration
        };
    }, [completedTests]);

    if (!summary) return null;

    return (
        <Card>
            <h2 className="text-xl font-bold text-brand-cyan-400 p-4 border-b border-white/10">Test Performance Summary</h2>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 flex flex-col items-center justify-center text-center p-4 bg-black/20 rounded-lg">
                    <p className="text-sm text-gray-400">Average Percentage</p>
                    <p className="text-5xl font-bold text-brand-cyan-400 my-2">{summary.avgPercentage.toFixed(2)}%</p>
                    <p className="text-xs text-gray-300">Across {summary.totalTests} tests</p>
                </div>
                <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-black/20 rounded-lg text-center">
                        <p className="text-sm text-gray-400">Overall Accuracy</p>
                        <p className="text-3xl font-bold text-green-400 mt-1">{summary.overallAccuracy.toFixed(2)}%</p>
                    </div>
                    <div className="p-4 bg-black/20 rounded-lg text-center">
                        <p className="text-sm text-gray-400">Total Questions</p>
                        <p className="text-3xl font-bold text-purple-400 mt-1">{summary.totalQuestions}</p>
                    </div>
                     <div className="p-4 bg-black/20 rounded-lg text-center">
                        <p className="text-sm text-gray-400">Total Test Time</p>
                        <p className="text-3xl font-bold text-yellow-400 mt-1">{formatDuration(summary.totalTestDuration)}</p>
                    </div>
                     <div className="p-4 bg-black/20 rounded-lg text-center">
                        <p className="text-sm text-gray-400">Correct</p>
                        <p className="text-3xl font-bold text-green-400 mt-1">{summary.totalCorrect}</p>
                    </div>
                     <div className="p-4 bg-black/20 rounded-lg text-center">
                        <p className="text-sm text-gray-400">Incorrect</p>
                        <p className="text-3xl font-bold text-red-400 mt-1">{summary.totalIncorrect}</p>
                    </div>
                     <div className="p-4 bg-black/20 rounded-lg text-center">
                        <p className="text-sm text-gray-400">Skipped</p>
                        <p className="text-3xl font-bold text-gray-400 mt-1">{summary.totalSkipped}</p>
                    </div>
                     {Object.entries(summary.avgSubjectScores).map(([subject, score]) => (
                         <div key={subject} className="p-4 bg-black/20 rounded-lg text-center">
                            <p className="text-sm text-gray-400">Avg. {subject} Score</p>
                            {/* FIX: Use `typeof score === 'number'` as a type guard because `Object.entries` can result in an `unknown` type for the value, which does not have a `toFixed` method. */}
                            <p className="text-3xl font-bold text-purple-400 mt-1">{typeof score === 'number' ? score.toFixed(1) : 'N/A'}</p>
                        </div>
                     ))}
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
                if (!frequency[subjectName]) {
                    frequency[subjectName] = {};
                }
                const chapters = testPlan.syllabus[subjectName] || [];
                for (const chapterName of chapters) {
                    const subjectFreq = frequency[subjectName]!;
                    if (!subjectFreq[chapterName]) {
                        subjectFreq[chapterName] = 0;
                    }
                    subjectFreq[chapterName]++;
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
            <h1 className="text-3xl font-bold text-brand-cyan-400">Dashboard</h1>
            
            <CountdownTimer />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <OverallProgressSummary stats={stats} />
            </div>

            <TestPerformanceSummary completedTests={completedTests} />

            <ActivityTracker tasks={tasks} />
            
            <StudyTimeAnalytics tasks={tasks} />
            
            <div>
                <div className="border-b border-white/20">
                    <div className="flex space-x-1 overflow-x-auto">
                        {subjectTabs.map(tab => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={cn(
                                    "flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-300",
                                    activeTab === tab.name
                                        ? 'bg-slate-900/50 text-brand-cyan-400 border-b-2 border-brand-cyan-400'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
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
                        key={activeTab} // Add key to force re-mount and reset state on tab change
                        subjectName={activeTab}
                        subjectStats={activeSubjectStats}
                        onMicrotopicClick={handleMicrotopicClick}
                        chapterTestFrequency={chapterTestFrequency}
                        completedTests={completedTests}
                    />
                )}
            </div>

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