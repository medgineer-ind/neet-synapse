import React, { useMemo } from 'react';
import { Task, TestPlan, SubjectName, ProgressStats, ChapterStats, SubjectStats, MicrotopicStats, StudySession } from '../types';
import { Card } from './ui/StyledComponents';
import { calculateProgress, calculateOverallScore, getScoreBgClass, getScoreColorClass } from '../lib/utils';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { ActivityIcon, CheckCircleIcon, TargetIcon, ZapIcon, AtomIcon, FlaskConicalIcon, DnaIcon, LeafIcon, TrophyIcon } from './ui/Icons';
import { cn } from '../lib/utils';
import { syllabus } from '../data/syllabus';

interface SelfTrackerProps {
    tasks: Task[];
    testPlans: TestPlan[];
}

const MomentumGauge: React.FC<{ score: number }> = ({ score }) => {
    const rotation = (score / 100) * 180 - 90;
    let status = "Slowing Down";
    let statusColor = "text-red-400";
    if (score > 66) {
        status = "Accelerating";
        statusColor = "text-green-400";
    } else if (score > 33) {
        status = "Steady";
        statusColor = "text-yellow-400";
    }

    return (
        <Card className="p-6 flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold text-brand-cyan-400 mb-4 flex items-center gap-2">
                <ZapIcon className="w-6 h-6" />
                NEET Momentum
            </h2>
            <div className="relative w-64 h-32 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full border-[20px] border-slate-800 rounded-t-full border-b-0"></div>
                <div 
                    className="absolute top-0 left-0 w-full h-full rounded-t-full border-b-0 border-[20px] border-transparent"
                    style={{
                        background: 'conic-gradient(from -90deg, #ef4444, #f59e0b, #10b981 180deg)',
                        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)',
                    }}
                ></div>
                <div className="absolute top-0 left-0 w-full h-full bg-slate-900/50" style={{ clipPath: 'polygon(19px 19px, calc(100% - 19px) 19px, calc(100% - 19px) 100%, 19px 100%)', borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }}></div>
                <div 
                    className="absolute bottom-[-4px] left-1/2 w-1 h-28 bg-brand-cyan-400 rounded-t-full transition-transform duration-700 origin-bottom"
                    style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
                >
                    <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 w-4 h-4 bg-brand-cyan-400 rounded-full border-4 border-brand-blue-900"></div>
                </div>
            </div>
            <div className="text-center -mt-4">
                <p className="text-5xl font-bold text-white">{score.toFixed(0)}</p>
                <p className={cn("text-lg font-semibold", statusColor)}>{status}</p>
                <p className="text-xs text-gray-500 mt-2">Your rate of improvement over the last 14 days.</p>
            </div>
        </Card>
    );
};

const SubjectRadarChart: React.FC<{ data: any[] }> = ({ data }) => {
    return (
        <Card className="p-6">
            <h2 className="text-xl font-semibold text-brand-cyan-400 mb-4">Subject Dominance</h2>
            <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <defs>
                        <linearGradient id="colorPhysics" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
                        </linearGradient>
                         <linearGradient id="colorChemistry" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.2}/>
                        </linearGradient>
                         <linearGradient id="colorBotany" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ffc658" stopOpacity={0.2}/>
                        </linearGradient>
                         <linearGradient id="colorZoology" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff8042" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ff8042" stopOpacity={0.2}/>
                        </linearGradient>
                    </defs>
                    <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(10, 25, 47, 0.8)', border: '1px solid rgba(0, 239, 255, 0.3)', borderRadius: '0.5rem' }} />
                    <Legend iconSize={10} />
                    <Radar name="Physics" dataKey="Physics" stroke="#8884d8" fill="url(#colorPhysics)" fillOpacity={0.6} />
                    <Radar name="Chemistry" dataKey="Chemistry" stroke="#82ca9d" fill="url(#colorChemistry)" fillOpacity={0.6} />
                    <Radar name="Botany" dataKey="Botany" stroke="#ffc658" fill="url(#colorBotany)" fillOpacity={0.6} />
                    <Radar name="Zoology" dataKey="Zoology" stroke="#ff8042" fill="url(#colorZoology)" fillOpacity={0.6} />
                </RadarChart>
            </ResponsiveContainer>
        </Card>
    );
};

