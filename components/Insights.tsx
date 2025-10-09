import React, { useMemo } from 'react';
import { Task, TestPlan, SubjectName, ChapterStats, MicrotopicStats } from '../types';
import { calculateProgress, formatDuration, calculateOverallScore } from '../lib/utils';
import { Card } from './ui/StyledComponents';
import { ClockIcon, TrendingUpIcon, TargetIcon, HistoryIcon, TrendingDownIcon, CrosshairIcon } from './ui/Icons';
import { cn } from '../lib/utils';
import { syllabus } from '../data/syllabus';

interface InsightsProps {
    tasks: Task[];
    testPlans: TestPlan[];
    targetScore: number;
}

const InsightCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; colorClass: string }> = ({ title, icon, children, colorClass }) => (
    <Card className={cn("p-6 border-l-4", colorClass)}>
        <h2 className="flex items-center gap-3 text-xl font-bold text-brand-cyan-400 mb-4">
            {icon}
            {title}
        </h2>
        <div className="space-y-4">
            {children}
        </div>
    </Card>
);

const InfoPill: React.FC<{ label: string; value: string | number; subtext?: string; icon: React.ReactNode }> = ({ label, value, subtext, icon }) => (
    <div className="p-3 bg-black/30 rounded-lg">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-900/50">
                {icon}
            </div>
            <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="font-bold text-white text-lg">{value}</p>
                 {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
            </div>
        </div>
    </div>
);

const Insights: React.FC<InsightsProps> = ({ tasks, testPlans, targetScore }) => {
    const progressStats = useMemo(() => calculateProgress(tasks), [tasks]);
    const completedTasks = useMemo(() => tasks.filter(t => t.status === 'Completed'), [tasks]);

    const pastInsights = useMemo(() => {
        if (completedTasks.length === 0) return null;

        // Peak Performance Day
        const dailyTotals: { [date: string]: number } = {};
        completedTasks.forEach(task => {
            task.sessions.forEach(session => {
                const dateStr = session.date.split('T')[0];
                dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + session.duration;
            });
        });
        const peakDay = Object.entries(dailyTotals).sort((a, b) => b[1] - a[1])[0];

        // Biggest Breakthrough
        const sortedTasks = [...completedTasks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const midPointIndex = Math.floor(sortedTasks.length / 2);
        const firstHalf = sortedTasks.slice(0, midPointIndex);
        const secondHalf = sortedTasks.slice(midPointIndex);
        
        let biggestImprovement = { subject: null as SubjectName | null, change: -100 };
        (Object.keys(syllabus) as SubjectName[]).forEach(subject => {
            const getAvgScore = (taskSet: Task[]) => {
                const subjectTasks = taskSet.filter(t => t.subject === subject);
                if (subjectTasks.length === 0) return null;
                const totalScore = subjectTasks.reduce((sum, task) => {
                    const stats = progressStats.subjects[subject]?.chapters[task.chapter]?.microtopics[task.microtopics[0]];
                    return stats ? sum + calculateOverallScore(stats.avgDifficulty, stats.avgAccuracy) : sum;
                }, 0);
                return totalScore / subjectTasks.length;
            };
            const firstScore = getAvgScore(firstHalf);
            const secondScore = getAvgScore(secondHalf);

            if (firstScore !== null && secondScore !== null && (secondScore - firstScore) > biggestImprovement.change) {
                biggestImprovement = { subject, change: secondScore - firstScore };
            }
        });

        // Most Practiced Chapter
        const practiceCounts: { [key: string]: number } = {};
        completedTasks.filter(t => t.taskType === 'Practice').forEach(task => {
            const key = `${task.chapter} (${task.subject})`;
            practiceCounts[key] = (practiceCounts[key] || 0) + (task.totalQuestions || 0);
        });
        const mostPracticed = Object.entries(practiceCounts).sort((a, b) => b[1] - a[1])[0];

        return {
            peakDayDate: peakDay ? new Date(new Date(peakDay[0]).toLocaleString("en-US", { timeZone: "UTC" })).toLocaleDateString() : 'N/A',
            peakDayDuration: peakDay ? formatDuration(peakDay[1]) : 'N/A',
            breakthroughSubject: biggestImprovement.subject,
            breakthroughChange: biggestImprovement.change,
            mostPracticedChapter: mostPracticed ? mostPracticed[0] : 'N/A',
            mostPracticedCount: mostPracticed ? mostPracticed[1] : 0,
        };
    }, [completedTasks, progressStats]);

     const presentInsights = useMemo(() => {
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        const recentTasks = completedTasks.filter(t => new Date(t.date) >= fourteenDaysAgo);

        if (recentTasks.length === 0) return null;

        // Current Strongest Subject
        const subjectScores: { [key in SubjectName]?: { total: number; count: number } } = {};
        recentTasks.forEach(task => {
            if (!subjectScores[task.subject]) subjectScores[task.subject] = { total: 0, count: 0 };
            const stats = progressStats.subjects[task.subject]?.chapters[task.chapter]?.microtopics[task.microtopics[0]];
            if (stats) {
                subjectScores[task.subject]!.total += calculateOverallScore(stats.avgDifficulty, stats.avgAccuracy);
                subjectScores[task.subject]!.count++;
            }
        });

        const strongestSubject = (Object.entries(subjectScores) as [SubjectName, { total: number; count: number }][])
            .map(([name, data]) => ({ name, score: data.count > 0 ? data.total / data.count : 0 }))
            .sort((a, b) => b.score - a.score)[0];

        // Most Critical Topic
        let criticalTopic: { name: string; chapter: string; subject: SubjectName; score: number } | null = null;
        let minScore = 100;
        let maxChapterSize = 0;

        (Object.keys(progressStats.subjects) as SubjectName[]).forEach(subject => {
            Object.values(progressStats.subjects[subject].chapters).forEach(chapter => {
                Object.entries((chapter as ChapterStats).microtopics).forEach(([microtopicName, microtopic]) => {
                    const stats = microtopic as MicrotopicStats;
                    const score = calculateOverallScore(stats.avgDifficulty, stats.avgAccuracy);
                    const chapterSize = Object.keys((chapter as ChapterStats).microtopics).length;

                    if (stats.completed > 0 && score < 50) {
                        // Prioritize larger chapters with low scores
                        if (score < minScore || (score === minScore && chapterSize > maxChapterSize)) {
                            minScore = score;
                            maxChapterSize = chapterSize;
                            criticalTopic = { name: microtopicName, chapter: (chapter as any).name, subject: subject, score };
                        }
                    }
                });
            });
        });
        
        return {
            strongestSubjectName: strongestSubject.name,
            strongestSubjectScore: strongestSubject.score,
            criticalTopic,
        };
    }, [completedTasks, progressStats]);

    const futureInsights = useMemo(() => {
        const lastTest = testPlans
            .filter(t => t.status === 'Completed' && t.analysis)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        if (!lastTest || !lastTest.analysis || !presentInsights?.criticalTopic) return null;

        // Projected Score Trajectory
        const { criticalTopic } = presentInsights;
        const currentScore = lastTest.analysis.marksObtained || 0;
        const subjectPerf = lastTest.analysis.subjectWisePerformance?.[criticalTopic.subject];
        let projectedScore = currentScore;
        
        if (subjectPerf && subjectPerf.totalQuestions > 0) {
            // Assume improving the critical topic contributes to improving 15% of the incorrect questions in that subject
            const questionsToImprove = Math.ceil(subjectPerf.incorrect * 0.15);
            const scoreGain = (questionsToImprove * 4) + (questionsToImprove * 1); // Gain 4 for correct, avoid -1 for incorrect
            projectedScore = Math.min(720, currentScore + scoreGain);
        }

        // Roadmap to Target
        const scoreGap = targetScore - currentScore;
        if (scoreGap <= 0) return { projectedScore, roadmap: [], lastTestScore: currentScore };
        
        const subjectGaps = (Object.keys(syllabus) as SubjectName[]).map(subject => {
            const perf = lastTest.analysis!.subjectWisePerformance?.[subject];
            const maxMarks = (perf?.totalQuestions || 45) * 4;
            const currentMarks = perf?.score || 0;
            const potentialGain = maxMarks - currentMarks;
            return { subject, potentialGain, currentMarks, maxMarks };
        }).sort((a, b) => b.potentialGain - a.potentialGain);

        return {
            lastTestScore: currentScore,
            projectedScore,
            roadmap: subjectGaps.slice(0, 3)
        };
    }, [testPlans, presentInsights, targetScore]);

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-brand-cyan-400">Temporal Insight Engine</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <InsightCard title="Preparation Rewind" icon={<HistoryIcon />} colorClass="border-blue-500">
                    {pastInsights ? <>
                        <InfoPill label="Peak Performance Day" value={pastInsights.peakDayDuration} subtext={pastInsights.peakDayDate} icon={<ClockIcon className="w-5 h-5 text-yellow-300" />} />
                        <InfoPill label="Biggest Breakthrough" value={pastInsights.breakthroughSubject || 'N/A'} subtext={`+${pastInsights.breakthroughChange.toFixed(1)} score change`} icon={<TrendingUpIcon className="w-5 h-5 text-green-400" />} />
                        <InfoPill label="Most Practiced Chapter" value={`${pastInsights.mostPracticedCount} Qs`} subtext={pastInsights.mostPracticedChapter} icon={<TargetIcon className="w-5 h-5 text-purple-400" />} />
                    </> : <p className="text-gray-400">Complete more tasks to unlock insights about your past performance.</p>}
                </InsightCard>

                <InsightCard title="Current Snapshot" icon={<CrosshairIcon />} colorClass="border-yellow-500">
                     {presentInsights ? <>
                        <InfoPill label="Current Strongest Subject" value={presentInsights.strongestSubjectName} subtext={`Score: ${presentInsights.strongestSubjectScore.toFixed(1)}/100 (last 14 days)`} icon={<TrendingUpIcon className="w-5 h-5 text-green-400" />} />
                        <div className="p-3 bg-red-900/40 rounded-lg border border-red-500/50">
                             <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-900/50">
                                    <TrendingDownIcon className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Most Critical Topic</p>
                                    <p className="font-bold text-white text-lg">{presentInsights.criticalTopic?.name || 'None'}</p>
                                    {presentInsights.criticalTopic && <p className="text-xs text-gray-500">{presentInsights.criticalTopic.chapter}</p>}
                                </div>
                            </div>
                            <p className="text-xs text-red-300 mt-2">This topic has a low performance score but high potential impact. Focusing here could yield significant gains.</p>
                        </div>
                    </> : <p className="text-gray-400">Log some tasks from the last 14 days to see your current snapshot.</p>}
                </InsightCard>

                <InsightCard title="Future Projections" icon={<TrendingUpIcon />} colorClass="border-green-500">
                    {futureInsights ? <>
                        <div className="text-center">
                            <p className="text-sm text-gray-400">By mastering your critical topic, your score could improve:</p>
                            <div className="flex items-center justify-center gap-4 my-2">
                                <div className="text-center">
                                    <p className="text-xs text-gray-500">Last Test</p>
                                    <p className="text-3xl font-bold text-brand-cyan-300">{futureInsights.lastTestScore}</p>
                                </div>
                                <TrendingUpIcon className="w-8 h-8 text-green-400" />
                                <div className="text-center">
                                    <p className="text-xs text-gray-500">Potential</p>
                                    <p className="text-3xl font-bold text-green-400">{futureInsights.projectedScore.toFixed(0)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-white/10 pt-4">
                            <h3 className="font-semibold mb-2">Roadmap to Target ({targetScore})</h3>
                            {futureInsights.roadmap.length > 0 ? (
                                <ul className="space-y-2 text-sm">
                                    {futureInsights.roadmap.map(({ subject, potentialGain }) => (
                                        <li key={subject} className="flex justify-between items-center p-2 bg-black/20 rounded">
                                            <span>Focus on <strong className="text-white">{subject}</strong></span>
                                            <span className="font-bold text-green-400">+{potentialGain.toFixed(0)} Marks Potential</span>
                                        </li>
                                    ))}
                                </ul>
                            ): <p className="text-sm text-green-400 text-center">You've already surpassed your target score in the last test. Amazing work!</p>}
                        </div>
                    </> : <p className="text-gray-400">Complete and analyze a mock test to unlock future projections.</p>}
                </InsightCard>
            </div>
        </div>
    );
};

export default Insights;