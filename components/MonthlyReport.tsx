import React, { useMemo, useState } from 'react';
import { Task, TestPlan, BreakSession, DailyLog, SubjectName } from '../types';
import { formatDuration, calculateOverallScore, getScoreColorClass } from '../lib/utils';
import { cn } from '../lib/utils';
import { CheckCircleIcon, TrophyIcon, ClockIcon, CopyIcon, BrainCircuitIcon, TrendingUpIcon } from './ui/Icons';
import { Button, Modal } from './ui/StyledComponents';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MonthlyReportProps {
    month: string; // YYYY-MM format
    allTasks: Task[];
    allTestPlans: TestPlan[];
    allBreakSessions: BreakSession[];
    onClose: () => void;
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({ month, allTasks, allTestPlans, allBreakSessions, onClose }) => {
    const [isCopied, setIsCopied] = useState(false);

    const { startDate, endDate, monthTitle } = useMemo(() => {
        if (!month) {
            const now = new Date();
            return { startDate: now, endDate: now, monthTitle: '' };
        }
        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
        const endDate = new Date(Date.UTC(year, monthNum, 0));
        const title = startDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        return { startDate, endDate, monthTitle: title };
    }, [month]);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const reportData = useMemo(() => {
        const tasksThisMonth = allTasks.filter(t => t.date >= startStr && t.date <= endStr);
        const completedTasks = tasksThisMonth.filter(t => t.status === 'Completed');
        const testsThisMonth = allTestPlans.filter(t => t.date >= startStr && t.date <= endStr && t.status === 'Completed');

        const totalStudyTime = completedTasks.reduce((sum, task) => sum + (task.sessions || []).reduce((sSum, s) => sSum + s.duration, 0), 0);
        
        const timeBySubject = completedTasks.reduce((acc, task) => {
            const duration = (task.sessions || []).reduce((sSum, s) => sSum + s.duration, 0);
            acc[task.subject] = (acc[task.subject] || 0) + duration;
            return acc;
        }, {} as Record<SubjectName, number>);
        
        const chartData = Object.entries(timeBySubject).map(([name, time]) => ({ name, time }));
        
        const chapterScores: { name: string, subject: SubjectName, score: number }[] = [];
        const chapterGroups = completedTasks.reduce((acc, task) => {
            const key = `${task.subject} > ${task.chapter}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(task);
            return acc;
        }, {} as Record<string, Task[]>);

        (Object.entries(chapterGroups) as [string, Task[]][]).forEach(([key, tasks]) => {
            let totalDifficulty = 0, totalAccuracy = 0, diffCount = 0, accCount = 0;
            tasks.forEach(t => {
                if (t.difficulty) { totalDifficulty += t.difficulty; diffCount++; }
                if (t.totalQuestions && t.totalQuestions > 0 && t.correctAnswers !== undefined) {
                    totalAccuracy += (t.correctAnswers / t.totalQuestions) * 100;
                    accCount++;
                }
            });
            const avgDiff = diffCount > 0 ? totalDifficulty / diffCount : 0;
            const avgAcc = accCount > 0 ? totalAccuracy / accCount : null;
            const score = calculateOverallScore(avgDiff, avgAcc);
            if (score > 0) {
                const [subject, name] = key.split(' > ');
                chapterScores.push({ name, subject: subject as SubjectName, score });
            }
        });

        const strongestChapters = chapterScores.sort((a,b) => b.score - a.score).slice(0,3);

        const avgTestScore = testsThisMonth.length > 0
            ? testsThisMonth.reduce((sum, test) => {
                const analysis = test.analysis;
                if (analysis && analysis.totalMarks && analysis.totalMarks > 0) {
                    return sum + ((analysis.marksObtained || 0) / analysis.totalMarks) * 100;
                }
                return sum;
            }, 0) / testsThisMonth.length
            : 0;

        return {
            monthTitle,
            totalStudyTime,
            tasksCompletedCount: completedTasks.length,
            chartData,
            strongestChapters,
            testsThisMonth,
            avgTestScore
        };
    }, [startStr, endStr, allTasks, allTestPlans]);

    const generatePlainTextReport = () => {
        let report = `*~-~-~ 🚀 NEET SYNAPSE: MONTHLY DEBRIEF 🚀 ~-~-~*\n`;
        report += `_A review of your hard work in ${reportData.monthTitle}_\n\n`;

        report += `*📊 MONTHLY OVERVIEW 📊*\n`;
        report += ` • Total Study Time: *${formatDuration(reportData.totalStudyTime)}* 🗓️\n`;
        report += ` • Total Tasks Completed: *${reportData.tasksCompletedCount}* ✅\n\n`;

        report += `*📚 SUBJECT FOCUS (Time Spent) 📚*\n`;
        reportData.chartData.forEach(({ name, time }) => {
            report += `  • *${name}:* ${formatDuration(time)}\n`;
        });
        report += `\n`;

        if (reportData.strongestChapters.length > 0) {
            report += `*🏆 TOP PERFORMING CHAPTERS 🏆*\n`;
            report += `_You've mastered these chapters this month:_\n`;
            reportData.strongestChapters.forEach(chapter => {
                report += `  • *${chapter.name}* (${chapter.subject}) - _Score: ${chapter.score.toFixed(0)}/100_\n`;
            });
            report += `\n`;
        }

        if (reportData.testsThisMonth.length > 0) {
            report += `*🎯 TEST PERFORMANCE 🎯*\n`;
            report += ` • *Average Score:* An impressive *${reportData.avgTestScore.toFixed(1)}%* across *${reportData.testsThisMonth.length} test(s)*.\n\n`;
        }

        report += `*💡 RECOMMENDATION FOR NEXT MONTH 💡*\n`;
        report += `_This month's data shows your dedication! Analyze your time distribution. Are you neglecting any subjects? Use your strongest chapters as a model for how to approach weaker ones. Plan for regular mock tests to track progress. Keep building on this foundation!_\n\n`;

        report += `*✨ Every month brings you one step closer to your dream. ✨*\n\n`;
        report += `~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~\n`;
        report += `*_This is what a planned, data-driven NEET preparation looks like._* 😎\n\n`;
        report += `*Stop guessing, start analyzing with NEET Synapse!* Get your own AI Mentor, detailed reports, and a smart planner that works completely offline. 🚀\n\n`;
        report += `*It's free, and it's built for future toppers. Are you one? 👇*\n`;
        report += `*https://neetsynapse.vercel.app*\n\n`;
        report += `_Crafted with ❤️ by medgineer for future doctors._\n`;
        report += `*Connect with us:*\n`;
        report += ` • Telegram: https://t.me/medgineer\n`;
        report += ` • Instagram: https://www.instagram.com/medgineer.ind\n`;
        report += ` • YouTube: https://youtube.com/@medgineer-ind`;
        return report;
    };


    const handleCopy = () => {
        const reportText = generatePlainTextReport();
        navigator.clipboard.writeText(reportText).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    
    const subjectColors: Record<SubjectName, string> = {
        Physics: '#a855f7',
        Chemistry: '#22c55e',
        Botany: '#84cc16',
        Zoology: '#38bdf8',
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Monthly Report: ${reportData.monthTitle}`} maxWidth="max-w-4xl">
            <div className="max-h-[70vh] overflow-y-auto p-1 pr-4 space-y-6">
                <section>
                    <h3 className="font-display text-xl font-semibold text-brand-amber-400 mb-3">📊 Monthly Overview</h3>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-3 bg-black/30 rounded-lg"><p className="text-xs text-gray-400">Total Study Time</p><p className="text-2xl font-bold">{formatDuration(reportData.totalStudyTime)}</p></div>
                        <div className="p-3 bg-black/30 rounded-lg"><p className="text-xs text-gray-400">Tasks Completed</p><p className="text-2xl font-bold">{reportData.tasksCompletedCount}</p></div>
                    </div>
                </section>
                
                <section>
                    <h3 className="font-display text-xl font-semibold text-brand-amber-400 mb-3">📚 Subject Focus (Time Spent)</h3>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <BarChart data={reportData.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis tickFormatter={(tick) => `${(tick / 3600).toFixed(0)}h`} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(251, 191, 36, 0.3)' }} formatter={(value: number) => formatDuration(value)} />
                                <Bar dataKey="time" radius={[4, 4, 0, 0]}>
                                    {reportData.chartData.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={subjectColors[entry.name as SubjectName] || '#8884d8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section>
                    <h3 className="font-display text-xl font-semibold text-brand-amber-400 mb-3">🏆 Top Performing Chapters</h3>
                    <div className="space-y-2">
                        {reportData.strongestChapters.map(chapter => (
                             <div key={chapter.name} className="p-2 bg-black/30 rounded-lg text-sm flex justify-between items-center">
                                <span><TrendingUpIcon className="w-4 h-4 inline mr-2 text-green-400"/>{chapter.name} ({chapter.subject})</span>
                                <span className={cn("font-mono text-xs font-bold", getScoreColorClass(chapter.score))}>{chapter.score.toFixed(0)}/100</span>
                            </div>
                        ))}
                    </div>
                </section>
                
                {reportData.testsThisMonth.length > 0 && (
                    <section>
                        <h3 className="font-display text-xl font-semibold text-brand-amber-400 mb-3">🎯 Test Performance</h3>
                         <div className="p-3 bg-black/30 rounded-lg text-center">
                            <p className="text-xs text-gray-400">Average Test Score</p>
                            <p className={cn("text-2xl font-bold", getScoreColorClass(reportData.avgTestScore))}>{reportData.avgTestScore.toFixed(1)}%</p>
                            <p className="text-xs text-gray-500">across {reportData.testsThisMonth.length} test(s)</p>
                        </div>
                    </section>
                )}
                <footer className="text-center pt-4 border-t border-white/10">
                    <p className="font-bold text-brand-amber-400">Ready to supercharge your NEET prep like this?</p>
                    <p className="text-sm text-gray-300 mt-1">Join NEET Synapse, the ultimate offline study planner, and share your progress with friends!</p>
                    <a href="https://neetsynapse.vercel.app" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline my-2 block">
                        https://neetsynapse.vercel.app
                    </a>
                    <p className="text-xs text-gray-500 mt-2">
                        Made with ❤️ by medgineer. Connect: 
                        <a href="https://t.me/medgineer" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400"> Telegram</a> |
                        <a href="https://www.instagram.com/medgineer.ind?igsh=YzljYTk1ODg3Zg==" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400"> Instagram</a> |
                        <a href="https://youtube.com/@medgineer-ind?si=QOiBLWvUIx1VVpSm" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400"> YouTube</a>
                    </p>
                </footer>
            </div>
             <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
                <Button type="button" onClick={handleCopy}>
                    {isCopied ? 'Copied!' : <><CopyIcon className="w-5 h-5"/> Copy Report</>}
                </Button>
            </div>
        </Modal>
    )
};

export default MonthlyReport;