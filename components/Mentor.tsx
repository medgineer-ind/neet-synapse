import React, { useMemo, useState } from 'react';
import { Task, TestPlan, SubjectName, SubjectStats, ChapterStats, MicrotopicStats } from '../types';
import { calculateProgress, calculateStudyTimeStats, calculateOverallScore, getScoreColorClass, formatDuration } from '../lib/utils';
import { Card, Input, Button } from './ui/StyledComponents';
import { BrainCircuitIcon, RepeatIcon, TargetIcon, TrophyIcon, BookOpenIcon, LightbulbIcon, TrendingUpIcon, ClockIcon, ActivityIcon, CheckCircleIcon, TrendingDownIcon } from './ui/Icons';
import { cn } from '../lib/utils';

interface MentorProps {
    tasks: Task[];
    testPlans: TestPlan[];
    targetScore: number;
    setTargetScore: React.Dispatch<React.SetStateAction<number>>;
}

// --- Report Display Components ---

const ReportStatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | React.ReactNode; trend?: number; trendLabel?: string }> = ({ icon, label, value, trend, trendLabel }) => (
    <div className="p-4 bg-black/30 rounded-lg flex-1">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-900/50">
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-400">{label}</p>
                <p className="font-bold text-white text-xl">{value}</p>
            </div>
        </div>
        {trend !== undefined && (
            <div className={cn("flex items-center gap-1 text-xs mt-2 ml-1", trend >= 0 ? 'text-green-400' : 'text-red-400')}>
                {trend >= 0 ? <TrendingUpIcon className="w-4 h-4" /> : <TrendingDownIcon className="w-4 h-4" />}
                <span>{trend === Infinity ? 'Started from zero' : `${trend.toFixed(0)}%`} {trendLabel}</span>
            </div>
        )}
    </div>
);

