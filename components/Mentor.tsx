


import React, { useMemo, useState } from 'react';
// Fix: Import SubjectStats, ChapterStats, and MicrotopicStats to provide explicit types and resolve inference issues.
import { Task, TestPlan, SubjectName, SubjectStats, ChapterStats, MicrotopicStats } from '../types';
import { calculateProgress, calculateStudyTimeStats, calculateOverallScore, getScoreColorClass } from '../lib/utils';
import { Card, Input, Button } from './ui/StyledComponents';
import { BrainCircuitIcon, RepeatIcon, TargetIcon, TrophyIcon, BookOpenIcon, LightbulbIcon, TrendingUpIcon } from './ui/Icons';
import { cn } from '../lib/utils';

interface MentorProps {
    tasks: Task[];
    testPlans: TestPlan[];
    targetScore: number;
    setTargetScore: React.Dispatch<React.SetStateAction<number>>;
}

const Mentor: React.FC<MentorProps> = ({ tasks, testPlans, targetScore, setTargetScore }) => {
    const [scoreInput, setScoreInput] = useState(String(targetScore));

    const progressStats = useMemo(() => calculateProgress(tasks), [tasks]);
    const studyTimeStats = useMemo(() => calculateStudyTimeStats(tasks), [tasks]);

    const { neetReadinessScore, rankTier } = useMemo(() => {
        // 1. Syllabus Completion (35%)
        const syllabusCompletion = progressStats.completionRate;

        // 2. Knowledge Depth (40%)
        let totalScore = 0;
        let scoredTopicsCount = 0;
        // Fix: Add explicit types to forEach callbacks to prevent properties being accessed on 'unknown'.
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

        // 3. Consistency (15%)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeDaysLast30 = studyTimeStats.daily.filter(d => new Date(d.date) >= thirtyDaysAgo).length;
        const consistencyScore = Math.min(100, (activeDaysLast30 / 30) * 100);

        // 4. Test Performance (10%)
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

        // Calculate Final NRS
        let nrs = 0;
        const weights = { completion: 35, knowledge: 40, consistency: 15, test: 10 };
        
        nrs += (syllabusCompletion / 100) * weights.completion;
        nrs += (knowledgeDepth / 100) * weights.knowledge;
        nrs += (consistencyScore / 100) * weights.consistency;
        
        if (completedTests.length > 0) {
            nrs += (avgTestPercentage / 100) * weights.test;
        } else {
            const newTotalWeight = weights.completion + weights.knowledge + weights.consistency;
            nrs = (nrs / newTotalWeight) * 100; // Redistribute weight
        }
        
        const finalNRS = Math.round(nrs * 10);

        // Map to Rank Tier
        let tier = "Needs Significant Improvement";
        if (finalNRS > 900) tier = "Top 1,000";
        else if (finalNRS > 800) tier = "Top 10,000";
        else if (finalNRS > 650) tier = "Top 50,000";
        else if (finalNRS > 500) tier = "Qualifying Range";

        return { neetReadinessScore: finalNRS, rankTier: tier };
    }, [progressStats, studyTimeStats, testPlans]);


    const dailyReport = useMemo(() => {
        // Weakest Subject & Topics
        let weakestSubject: SubjectName | null = null;
        let minScore = 101;
        
        const subjectScores = (Object.keys(progressStats.subjects) as SubjectName[]).map(subjectName => {
            const subject = progressStats.subjects[subjectName];
            let totalScore = 0;
            let count = 0;
            // Fix: Add explicit types to forEach callbacks to prevent properties being accessed on 'unknown'.
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
            return { name: subjectName, score: avgScore };
        });

        let weakTopics: { name: string; chapter: string; score: number; reason: string }[] = [];
        if (weakestSubject) {
            const allMicrotopics = [];
            // Fix: Cast iterated items to their correct types to resolve property access errors on 'unknown'.
            Object.entries(progressStats.subjects[weakestSubject].chapters).forEach(([chapterName, chapter]) => {
                Object.entries((chapter as ChapterStats).microtopics).forEach(([microtopicName, microtopic]) => {
                    const stats = microtopic as MicrotopicStats;
                    if (stats.completed > 0) {
                        const score = calculateOverallScore(stats.avgDifficulty, stats.avgAccuracy);
                         if (score > 0 && score < 60) {
                             const reason = (stats.avgAccuracy !== null && stats.avgAccuracy < 60)
                                ? 'Low Accuracy'
                                : 'High Difficulty';
                            allMicrotopics.push({ name: microtopicName, chapter: chapterName, score, reason });
                        }
                    }
                });
            });
            weakTopics = allMicrotopics.sort((a, b) => a.score - b.score).slice(0, 3);
        }

        // Strongest Topic
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentTasks = tasks.filter(t => t.status === 'Completed' && new Date(t.date) >= sevenDaysAgo);
        let strongestTopic: { name: string; score: number } | null = null;
        if(recentTasks.length > 0) {
            let maxScore = 0;
            recentTasks.forEach(task => {
                task.microtopics.forEach(microtopicName => {
                    const stats = progressStats.subjects[task.subject]?.chapters[task.chapter]?.microtopics[microtopicName];
                    if (stats) {
                        const score = calculateOverallScore(stats.avgDifficulty, stats.avgAccuracy);
                        if (score > maxScore) {
                            maxScore = score;
                            strongestTopic = { name: microtopicName, score };
                        }
                    }
                });
            });
        }
        
        // Consistency
        const sevenDaysAgoConsistency = new Date();
        sevenDaysAgoConsistency.setDate(sevenDaysAgoConsistency.getDate() - 7);
        const activeDaysLast7 = studyTimeStats.daily.filter(d => new Date(d.date) >= sevenDaysAgoConsistency).length;

        // Target Score
        const lastTest = testPlans.filter(t => t.status === 'Completed' && t.analysis).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];


        return { weakestSubject, weakTopics, strongestTopic, activeDaysLast7, lastTest };
    }, [progressStats, tasks, testPlans]);

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
            <h1 className="text-3xl font-bold text-brand-cyan-400">Synapse AI Mentor</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 p-6 flex flex-col md:flex-row items-center justify-center gap-8">
                    <div className="relative flex items-center justify-center w-52 h-52">
                        <svg className="w-full h-full" viewBox="0 0 180 180">
                            <circle className="text-slate-900/50" strokeWidth="12" stroke="currentColor" fill="transparent" r={radius} cx="90" cy="90" />
                            <circle className="text-brand-cyan-500 drop-shadow-[0_0_8px_rgba(0,239,255,0.7)]" strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="90" cy="90" transform="rotate(-90 90 90)" style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}/>
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-5xl font-bold text-brand-cyan-400">{neetReadinessScore}</span>
                            <span className="text-sm text-gray-400">/ 1000</span>
                            <span className="text-lg font-semibold text-white mt-2">Readiness Score</span>
                        </div>
                    </div>
                    <div className="text-center md:text-left">
                        <p className="text-gray-400 text-lg">Projected Rank Tier</p>
                        <p className={cn("text-4xl font-bold my-2", getScoreColorClass(neetReadinessScore/10))}>{rankTier}</p>
                        <p className="text-sm text-gray-500 max-w-sm">This is an estimate based on your current syllabus coverage, knowledge depth, consistency, and test performance. Keep working hard to improve your score!</p>
                    </div>
                </Card>
                
                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-brand-cyan-400 mb-4">My Target</h2>
                    <p className="text-gray-400 mb-4">Set your dream score for the NEET exam to get personalized feedback.</p>
                     <div className="flex items-center gap-2">
                        <Input type="number" value={scoreInput} onChange={e => setScoreInput(e.target.value)} max={720} min={0} />
                        <span className="font-bold text-gray-400">/ 720</span>
                     </div>
                     <Button onClick={handleTargetScoreSave} className="w-full mt-4">Set Target</Button>
                </Card>
            </div>
            
            <Card className="p-6">
                <h2 className="text-2xl font-bold text-brand-cyan-400 mb-4">Daily Synapse Report</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-4 bg-black/30 rounded-lg">
                        <h3 className="flex items-center gap-2 font-semibold text-red-400 mb-3"><LightbulbIcon className="w-5 h-5"/> Today's Top Priority</h3>
                        {dailyReport.weakestSubject && dailyReport.weakTopics.length > 0 ? (
                            <>
                                <p className="text-sm text-gray-300 mb-2">Your data suggests focusing on <strong className="text-white">{dailyReport.weakestSubject}</strong>. Start with these topics:</p>
                                <ul className="space-y-2">
                                    {dailyReport.weakTopics.map(topic => (
                                        <li key={topic.name} className="p-2 bg-red-900/40 rounded-md text-sm">
                                            <p className="font-bold">{topic.name}</p>
                                            <p className="text-xs text-gray-400">{topic.chapter}</p>
                                            <p className="text-xs text-red-300 mt-1">Suggestion: Focus on <strong className="underline">{topic.reason === 'Low Accuracy' ? 'Practice' : 'Revision'}</strong>.</p>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : <p className="text-sm text-gray-400">Great work! No specific weak areas detected today. Review any topic you feel needs a touch-up.</p>}
                    </div>
                     <div className="p-4 bg-black/30 rounded-lg">
                        <h3 className="flex items-center gap-2 font-semibold text-green-400 mb-3"><TrendingUpIcon className="w-5 h-5"/> Sharpen Your Strengths</h3>
                        {dailyReport.strongestTopic ? (
                             <>
                                <p className="text-sm text-gray-300 mb-2">You're performing well in this topic. Solidify your knowledge to turn it into a guaranteed score!</p>
                                 <div className="p-2 bg-green-900/40 rounded-md text-sm">
                                    <p className="font-bold">{dailyReport.strongestTopic.name}</p>
                                    <p className="text-xs text-green-300 mt-1">Suggestion: Attempt a quick 20-minute practice session to master it.</p>
                                </div>
                            </>
                        ) : <p className="text-sm text-gray-400">Complete some tasks to identify and build upon your strengths.</p>}
                        <div className="border-t border-white/10 mt-4 pt-4">
                             <h3 className="flex items-center gap-2 font-semibold text-yellow-400 mb-3"><RepeatIcon className="w-5 h-5"/> Consistency Check</h3>
                             <p className="text-sm text-gray-300">You've had <strong className="text-white">{dailyReport.activeDaysLast7} active study days</strong> in the last 7 days. {dailyReport.activeDaysLast7 >= 5 ? "Excellent momentum! Keep it up." : "Consistency is key. Try to study a little every day."}</p>
                        </div>
                    </div>
                     <div className="p-4 bg-black/30 rounded-lg">
                        <h3 className="flex items-center gap-2 font-semibold text-brand-cyan-400 mb-3"><TrophyIcon className="w-5 h-5"/> Target Guidance</h3>
                        {dailyReport.lastTest && dailyReport.lastTest.analysis ? (
                             <>
                                <p className="text-sm text-gray-300">Your last test was <strong className="text-white">"{dailyReport.lastTest.name}"</strong>.</p>
                                <div className="text-center my-4">
                                    <p className="text-gray-400">Your Score</p>
                                    <p className="text-3xl font-bold text-brand-cyan-300">{dailyReport.lastTest.analysis.marksObtained} / {dailyReport.lastTest.analysis.totalMarks}</p>
                                </div>
                                 <div className="text-center">
                                    <p className="text-gray-400">Your Target</p>
                                    <p className="text-3xl font-bold text-green-400">{targetScore} / 720</p>
                                </div>
                                <div className="text-center mt-4">
                                    <p className="text-lg font-semibold text-yellow-400">You need {Math.max(0, targetScore - (dailyReport.lastTest.analysis.marksObtained || 0))} more marks.</p>
                                    <p className="text-xs text-gray-400">Analyze your test to see where you can improve!</p>
                                </div>
                            </>
                        ) : <p className="text-sm text-gray-400">Complete a mock test and log the analysis to get personalized guidance towards your target score of <strong className="text-white">{targetScore}</strong>.</p>}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Mentor;