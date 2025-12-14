
import React, { useMemo, useState } from 'react';
import { Task, TestPlan, BreakSession, DailyLog } from '../types';
import { formatDuration, calculateOverallScore, getScoreColorClass } from '../lib/utils';
import { cn } from '../lib/utils';
import { CheckCircleIcon, TrophyIcon, ClockIcon, CopyIcon, BrainCircuitIcon, TargetIcon, RepeatIcon } from './ui/Icons';
import { Button, Modal } from './ui/StyledComponents';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';

interface WeeklyReportProps {
    week: string; // YYYY-Www format
    allTasks: Task[];
    allTestPlans: TestPlan[];
    allBreakSessions: BreakSession[];
    onClose: () => void;
}

function getWeekDateRange(weekString: string) {
    if (!weekString || !weekString.includes('-W')) {
        const now = new Date();
        return { startDate: now, endDate: now, weekNumber: 0, year: now.getFullYear() };
    }
    const parts = weekString.split('-W');
    const year = Number(parts[0]);
    const week = Number(parts[1]);
    
    // Jan 4th is always in week 1
    const jan4 = new Date(Date.UTC(year, 0, 4));
    
    // Get the first day of week 1 (Monday)
    const firstDayOfWeek1 = new Date(jan4.getTime());
    firstDayOfWeek1.setUTCDate(jan4.getUTCDate() - (jan4.getUTCDay() + 6) % 7);
    
    // Calculate the start date of the target week
    const startDate = new Date(firstDayOfWeek1.getTime());
    startDate.setUTCDate(firstDayOfWeek1.getUTCDate() + (week - 1) * 7);
    
    const endDate = new Date(startDate.getTime());
    endDate.setUTCDate(startDate.getUTCDate() + 6);

    return { startDate, endDate, weekNumber: week, year };
}