const TopicListItem: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string | React.ReactNode; score?: number; }> = ({ icon, title, subtitle, score }) => (
    <div className="flex items-center gap-3 p-2 bg-black/30 rounded-lg">
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-900/50">
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate text-sm">{title}</p>
            {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
        </div>
        {score !== undefined && (
            <span className={cn("font-bold text-sm", getScoreColorClass(score))}>
                {score.toFixed(0)}/100
            </span>
        )}
    </div>
);

// --- Report Period Components ---

const DailyReport: React.FC<{ reportData: any }> = ({ reportData }) => {
    const { weakestSubject, weakTopics, strongTopics, activeDaysLast7, lastTest, targetScore } = reportData;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            <Card className="p-4 bg-black/30 rounded-lg border-l-4 border-red-500/50">
                <h3 className="flex items-center gap-2 font-display font-semibold text-red-400 mb-3"><LightbulbIcon className="w-5 h-5"/> Today's Top Priorities</h3>
                {weakestSubject && weakTopics.length > 0 ? (
                    <>
                        <p className="text-sm text-gray-300 mb-2">Your data suggests focusing on <strong className="text-white">{weakestSubject}</strong>. Start with these topics:</p>
                        <ul className="space-y-2">
                            {weakTopics.map((topic: any) => (
                                <li key={topic.name} className="p-2 bg-red-900/40 rounded-md text-sm">
                                    <p className="font-bold">{topic.name}</p>
                                    <p className="text-xs text-gray-400">{topic.chapter}</p>
                                    <p className="text-xs text-red-300 mt-1">Suggestion: Focus on <strong className="underline">{topic.reason === 'Low Accuracy' ? 'Practice' : 'Revision'}</strong>.</p>
                                </li>
                            ))}
                        </ul>
                    </>
                ) : <p className="text-sm text-gray-400">Great work! No specific weak areas detected today. Review any topic you feel needs a touch-up.</p>}
            </Card>
             <Card className="p-4 bg-black/30 rounded-lg border-l-4 border-green-500/50">
                <h3 className="flex items-center gap-2 font-display font-semibold text-green-400 mb-3"><TrendingUpIcon className="w-5 h-5"/> Sharpen Your Strengths</h3>
                {strongTopics.length > 0 ? (
                     <>
                        <p className="text-sm text-gray-300 mb-2">You're performing well in these topics. Solidify your knowledge to turn them into guaranteed scores!</p>
                        <ul className="space-y-2">
                            {strongTopics.map((topic: any) => (
                                <li key={`${topic.name}-${topic.chapter}`} className="p-2 bg-green-900/40 rounded-md text-sm">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">{topic.name}</p>
                                            <p className="text-xs text-gray-400">{topic.chapter}</p>
                                        </div>
                                        <span className={cn("font-bold text-sm", getScoreColorClass(topic.score))}>
                                            {topic.score.toFixed(0)}/100
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                ) : <p className="text-sm text-gray-400">Complete some tasks to identify and build upon your strengths.</p>}
                <div className="border-t border-white/10 mt-4 pt-4">
                     <h3 className="flex items-center gap-2 font-display font-semibold text-yellow-400 mb-3"><RepeatIcon className="w-5 h-5"/> Consistency Check</h3>
                     <p className="text-sm text-gray-300">You've had <strong className="text-white">{activeDaysLast7} active study days</strong> in the last 7 days. {activeDaysLast7 >= 5 ? "Excellent momentum! Keep it up." : "Consistency is key. Try to study a little every day."}</p>
                </div>
            </Card>
             <Card className="p-4 bg-black/30 rounded-lg border-l-4 border-brand-amber-500/50">
                <h3 className="flex items-center gap-2 font-display font-semibold text-brand-amber-400 mb-3"><TrophyIcon className="w-5 h-5"/> Target Guidance</h3>
                {lastTest && lastTest.analysis ? (
                     <>
                        <p className="text-sm text-gray-300">Your last test was <strong className="text-white">"{lastTest.name}"</strong>.</p>
                        <div className="text-center my-4">
                            <p className="text-gray-400">Your Score</p>
                            <p className="text-3xl font-bold text-brand-amber-300">{lastTest.analysis.marksObtained} / {lastTest.analysis.totalMarks}</p>
                        </div>
                         <div className="text-center">
                            <p className="text-gray-400">Your Target</p>
                            <p className="text-3xl font-bold text-green-400">{targetScore} / 720</p>
                        </div>
                        <div className="text-center mt-4">
                            <p className="text-lg font-semibold text-yellow-400">You need {Math.max(0, targetScore - (lastTest.analysis.marksObtained || 0))} more marks.</p>
                            <p className="text-xs text-gray-400">Analyze your test to see where you can improve!</p>
                        </div>
                    </>
                ) : <p className="text-sm text-gray-400">Complete a mock test and log the analysis to get personalized guidance towards your target score of <strong className="text-white">{targetScore}</strong>.</p>}
            </Card>
        </div>
    );
};

const WeeklySummary: React.FC<{ reportData: any }> = ({ reportData }) => {
    if (!reportData) {
        return <p className="text-center text-gray-400 py-8">Log some study sessions this week to generate your weekly summary.</p>;
    }
    const { totalTime, tasksCompleted, activeDays, timeTrend, topPerformingTopics, weakestTopics, mostStudied } = reportData;
    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row gap-4">
                <ReportStatCard icon={<ClockIcon className="w-5 h-5 text-brand-amber-300"/>} label="Total Study Time" value={formatDuration(totalTime)} trend={timeTrend} trendLabel="vs. last week"/>
                <ReportStatCard icon={<CheckCircleIcon className="w-5 h-5 text-green-400"/>} label="Tasks Completed" value={tasksCompleted} />
                <ReportStatCard icon={<ActivityIcon className="w-5 h-5 text-yellow-400"/>} label="Active Days" value={`${activeDays} / 7`} />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-4">
                    <h3 className="font-display font-semibold text-green-400 mb-3">Top 5 Performing Topics</h3>
                    <div className="space-y-2">
                        {topPerformingTopics.length > 0 ? topPerformingTopics.map((topic: any) => (
                            <TopicListItem key={`${topic.subject}-${topic.chapter}-${topic.name}`} icon={<TrendingUpIcon className="w-5 h-5 text-green-400"/>} title={topic.name} subtitle={`${topic.chapter} (${topic.subject})`} score={topic.score} />
                        )) : <p className="text-sm text-gray-400">Not enough data.</p>}
                    </div>
                </Card>
                <Card className="p-4">
                    <h3 className="font-display font-semibold text-red-400 mb-3">5 Topics to Focus On</h3>
                    <div className="space-y-2">
                        {weakestTopics.length > 0 ? weakestTopics.map((topic: any) => (
                            <TopicListItem key={`${topic.subject}-${topic.chapter}-${topic.name}`} icon={<TrendingDownIcon className="w-5 h-5 text-red-400"/>} title={topic.name} subtitle={`${topic.chapter} (${topic.subject})`} score={topic.score} />
                        )) : <p className="text-sm text-gray-400">No specific weak topics found this week. Good job!</p>}
                    </div>
                </Card>
                <Card className="p-4">
                    <h3 className="font-display font-semibold text-brand-amber-400 mb-3">Top 5 Most Studied Chapters</h3>
                    <div className="space-y-2">
                       {mostStudied.length > 0 ? mostStudied.map(([name, duration]: [string, number]) => (
                           <TopicListItem key={name} icon={<BookOpenIcon className="w-5 h-5 text-gray-300"/>} title={name} subtitle={formatDuration(duration)} />
                       )) : <p className="text-sm text-gray-400">Not enough data.</p>}
                    </div>
                </Card>
            </div>
        </div>
    );
};

const MonthlyReview: React.FC<{ reportData: any }> = ({ reportData }) => {
     if (!reportData) {
        return <p className="text-center text-gray-400 py-8">Log some study sessions this month to generate your monthly review.</p>;
    }
    const { totalTime, tasksCompleted, activeDays, topPerformingChapters, weakestChapters, avgTestPercentage, testCount } = reportData;
    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row gap-4">
                <ReportStatCard icon={<ClockIcon className="w-5 h-5 text-brand-amber-300"/>} label="Total Study Time" value={formatDuration(totalTime)} />
                <ReportStatCard icon={<CheckCircleIcon className="w-5 h-5 text-green-400"/>} label="Tasks Completed" value={tasksCompleted} />
                <ReportStatCard icon={<ActivityIcon className="w-5 h-5 text-yellow-400"/>} label="Active Days" value={`${activeDays} / 30`} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4">
                    <h3 className="font-display font-semibold text-green-400 mb-3">Top 5 Strongest Chapters</h3>
                    <div className="space-y-2">
                        {topPerformingChapters.length > 0 ? topPerformingChapters.map((chapter: any) => (
                            <TopicListItem key={`${chapter.subject}-${chapter.name}`} icon={<TrendingUpIcon className="w-5 h-5 text-green-400"/>} title={chapter.name} subtitle={chapter.subject} score={chapter.score} />
                        )) : <p className="text-sm text-gray-400">Not enough data for this month.</p>}
                    </div>
                </Card>
                <Card className="p-4">
                    <h3 className="font-display font-semibold text-red-400 mb-3">5 Chapters to Focus On</h3>
                    <div className="space-y-2">
                        {weakestChapters.length > 0 ? weakestChapters.map((chapter: any) => (
                            <TopicListItem key={`${chapter.subject}-${chapter.name}`} icon={<TrendingDownIcon className="w-5 h-5 text-red-400"/>} title={chapter.name} subtitle={chapter.subject} score={chapter.score} />
                        )) : <p className="text-sm text-gray-400">No specific chapters need urgent focus. Keep up the balanced work!</p>}
                    </div>
                </Card>
            </div>
             <Card className="p-4">
                <h3 className="font-display font-semibold text-brand-amber-400 mb-3">Monthly Test Performance</h3>
                 {testCount > 0 ? (
                     <TopicListItem
                        icon={<TrophyIcon className="w-6 h-6 text-yellow-400"/>}
                        title={`${avgTestPercentage.toFixed(1)}%`}
                        subtitle={`Average score across ${testCount} test(s)`}
                     />
                 ) : (
                    <p className="text-sm text-gray-400">No tests completed this month. Schedule one to track your progress!</p>
                 )}
            </Card>
        </div>
    );
};


const Mentor: React.FC<MentorProps> = ({ tasks, testPlans, targetScore, setTargetScore }) => {
    const [scoreInput, setScoreInput] = useState(String(targetScore));
    const [activeReport, setActiveReport] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

    const progressStats = useMemo(() => calculateProgress(tasks), [tasks]);
    const studyTimeStats = useMemo(() => calculateStudyTimeStats(tasks), [tasks]);

    const { neetReadinessScore, rankTier } = useMemo(() => {
        const syllabusCompletion = progressStats.completionRate;

        let totalScore = 0;
        let scoredTopicsCount = 0;
        Object.values(progressStats.subjects).forEach((subject: SubjectStats) => {
            Object.values(subject.chapters).forEach((chapter: ChapterStats) => {
                Object.values(chapter.microtopics).forEach((microtopic: MicrotopicStats) => {
                    if (microtopic.completed > 0) {
                        const score = calculateOverallScore(microtopic.avgDifficulty, microtopic.avgAccuracy);
                        if (score > 0) {
                            totalScore += score;
                            scoredTopicsCount++;
                        }
                    }
                });
            });
        });
        const knowledgeDepth = scoredTopicsCount > 0 ? totalScore / scoredTopicsCount : 0;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeDaysLast30 = studyTimeStats.daily.filter(d => new Date(d.date) >= thirtyDaysAgo).length;
        const consistencyScore = Math.min(100, (activeDaysLast30 / 30) * 100);

        const completedTests = testPlans.filter(t => t.status === 'Completed' && t.analysis);
        let avgTestPercentage = 0;
        if (completedTests.length > 0) {
            let totalPercentage = 0;
            completedTests.forEach(test => {
                if (test.analysis.totalMarks && typeof test.analysis.marksObtained === 'number' && test.analysis.totalMarks > 0) {
                    totalPercentage += (test.analysis.marksObtained / test.analysis.totalMarks) * 100;
                }
            });
            avgTestPercentage = totalPercentage / completedTests.length;
        }

        let nrs = 0;
        const weights = { completion: 35, knowledge: 40, consistency: 15, test: 10 };
        
        nrs += (syllabusCompletion / 100) * weights.completion;
        nrs += (knowledgeDepth / 100) * weights.knowledge;
        nrs += (consistencyScore / 100) * weights.consistency;
        
        if (completedTests.length > 0) {
            nrs += (avgTestPercentage / 100) * weights.test;
        } else {
            const newTotalWeight = weights.completion + weights.knowledge + weights.consistency;
            nrs = (nrs / newTotalWeight) * 100;
        }
        
        const finalNRS = Math.round(nrs * 10);
        let tier = "Needs Significant Improvement";
        if (finalNRS > 900) tier = "Top 1,000";
        else if (finalNRS > 800) tier = "Top 10,000";
        else if (finalNRS > 650) tier = "Top 50,000";
        else if (finalNRS > 500) tier = "Qualifying Range";

        return { neetReadinessScore: finalNRS, rankTier: tier };
    }, [progressStats, studyTimeStats, testPlans]);


    const dailyReport = useMemo(() => {
        let weakestSubject: SubjectName | null = null;
        let minScore = 101;
        
        (Object.keys(progressStats.subjects) as SubjectName[]).forEach(subjectName => {
            const subject = progressStats.subjects[subjectName];
            let totalScore = 0;
            let count = 0;
            Object.values(subject.chapters).forEach((c: ChapterStats) => Object.values(c.microtopics).forEach((m: MicrotopicStats) => {
                if (m.completed > 0) {
                    const score = calculateOverallScore(m.avgDifficulty, m.avgAccuracy);
                    if (score > 0) { totalScore += score; count++; }
                }
            }));
            const avgScore = count > 0 ? totalScore / count : 101;
            if (avgScore < minScore) {
                minScore = avgScore;
                weakestSubject = subjectName;
            }
        });

        let weakTopics: { name: string; chapter: string; score: number; reason: string }[] = [];
        if (weakestSubject) {
            const allMicrotopics: { name: string; chapter: string; score: number; reason: string }[] = [];
            Object.entries(progressStats.subjects[weakestSubject].chapters).forEach(([chapterName, chapter]) => {
                Object.entries((chapter as ChapterStats).microtopics).forEach(([microtopicName, microtopic]) => {
                    const stats = microtopic as MicrotopicStats;
                    if (stats.completed > 0) {
                        const score = calculateOverallScore(stats.avgDifficulty, stats.avgAccuracy);
                         if (score > 0 && score < 60) {
                             const reason = (stats.avgAccuracy !== null && stats.avgAccuracy < 60) ? 'Low Accuracy' : 'High Difficulty';
                            allMicrotopics.push({ name: microtopicName, chapter: chapterName, score, reason });
                        }
                    }
                });
            });
            weakTopics = allMicrotopics.sort((a, b) => a.score - b.score).slice(0, 5);
        }

        const allStrongScoredTopics: { name: string; chapter: string; score: number; }[] = [];
        (Object.values(progressStats.subjects) as SubjectStats[]).forEach(subject => {
            Object.entries(subject.chapters).forEach(([chapterName, chapterData]) => {
                Object.entries(chapterData.microtopics).forEach(([microtopicName, microtopicData]) => {
                    if (microtopicData.completed > 0) {
                        const score = calculateOverallScore(microtopicData.avgDifficulty, microtopicData.avgAccuracy);
                        if (score >= 80) {
                            allStrongScoredTopics.push({ name: microtopicName, chapter: chapterName, score });
                        }
                    }
                });
            });
        });
        const strongTopics = allStrongScoredTopics.sort((a, b) => b.score - a.score).slice(0, 5);
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeDaysLast7 = studyTimeStats.daily.filter(d => new Date(d.date) >= sevenDaysAgo).length;
        const lastTest = testPlans.filter(t => t.status === 'Completed' && t.analysis).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        return { weakestSubject, weakTopics, strongTopics, activeDaysLast7, lastTest, targetScore };
    }, [progressStats, tasks, testPlans, studyTimeStats, targetScore]);

    const weeklyReport = useMemo(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const weeklyTasks = tasks.filter(t => t.status === 'Completed' && new Date(t.date) >= sevenDaysAgo);
    
        if (weeklyTasks.length === 0) return null;
    
        const totalTime = weeklyTasks.reduce((sum, task) => sum + task.sessions.reduce((sSum, s) => sSum + s.duration, 0), 0);
        const tasksCompleted = weeklyTasks.length;
        const activeDays = new Set(weeklyTasks.map(t => t.date)).size;
    
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        const previousWeekTasks = tasks.filter(t => t.status === 'Completed' && new Date(t.date) >= fourteenDaysAgo && new Date(t.date) < sevenDaysAgo);
        const previousWeekTime = previousWeekTasks.reduce((sum, task) => sum + task.sessions.reduce((sSum, s) => sSum + s.duration, 0), 0);
        let timeTrend = 0;
        if (previousWeekTime > 0) {
            timeTrend = ((totalTime - previousWeekTime) / previousWeekTime) * 100;
        } else if (totalTime > 0) {
            timeTrend = Infinity;
        }
    
        const weeklyMicrotopicStats: { [key: string]: { name: string, chapter: string, subject: SubjectName, difficulties: number[], accuracies: number[] } } = {};
        weeklyTasks.forEach(task => {
            task.microtopics.forEach(microtopicName => {
                const key = `${task.subject}-${task.chapter}-${microtopicName}`;
                if (!weeklyMicrotopicStats[key]) {
                    weeklyMicrotopicStats[key] = {
                        name: microtopicName,
                        chapter: task.chapter,
                        subject: task.subject,
                        difficulties: [],
                        accuracies: []
                    };
                }
                if (task.difficulty) {
                    weeklyMicrotopicStats[key].difficulties.push(task.difficulty);
                }
                if (task.totalQuestions && task.totalQuestions > 0 && task.correctAnswers !== undefined) {
                    weeklyMicrotopicStats[key].accuracies.push((task.correctAnswers / task.totalQuestions) * 100);
                }
            });
        });
        const weeklyScoredTopics = Object.values(weeklyMicrotopicStats).map(stats => {
            const avgDifficulty = stats.difficulties.length > 0 ? stats.difficulties.reduce((a, b) => a + b, 0) / stats.difficulties.length : 0;
            const avgAccuracy = stats.accuracies.length > 0 ? stats.accuracies.reduce((a, b) => a + b, 0) / stats.accuracies.length : null;
            const score = calculateOverallScore(avgDifficulty, avgAccuracy);
            return { name: stats.name, chapter: stats.chapter, subject: stats.subject, score };
        }).filter(t => t.score > 0);

        const topPerformingTopics = [...weeklyScoredTopics].sort((a, b) => b.score - a.score).slice(0, 5);
        const weakestTopics = [...weeklyScoredTopics].sort((a, b) => a.score - b.score).slice(0, 5);

        const chapterTimes: { [key: string]: number } = {};
        weeklyTasks.forEach(task => {
            const key = `${task.chapter} (${task.subject})`;
            const duration = task.sessions.reduce((sum, s) => sum + s.duration, 0);
            chapterTimes[key] = (chapterTimes[key] || 0) + duration;
        });
        const mostStudied = Object.entries(chapterTimes).sort((a, b) => b[1] - a[1]).slice(0, 5);
    
        return { totalTime, tasksCompleted, activeDays, timeTrend, topPerformingTopics, weakestTopics, mostStudied };
    }, [tasks]);
    
    const monthlyReport = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const monthlyTasks = tasks.filter(t => t.status === 'Completed' && new Date(t.date) >= thirtyDaysAgo);
    
        if (monthlyTasks.length === 0) return null;
    
        const totalTime = monthlyTasks.reduce((sum, task) => sum + task.sessions.reduce((sSum, s) => sSum + s.duration, 0), 0);
        const tasksCompleted = monthlyTasks.length;
        const activeDays = new Set(monthlyTasks.map(t => t.date)).size;
    
        const monthlyChapterStats: { [key: string]: { name: string, subject: SubjectName, difficulties: number[], accuracies: number[] } } = {};
        monthlyTasks.forEach(task => {
            const key = `${task.subject}-${task.chapter}`;
            if (!monthlyChapterStats[key]) {
                monthlyChapterStats[key] = {
                    name: task.chapter,
                    subject: task.subject,
                    difficulties: [],
                    accuracies: []
                };
            }
            if (task.difficulty) {
                monthlyChapterStats[key].difficulties.push(task.difficulty);
            }
            if (task.totalQuestions && task.totalQuestions > 0 && task.correctAnswers !== undefined) {
                monthlyChapterStats[key].accuracies.push((task.correctAnswers / task.totalQuestions) * 100);
            }
        });

        const monthlyScoredChapters = Object.values(monthlyChapterStats).map(stats => {
            const avgDifficulty = stats.difficulties.length > 0 ? stats.difficulties.reduce((a, b) => a + b, 0) / stats.difficulties.length : 0;
            const avgAccuracy = stats.accuracies.length > 0 ? stats.accuracies.reduce((a, b) => a + b, 0) / stats.accuracies.length : null;
            const score = calculateOverallScore(avgDifficulty, avgAccuracy);
            return { name: stats.name, subject: stats.subject, score };
        }).filter(c => c.score > 0);

        const topPerformingChapters = [...monthlyScoredChapters].sort((a, b) => b.score - a.score).slice(0, 5);
        const weakestChapters = [...monthlyScoredChapters].sort((a, b) => a.score - b.score).slice(0, 5);
    
        const monthlyTests = testPlans.filter(t => t.status === 'Completed' && t.analysis && new Date(t.date) >= thirtyDaysAgo);
        let avgTestPercentage = 0;
        if (monthlyTests.length > 0) {
            let totalPercentage = 0;
            monthlyTests.forEach(test => {
                if (test.analysis!.totalMarks! > 0) {
                    totalPercentage += (test.analysis!.marksObtained! / test.analysis!.totalMarks!) * 100;
                }
            });
            avgTestPercentage = totalPercentage / monthlyTests.length;
        }
    
        return { totalTime, tasksCompleted, activeDays, topPerformingChapters, weakestChapters, avgTestPercentage, testCount: monthlyTests.length };
    }, [tasks, testPlans]);

    const handleTargetScoreSave = () => {
        const newScore = parseInt(scoreInput, 10);
        if (!isNaN(newScore) && newScore >= 0 && newScore <= 720) {
            setTargetScore(newScore);
            alert('Target score updated!');
        } else {
            alert('Please enter a valid score between 0 and 720.');
        }
    };

    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (neetReadinessScore / 1000) * circumference;

    return (
        <div className="space-y-8">
            <h1 className="font-display text-4xl font-bold text-brand-amber-400 tracking-wide">Synapse AI Mentor</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 p-6 flex flex-col md:flex-row items-center justify-center gap-8">
                    <div className="relative flex items-center justify-center w-52 h-52">
                        <svg className="w-full h-full" viewBox="0 0 180 180">
                            <circle className="text-slate-800" strokeWidth="12" stroke="currentColor" fill="transparent" r={radius} cx="90" cy="90" />
                            <circle className="text-brand-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]" strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="90" cy="90" transform="rotate(-90 90 90)" style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}/>
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="font-display text-5xl font-bold text-brand-amber-400">{neetReadinessScore}</span>
                            <span className="text-sm text-gray-400">/ 1000</span>
                            <span className="font-display text-lg font-semibold text-white mt-2">Readiness Score</span>
                        </div>
                    </div>
                    <div className="text-center md:text-left">
                        <p className="font-display text-gray-400 text-lg">Projected Rank Tier</p>
                        <p className={cn("font-display text-4xl font-bold my-2", getScoreColorClass(neetReadinessScore/10))}>{rankTier}</p>
                        <p className="text-sm text-gray-500 max-w-sm">This is an estimate based on your current syllabus coverage, knowledge depth, consistency, and test performance. Keep working hard to improve your score!</p>
                    </div>
                </Card>
                
                <Card className="p-6">
                    <h2 className="font-display text-2xl font-semibold text-brand-amber-400 mb-4">My Target</h2>
                    <p className="text-gray-400 mb-4">Set your dream score for the NEET exam to get personalized feedback.</p>
                     <div className="flex items-center gap-2">
                        <Input type="number" value={scoreInput} onChange={e => setScoreInput(e.target.value)} max={720} min={0} />
                        <span className="font-bold text-gray-400">/ 720</span>
                     </div>
                     <Button onClick={handleTargetScoreSave} className="w-full mt-4">Set Target</Button>
                </Card>
            </div>
            
            <Card className="p-6">
                <h2 className="font-display text-2xl font-bold text-brand-amber-400 mb-4">Synapse Reports</h2>
                 <div className="flex items-center bg-black/20 rounded-lg p-1 mb-6">
                    {(['Daily', 'Weekly', 'Monthly'] as const).map(period => (
                        <button
                            key={period}
                            onClick={() => setActiveReport(period)}
                            className={cn(
                                "w-full px-3 py-2 text-sm rounded-md transition-colors font-display font-semibold tracking-wider uppercase",
                                activeReport === period
                                    ? "bg-brand-amber-400 text-brand-amber-900"
                                    : "text-gray-300 hover:bg-white/10"
                            )}
                        >
                            {period} Report
                        </button>
                    ))}
                </div>
                
                {activeReport === 'Daily' && <DailyReport reportData={dailyReport} />}
                {activeReport === 'Weekly' && <WeeklySummary reportData={weeklyReport} />}
                {activeReport === 'Monthly' && <MonthlyReview reportData={monthlyReport} />}
            </Card>
        </div>
    );
};

export default Mentor;