const Achievements: React.FC<{ achievements: any[] }> = ({ achievements }) => (
    <Card className="p-6">
        <h2 className="text-xl font-semibold text-brand-cyan-400 mb-4">Achievements & Streaks</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {achievements.map(ach => (
                <div key={ach.name} className={cn(
                    "p-3 flex flex-col items-center text-center rounded-lg transition-all duration-300",
                    ach.isUnlocked ? "bg-brand-cyan-500/10 border border-brand-cyan-500/30 shadow-glow-cyan" : "bg-slate-900/50 border border-transparent opacity-60"
                )}>
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black/30 mb-2">
                        {ach.icon}
                    </div>
                    <p className="text-xs font-bold">{ach.name}</p>
                    <p className="text-[10px] text-gray-400 leading-tight">{ach.description}</p>
                    {ach.detail && <p className="text-[10px] text-gray-500">{ach.detail}</p>}
                </div>
            ))}
        </div>
    </Card>
);

const KnowledgeNetwork: React.FC<{ progress: ProgressStats }> = ({ progress }) => {
    return (
        <Card className="p-6">
            <h2 className="text-xl font-semibold text-brand-cyan-400 mb-4">Knowledge Network</h2>
            <div className="relative w-full aspect-square bg-black/20 rounded-lg overflow-hidden">
                <div className="absolute inset-0">
                    {(Object.keys(progress.subjects) as SubjectName[]).map((subjectName, i, arr) => {
                        const angle = (i / arr.length) * 2 * Math.PI;
                        const x = 50 + 35 * Math.cos(angle);
                        const y = 50 + 35 * Math.sin(angle);
                        const subjectData = progress.subjects[subjectName];

                        const subjectIcons: Record<SubjectName, React.ReactNode> = {
                            Physics: <AtomIcon className="w-6 h-6 text-fuchsia-400" />,
                            Chemistry: <FlaskConicalIcon className="w-6 h-6 text-emerald-400" />,
                            Botany: <LeafIcon className="w-6 h-6 text-lime-400" />,
                            Zoology: <DnaIcon className="w-6 h-6 text-sky-400" />,
                        };
                        
                        return (
                            <React.Fragment key={subjectName}>
                                <div 
                                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                                    style={{ left: `${x}%`, top: `${y}%` }}
                                >
                                    {subjectIcons[subjectName]}
                                    <p className="text-xs font-bold">{subjectName}</p>
                                </div>
                                {(Object.entries(subjectData.chapters) as [string, ChapterStats][]).map(([chapterName, chapterData], chap_i, chap_arr) => {
                                    if (chapterData.completed === 0) return null;
                                    const score = calculateOverallScore(chapterData.avgDifficulty, chapterData.avgAccuracy);
                                    const chap_angle = (chap_i / chap_arr.length) * 2 * Math.PI;
                                    const chap_x = x + 10 * Math.cos(chap_angle);
                                    const chap_y = y + 10 * Math.sin(chap_angle);
                                    const size = 5 + Math.sqrt(chapterData.totalTime / 3600) * 3;

                                    return (
                                        <div 
                                            key={chapterName}
                                            title={`${chapterName} - Score: ${score.toFixed(0)}`}
                                            className={cn("absolute rounded-full transition-all duration-300 border-2", getScoreColorClass(score).replace('text', 'border'))}
                                            style={{ 
                                                left: `${chap_x}%`, 
                                                top: `${chap_y}%`,
                                                width: `${size}px`,
                                                height: `${size}px`,
                                                transform: 'translate(-50%, -50%)',
                                                backgroundColor: getScoreBgClass(score).split(' ')[0],
                                            }}
                                        />
                                    );
                                })}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
};


const SelfTracker: React.FC<SelfTrackerProps> = ({ tasks, testPlans }) => {
    
    const progressStats = useMemo(() => calculateProgress(tasks), [tasks]);

    const momentumScore = useMemo(() => {
        const now = new Date();
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

        const recentTasks = tasks.filter(t => new Date(t.date) >= fourteenDaysAgo);
        const pastTasks = tasks.filter(t => new Date(t.date) >= twentyEightDaysAgo && new Date(t.date) < fourteenDaysAgo);

        // Accuracy Momentum
        const recentPractice = recentTasks.filter(t => t.taskType === 'Practice' && t.status === 'Completed' && t.totalQuestions && t.totalQuestions > 0);
        const pastPractice = pastTasks.filter(t => t.taskType === 'Practice' && t.status === 'Completed' && t.totalQuestions && t.totalQuestions > 0);
        
        const recentAccuracy = recentPractice.length > 0 ? recentPractice.reduce((sum, t) => sum + (t.correctAnswers! / t.totalQuestions!), 0) / recentPractice.length : 0;
        const pastAccuracy = pastPractice.length > 0 ? pastPractice.reduce((sum, t) => sum + (t.correctAnswers! / t.totalQuestions!), 0) / pastPractice.length : 0;

        let accuracyRatio = 1;
        if (pastAccuracy > 0) accuracyRatio = Math.min(2, recentAccuracy / pastAccuracy);
        else if (recentAccuracy > 0) accuracyRatio = 2;

        // Study Time Momentum
        const recentTime = recentTasks.reduce((sum, t) => sum + t.sessions.reduce((sSum, s) => sSum + s.duration, 0), 0);
        const pastTime = pastTasks.reduce((sum, t) => sum + t.sessions.reduce((sSum, s) => sSum + s.duration, 0), 0);
        
        let timeRatio = 1;
        if (pastTime > 0) timeRatio = Math.min(2, recentTime / pastTime);
        else if (recentTime > 0) timeRatio = 2;

        const score = (((accuracyRatio - 1) * 0.5) + ((timeRatio - 1) * 0.5)) * 100;
        return Math.max(0, Math.min(100, score));

    }, [tasks]);

    const radarChartData = useMemo(() => {
        const metrics = ['Completion', 'Knowledge', 'Time Invested', 'Practice Accuracy', 'Test Performance'];
        const data: any[] = [];
        
        const subjectTimes = (Object.values(progressStats.subjects) as SubjectStats[]).map(s => s.totalTime);
        const maxTime = Math.max(...subjectTimes, 1);
        
        const completedTests = testPlans.filter(t => t.status === 'Completed' && t.analysis);

        metrics.forEach(metric => {
            const entry: { metric: string, [key: string]: any } = { metric };
            (Object.keys(syllabus) as SubjectName[]).forEach(subjectName => {
                const subject = progressStats.subjects[subjectName];
                let value = 0;
                switch(metric) {
                    case 'Completion': value = subject.completionRate; break;
                    case 'Knowledge': value = calculateOverallScore(subject.avgDifficulty, subject.avgAccuracy); break;
                    case 'Time Invested': value = (subject.totalTime / maxTime) * 100; break;
                    case 'Practice Accuracy': value = subject.avgAccuracy ?? 0; break;
                    case 'Test Performance': {
                        let totalPercentage = 0;
                        let count = 0;
                        completedTests.forEach(test => {
                            const perf = test.analysis?.subjectWisePerformance?.[subjectName];
                            if (perf && perf.totalQuestions > 0) {
                                totalPercentage += (perf.score / (perf.totalQuestions * 4)) * 100;
                                count++;
                            }
                        });
                        value = count > 0 ? totalPercentage / count : 0;
                        break;
                    }
                }
                entry[subjectName] = value;
            });
            data.push(entry);
        });
        return data;
    }, [progressStats, testPlans]);

    const achievements = useMemo(() => {
        const completedTasks = tasks.filter(t => t.status === 'Completed');
        const todayStr = new Date().toISOString().split('T')[0];
        
        // --- Daily Subject Completion Achievements ---
        const todayTasks = tasks.filter(t => t.date === todayStr);
        const dailyAchievements = (Object.keys(syllabus) as SubjectName[]).map(subjectName => {
            const subjectTasksToday = todayTasks.filter(t => t.subject === subjectName);
            const allCompleted = subjectTasksToday.length > 0 && subjectTasksToday.every(t => t.status === 'Completed');
            const subjectIcons = {
                Physics: <AtomIcon className="w-6 h-6 text-fuchsia-400" />,
                Chemistry: <FlaskConicalIcon className="w-6 h-6 text-emerald-400" />,
                Botany: <LeafIcon className="w-6 h-6 text-lime-400" />,
                Zoology: <DnaIcon className="w-6 h-6 text-sky-400" />,
            };
            return {
                name: `Today's ${subjectName} Finisher`,
                description: `Complete all ${subjectName} tasks today`,
                icon: subjectIcons[subjectName],
                isUnlocked: allCompleted
            };
        });

        // --- Completion Streak (All tasks on a day completed) ---
        // FIX: By providing a typed initial value, the type of the accumulator `acc` is correctly inferred.
        const tasksByDate = tasks.reduce((acc: Record<string, Task[]>, task) => {
            const dateStr = task.date;
            if (!acc[dateStr]) {
                acc[dateStr] = [];
            }
            acc[dateStr].push(task);
            return acc;
        }, {});

        const completedDays = Object.keys(tasksByDate)
            .filter((dateStr) => {
                const dayTasks = tasksByDate[dateStr];
                return dayTasks.length > 0 && dayTasks.every(t => t.status === 'Completed');
            })
            .sort();

        let completionStreak = 0;
        if (completedDays.length > 0) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            const lastCompletedDay = completedDays[completedDays.length - 1];

            // Streak is only current if the last completed day was today or yesterday
            if (lastCompletedDay === todayStr || lastCompletedDay === yesterdayStr) {
                completionStreak = 1;
                for (let i = completedDays.length - 1; i > 0; i--) {
                    const current = new Date(completedDays[i]);
                    const prev = new Date(completedDays[i - 1]);
                    const diff = (current.getTime() - prev.getTime()) / (1000 * 3600 * 24);
                    if (diff === 1) {
                        completionStreak++;
                    } else {
                        break;
                    }
                }
            }
        }
        
        // --- Study Streak (At least one task session on a day) ---
        const studyDays: string[] = [...new Set(
            completedTasks
                .reduce((acc, t) => acc.concat(t.sessions || []), [] as StudySession[])
                .map(s => s.date.split('T')[0])
        )].sort();
        let consistencyStreak = 0;
        if (studyDays.length > 0) {
            consistencyStreak = 1;
            for (let i = studyDays.length - 1; i > 0; i--) {
                const current = new Date(studyDays[i]);
                const prev = new Date(studyDays[i - 1]);
                const diff = (current.getTime() - prev.getTime()) / (1000 * 3600 * 24);
                if (diff === 1) {
                    consistencyStreak++;
                } else {
                    break;
                }
            }
        }

        // --- Accuracy Streak (High accuracy in practice) ---
        const practiceTasks = completedTasks.filter(t => t.taskType === 'Practice' && t.totalQuestions && t.totalQuestions > 0)
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let accuracyStreak = 0;
        for (let i = practiceTasks.length - 1; i >= 0; i--) {
            const task = practiceTasks[i];
            const accuracy = (task.correctAnswers! / task.totalQuestions!) * 100;
            if (accuracy >= 85) {
                accuracyStreak++;
            } else {
                break;
            }
        }

        // --- Tiered Test Titan Achievement ---
        const completedTestCount = testPlans.filter(t => t.status === 'Completed').length;
        let testTitanName = "Test Taker";
        let testTitanGoal = 1;
        let testTitanIconColor = "text-gray-600";

        if (completedTestCount >= 25) {
            testTitanName = "Test Titan";
            testTitanGoal = completedTestCount; // no more goal
            testTitanIconColor = "text-yellow-300";
        } else if (completedTestCount >= 10) {
            testTitanName = "Test Veteran";
            testTitanGoal = 25;
            testTitanIconColor = "text-slate-300";
        } else if (completedTestCount >= 5) {
            testTitanName = "Test Analyst";
            testTitanGoal = 10;
            testTitanIconColor = "text-amber-500";
        } else if (completedTestCount >= 1) {
            testTitanName = "Test Taker";
            testTitanGoal = 5;
            testTitanIconColor = "text-stone-400";
        }

        const testTitanAchievement = {
            name: `${testTitanName} (${completedTestCount})`,
            description: testTitanGoal === completedTestCount ? `Goal Reached!` : `Next: ${testTitanGoal} tests`,
            icon: <TrophyIcon className={`w-6 h-6 ${testTitanIconColor}`} />,
            isUnlocked: completedTestCount > 0
        };
        if (completedTestCount === 0) {
            testTitanAchievement.name = "Test Taker";
            testTitanAchievement.description = "Complete 1 test";
        }

        // --- Contextual Perfect Score Achievement ---
        const perfectScoreTests = testPlans.filter(t => t.status === 'Completed' && t.analysis && t.analysis.marksObtained === t.analysis.totalMarks && t.analysis.totalMarks > 0);
        const perfectScoreCount = perfectScoreTests.length;
        const mostRecentPerfectScoreTest = perfectScoreTests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        const perfectScoreAchievement = {
            name: perfectScoreCount > 1 ? `Perfect Score (x${perfectScoreCount})` : "Perfect Score",
            description: mostRecentPerfectScoreTest ? `In "${mostRecentPerfectScoreTest.name}"` : "Get 100% on a test",
            icon: <CheckCircleIcon className="w-6 h-6 text-white" />,
            isUnlocked: perfectScoreCount > 0,
            detail: mostRecentPerfectScoreTest ? `on ${new Date(new Date(mostRecentPerfectScoreTest.date).toLocaleString("en-US", { timeZone: "UTC" })).toLocaleDateString()}` : ""
        };

        return [
            ...dailyAchievements,
            { name: `${completionStreak}-Day Completion Streak`, description: "Complete all tasks on consecutive days", icon: <CheckCircleIcon className="w-6 h-6 text-brand-cyan-400" />, isUnlocked: completionStreak > 1 },
            { name: `${consistencyStreak}-Day Study Streak`, description: "Study on consecutive days", icon: <ActivityIcon className="w-6 h-6 text-yellow-400" />, isUnlocked: consistencyStreak > 1 },
            { name: "Accuracy Ace", description: `High accuracy streak (${accuracyStreak})`, icon: <TargetIcon className="w-6 h-6 text-green-400" />, isUnlocked: accuracyStreak >= 3 },
            { name: "Physics Phenom", description: "Complete Physics", icon: <AtomIcon className="w-6 h-6 text-fuchsia-400" />, isUnlocked: progressStats.subjects.Physics.completionRate === 100 },
            { name: "Chem Champion", description: "Complete Chemistry", icon: <FlaskConicalIcon className="w-6 h-6 text-emerald-400" />, isUnlocked: progressStats.subjects.Chemistry.completionRate === 100 },
            { name: "Botany Boss", description: "Complete Botany", icon: <LeafIcon className="w-6 h-6 text-lime-400" />, isUnlocked: progressStats.subjects.Botany.completionRate === 100 },
            { name: "Zoology Zenith", description: "Complete Zoology", icon: <DnaIcon className="w-6 h-6 text-sky-400" />, isUnlocked: progressStats.subjects.Zoology.completionRate === 100 },
            testTitanAchievement,
            perfectScoreAchievement,
        ].filter(Boolean);
    }, [tasks, testPlans, progressStats]);
    
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-brand-cyan-400">Self Tracker</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <MomentumGauge score={momentumScore} />
                <SubjectRadarChart data={radarChartData} />
            </div>

            <Achievements achievements={achievements} />
            
            <KnowledgeNetwork progress={progressStats} />

        </div>
    );
};

export default SelfTracker;