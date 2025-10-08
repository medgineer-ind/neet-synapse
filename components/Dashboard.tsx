

import React, { useMemo, useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
// FIX: Import ChapterStats and MicrotopicStats to use them for type casting.
import { Task, ProgressStats, SubjectName, SubjectStats, AnalyzedTopic, TaskType, TestPlan, ChapterStats, MicrotopicStats } from '../types';
import { calculateProgress, analyzeTopicsForSubject } from '../lib/utils';
import { cn } from '../lib/utils';
import { ChevronDownIcon, AtomIcon, FlaskConicalIcon, LeafIcon, DnaIcon, BookOpenIcon, RepeatIcon, TargetIcon, CheckCircleIcon, TrophyIcon } from './ui/Icons';
import { Card, Select, Modal } from './ui/StyledComponents';

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
                                <div className="mt-2 text-xs grid grid-cols-2 gap-2 text-gray-300">
                                    {task.difficulty !== undefined && <div>Difficulty: <span className="font-bold">{task.difficulty}/5</span></div>}
                                    {accuracy !== null && <div>Accuracy: <span className="font-bold">{accuracy.toFixed(0)}%</span> ({task.correctAnswers}/{task.totalQuestions})</div>}
                                </div>
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
            <div className="flex flex-row md:flex-col gap-6 text-center md:text-left">
                <div>
                    <h3 className="text-gray-400 text-sm font-medium">Total Tasks Completed</h3>
                    <p className="text-3xl font-bold text-green-400 mt-1">{stats.completedTasks}</p>
                </div>
                <div>
                    <h3 className="text-gray-400 text-sm font-medium">Pending Tasks</h3>
                    <p className="text-3xl font-bold text-yellow-400 mt-1">{(stats.totalTasks - stats.completedTasks)}</p>
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
    
    const calculateOverallScore = (avgDifficulty: number, avgAccuracy: number | null): number => {
        const hasDifficulty = avgDifficulty > 0;
        const hasAccuracy = avgAccuracy !== null;

        if (hasDifficulty && hasAccuracy) {
            const normalizedDifficultyScore = ((5 - avgDifficulty) / 4) * 100;
            return (normalizedDifficultyScore * 0.35) + (avgAccuracy * 0.65);
        } else if (hasDifficulty) {
            return ((5 - avgDifficulty) / 4) * 100;
        } else if (hasAccuracy) {
            return avgAccuracy;
        }
        return 0;
    }

    const getScoreColorClass = (score: number) => {
        if (score <= 40) return 'text-red-400';
        if (score <= 79) return 'text-yellow-400';
        return 'text-green-400';
    }
    
    const getScoreBgClass = (score: number) => {
        if (score <= 40) return 'bg-red-500/10';
        if (score <= 79) return 'bg-yellow-500/10';
        return 'bg-green-500/10';
    }


    return (
        <Card>
            <h3 className="text-lg font-semibold text-brand-cyan-400 mb-4">Detailed Chapter Breakdown</h3>
            <div className="space-y-3">
                 {/* FIX: Cast the result of Object.entries to a typed array to resolve 'unknown' type errors on destructured variables. */}
                {(Object.entries(subjectStats.chapters) as [string, ChapterStats][]).filter(([,data]) => hasData(data)).map(([chapterName, chapterData]) => {
                    const chapterMicrotopicScores = Object.values(chapterData.microtopics)
                        .filter(mt => mt.completed > 0 && (mt.avgDifficulty > 0 || mt.avgAccuracy !== null))
                        .map(mt => calculateOverallScore(mt.avgDifficulty, mt.avgAccuracy));
                    
                    const chapterAvgScore = chapterMicrotopicScores.length > 0
                        ? chapterMicrotopicScores.reduce((a, b) => a + b, 0) / chapterMicrotopicScores.length
                        : 0;

                    return (
                        <div key={chapterName} className={cn("rounded-lg overflow-hidden border border-white/10", chapterAvgScore > 0 && getScoreBgClass(chapterAvgScore))}>
                            <div className="p-3 cursor-pointer bg-slate-900/30 hover:bg-slate-900/50" onClick={() => toggleExpand(chapterName)}>
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold flex items-center gap-2">
                                        <ChevronDownIcon className={cn("w-4 h-4 transition-transform", expanded[chapterName] ? 'rotate-180' : '')}/>
                                        {chapterName}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span title="Number of times chapter is included in test plans" className="font-semibold">In Tests: {chapterTestFrequency[subjectName]?.[chapterName] || 0}</span>
                                        <span className={cn("font-bold", getScoreColorClass(chapterAvgScore))}>Score: {chapterAvgScore.toFixed(0)}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
                                    <div><span className="text-gray-400">Completion</span><br/>{chapterData.completionRate.toFixed(1)}% ({chapterData.completed}/{chapterData.total})</div>
                                    <div><span className="text-gray-400">Avg. Difficulty</span><br/>{chapterData.avgDifficulty > 0 ? chapterData.avgDifficulty.toFixed(2) : 'N/A'}</div>
                                    <div><span className="text-gray-400">Avg. Accuracy</span><br/>{chapterData.avgAccuracy !== null ? `${chapterData.avgAccuracy.toFixed(1)}%` : 'N/A'}</div>
                                </div>
                            </div>
                            
                            {expanded[chapterName] && (
                                <div className="bg-black/20 text-gray-400 text-xs">
                                    {/* FIX: Cast the result of Object.entries to a typed array to resolve 'unknown' type errors on destructured variables. */}
                                    {(Object.entries(chapterData.microtopics) as [string, MicrotopicStats][]).filter(([,data]) => hasData(data)).map(([microtopicName, microtopicData]) => {
                                        const microtopicScore = calculateOverallScore(microtopicData.avgDifficulty, microtopicData.avgAccuracy);
                                        return (
                                            <div key={microtopicName} className="border-t border-white/10 p-3 cursor-pointer transition-colors hover:bg-black/40" onClick={(e) => { e.stopPropagation(); onMicrotopicClick(subjectName, chapterName, microtopicName)}}>
                                                <div className="flex justify-between items-center">
                                                    <p className={cn(getScoreColorClass(microtopicScore), "font-semibold")}>{microtopicName}</p>
                                                    <span className="font-bold">{microtopicScore.toFixed(0)}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 mt-1 text-center text-[10px]">
                                                    <div>{microtopicData.completionRate.toFixed(0)}% ({microtopicData.completed}/{microtopicData.total})</div>
                                                    <div>{microtopicData.avgDifficulty > 0 ? microtopicData.avgDifficulty.toFixed(2) : 'N/A'}</div>
                                                    <div>{microtopicData.avgAccuracy !== null ? `${microtopicData.avgAccuracy.toFixed(0)}%` : 'N/A'}</div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </Card>
    )
};

const SubjectDetailView: React.FC<{ 
    subjectName: SubjectName; 
    subjectStats: SubjectStats;
    onMicrotopicClick: (subject: SubjectName, chapter: string, microtopic: string) => void;
    chapterTestFrequency: ChapterFrequency;
}> = ({ subjectName, subjectStats, onMicrotopicClick, chapterTestFrequency }) => {
    const [chapterFilter, setChapterFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState('score-asc'); // 'score-asc' for weakest first, 'score-desc' for strongest first

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SubjectStatsCard title="Completion" value={`${subjectStats.completionRate.toFixed(1)}%`} />
                <SubjectStatsCard title="Completed Tasks" value={`${subjectStats.completed} / ${subjectStats.total}`} />
                <SubjectStatsCard title="Avg. Difficulty" value={subjectStats.avgDifficulty > 0 ? subjectStats.avgDifficulty.toFixed(2) : 'N/A'} />
                <SubjectStatsCard title="Avg. Accuracy" value={subjectStats.avgAccuracy !== null ? `${subjectStats.avgAccuracy.toFixed(1)}%` : 'N/A'} />
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


const Dashboard: React.FC = () => {
    const [tasks] = useLocalStorage<Task[]>('tasks', []);
    const [testPlans] = useLocalStorage<TestPlan[]>('testPlans', []);
    const stats = useMemo(() => calculateProgress(tasks), [tasks]);
    const [activeTab, setActiveTab] = useState<SubjectName>('Physics');
    const [historyModalTopic, setHistoryModalTopic] = useState<{ subject: SubjectName; chapter: string; microtopic: string; } | null>(null);

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

            <ActivityTracker tasks={tasks} />
            
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