const WeeklyReport: React.FC<WeeklyReportProps> = ({ week, allTasks, allTestPlans, allBreakSessions, onClose }) => {
    const [isCopied, setIsCopied] = useState(false);
    
    const { startDate, endDate, weekNumber, year } = useMemo(() => getWeekDateRange(week), [week]);
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    const dailyLogsThisWeek = useLiveQuery(() => db.dailyLogs.where('date').between(startStr, endStr, true, true).toArray(), [startStr, endStr]);

    const reportData = useMemo(() => {
        const tasksThisWeek = allTasks.filter(t => t.date >= startStr && t.date <= endStr);
        const completedTasks = tasksThisWeek.filter(t => t.status === 'Completed');
        const testsThisWeek = allTestPlans.filter(t => t.date >= startStr && t.date <= endStr && t.status === 'Completed');
        const breaksThisWeek = allBreakSessions.filter(b => {
            const bDate = new Date(b.date);
            // Explicit numeric comparison to avoid TS error about arithmetic operations on dates
            return bDate.getTime() >= startDate.getTime() && bDate.getTime() <= endDate.getTime();
        });

        const totalStudyTime = completedTasks.reduce((sum: number, task) => sum + (task.sessions || []).reduce((sSum: number, s) => sSum + s.duration, 0), 0);
        const totalBreakTime = breaksThisWeek.reduce((sum: number, b) => sum + b.duration, 0);
        const efficiencyScore = (totalStudyTime + totalBreakTime > 0) ? (totalStudyTime / (totalStudyTime + totalBreakTime)) * 100 : 0;
        
        const avgMood = dailyLogsThisWeek && dailyLogsThisWeek.length > 0 ? dailyLogsThisWeek.reduce((sum: number, log) => sum + log.mood, 0) / dailyLogsThisWeek.length : 0;
        const avgEnergy = dailyLogsThisWeek && dailyLogsThisWeek.length > 0 ? dailyLogsThisWeek.reduce((sum: number, log) => sum + log.energy, 0) / dailyLogsThisWeek.length : 0;

        const practiceStats = completedTasks.filter(t => t.taskType === 'Practice' && t.totalQuestions).reduce((acc, task) => {
            acc.attempted += task.totalQuestions!;
            acc.correct += task.correctAnswers || 0;
            return acc;
        }, { attempted: 0, correct: 0 });

        const chapterSummary = completedTasks.reduce((acc, task) => {
            const key = `${task.subject} > ${task.chapter}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const mostStudiedChapters = Object.entries(chapterSummary).sort((a, b) => b[1] - a[1]).slice(0, 3);
        
        return {
            weekTitle: `Week ${weekNumber}, ${year}`,
            dateRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
            totalStudyTime,
            tasksCompletedCount: completedTasks.length,
            tasksPlannedCount: tasksThisWeek.length,
            avgMood, avgEnergy,
            practiceStats,
            testsThisWeek,
            efficiencyScore,
            mostStudiedChapters,
            completedTasks
        };
    }, [startDate, endDate, startStr, endStr, allTasks, allTestPlans, allBreakSessions, dailyLogsThisWeek, weekNumber, year]);
    
    const generatePlainTextReport = () => {
        let report = `*~-~-~ 🚀 NEET SYNAPSE: WEEKLY REVIEW 🚀 ~-~-~*\n`;
        report += `_Summary for ${reportData.weekTitle} (${reportData.dateRange})_\n\n`;

        report += `*📊 WEEKLY SUMMARY 📊*\n`;
        report += ` • Total Study Time: *${formatDuration(reportData.totalStudyTime)}* ⏰\n`;
        report += ` • Tasks Completed: *${reportData.tasksCompletedCount}/${reportData.tasksPlannedCount}* ✅\n`;
        if (reportData.avgMood > 0) {
            report += ` • Average Mood: *${'★'.repeat(Math.round(reportData.avgMood))}* | Average Energy: *${'⚡️'.repeat(Math.round(reportData.avgEnergy))}*\n`;
        }
        report += `\n`;

        report += `*📚 STUDY FOCUS 📚*\n`;
        report += `_You dedicated the most time to these chapters:_\n`;
        reportData.mostStudiedChapters.forEach(([chapter, count]) => {
            report += `  • *${chapter}* (${count} tasks)\n`;
        });
        report += `\n`;

        if (reportData.practiceStats.attempted > 0 || reportData.testsThisWeek.length > 0) {
            report += `*🎯 PERFORMANCE INSIGHTS 🎯*\n`;
            if (reportData.practiceStats.attempted > 0) {
                const accuracy = (reportData.practiceStats.correct / reportData.practiceStats.attempted) * 100;
                report += ` • *Practice Accuracy:* A solid *${accuracy.toFixed(1)}%* across *${reportData.practiceStats.attempted} questions* this week.\n`;
            }
            reportData.testsThisWeek.forEach(test => {
                report += ` • *Mock Test "${test.name}":* Scored *${test.analysis!.marksObtained}/${test.analysis!.totalMarks}* 🏆\n`;
            });
            report += `\n`;
        }

        report += `*💡 RECOMMENDATION FOR NEXT WEEK 💡*\n`;
        report += `_Great work this week! Review your performance. Did you balance your subjects well? Plan the upcoming week to reinforce your weak areas while consistently revising your strong ones. Momentum is everything!_\n\n`;

        report += `*✨ Consistency is your superpower! Keep it going! ✨*\n\n`;
        report += `~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~\n`;
        report += `*_Want to make every week count towards your dream medical college?_* 🤔\n\n`;
        report += `*Switch to NEET Synapse!* Track your progress with detailed reports just like this one, get AI-powered insights, and never miss a revision again. All 100% offline! 🚀\n\n`;
        report += `*Download for free and transform your preparation! 👇*\n`;
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

    return (
        <Modal isOpen={true} onClose={onClose} title={`Weekly Report: ${reportData.weekTitle}`} maxWidth="max-w-4xl">
            <div className="max-h-[70vh] overflow-y-auto p-1 pr-4 space-y-6">
                 <section>
                    <h3 className="font-display text-xl font-semibold text-brand-amber-400 mb-3">📊 Weekly Summary</h3>
                     <p className="text-sm text-gray-400 mb-3">{reportData.dateRange}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-black/30 rounded-lg"><p className="text-xs text-gray-400">Total Study</p><p className="text-lg font-bold">{formatDuration(reportData.totalStudyTime)}</p></div>
                        <div className="p-3 bg-black/30 rounded-lg"><p className="text-xs text-gray-400">Tasks</p><p className="text-lg font-bold">{reportData.tasksCompletedCount}/{reportData.tasksPlannedCount}</p></div>
                        {reportData.avgMood > 0 && <div className="p-3 bg-black/30 rounded-lg"><p className="text-xs text-gray-400">Avg. Mood</p><p className="text-2xl">{'★'.repeat(Math.round(reportData.avgMood))}</p></div>}
                        {reportData.avgEnergy > 0 && <div className="p-3 bg-black/30 rounded-lg"><p className="text-xs text-gray-400">Avg. Energy</p><p className="text-2xl">{'⚡️'.repeat(Math.round(reportData.avgEnergy))}</p></div>}
                    </div>
                </section>
                
                <section>
                    <h3 className="font-display text-xl font-semibold text-brand-amber-400 mb-3">📚 Study Focus</h3>
                    <p className="text-sm text-gray-400 mb-2">You spent the most time on these chapters:</p>
                    <div className="space-y-2">
                        {reportData.mostStudiedChapters.map(([chapter, count]) => (
                            <div key={chapter} className="p-2 bg-black/30 rounded-lg text-sm flex justify-between items-center">
                                <span><BrainCircuitIcon className="w-4 h-4 inline mr-2 text-cyan-400"/>{chapter}</span>
                                <span className="font-mono text-xs text-gray-400">{count} tasks</span>
                            </div>
                        ))}
                    </div>
                </section>
                
                 {(reportData.practiceStats.attempted > 0 || reportData.testsThisWeek.length > 0) && (
                    <section>
                        <h3 className="font-display text-xl font-semibold text-brand-amber-400 mb-3">🎯 Performance Insights</h3>
                        <div className="space-y-2 text-sm">
                            {reportData.practiceStats.attempted > 0 && <p>• Your average practice accuracy was <strong className={cn(getScoreColorClass((reportData.practiceStats.correct / reportData.practiceStats.attempted) * 100))}>{( (reportData.practiceStats.correct / reportData.practiceStats.attempted) * 100).toFixed(1)}%</strong> across {reportData.practiceStats.attempted} questions.</p>}
                            {reportData.testsThisWeek.map(test => (
                                <p key={test.id}>• Completed Mock Test <strong className="text-white">"{test.name}"</strong> scoring <strong className="text-brand-amber-300">{test.analysis!.marksObtained}/{test.analysis!.totalMarks}</strong>.</p>
                            ))}
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
    );
};

export default WeeklyReport;
