import React, { useMemo, useRef, useState } from 'react';
import { Task, TestPlan, SubjectName, ProgressStats, ChapterStats, MicrotopicStats, StudySession, RevisionAttempt, BreakSession, DailyLog } from '../types';
import { calculateProgress, formatDuration, calculateOverallScore, getScoreColorClass } from '../lib/utils';
import { cn } from '../lib/utils';
import { BookOpenIcon, RepeatIcon, TargetIcon, CheckCircleIcon, TrophyIcon, ClockIcon, BrainCircuitIcon, AlertTriangleIcon, ShareIcon, CopyIcon } from './ui/Icons';
import { Card, Button, Modal } from './ui/StyledComponents';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';

interface DailyReportProps {
    date: Date;
    allTasks: Task[];
    allTestPlans: TestPlan[];
    allBreakSessions: BreakSession[];
    onClose: () => void;
}

const DailyReport: React.FC<DailyReportProps> = ({ date, allTasks, allTestPlans, allBreakSessions, onClose }) => {
    const reportContentRef = useRef<HTMLDivElement>(null);
    const [isCopied, setIsCopied] = useState(false);
    const dateStr = date.toISOString().split('T')[0];
    const dailyLog = useLiveQuery(() => db.dailyLogs.get(dateStr), [dateStr]);
    const nextDayStr = useMemo(() => {
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);
        return nextDay.toISOString().split('T')[0];
    }, [date]);
    const tasksTomorrow = useLiveQuery(() => db.tasks.where('date').equals(nextDayStr).toArray(), [nextDayStr]);

    const reportData = useMemo(() => {
        const tasksToday = allTasks.filter(t => t.date === dateStr);
        const completedTasksToday = tasksToday.filter(t => t.status === 'Completed');
        const plannedTasksTodayCount = tasksToday.length;
        const testToday = allTestPlans.find(t => t.date === dateStr && t.status === 'Completed' && t.analysis);
        const breaksToday = allBreakSessions.filter(b => b.date.startsWith(dateStr));
        
        const totalStudyTime = completedTasksToday.reduce((sum, task) => sum + (task.sessions || []).reduce((sSum, s) => sSum + s.duration, 0), 0);
        const totalBreakTime = breaksToday.reduce((sum, b) => sum + b.duration, 0);
        
        const progressStats = calculateProgress(allTasks);

        const practiceStats = completedTasksToday
            .filter(t => t.taskType === 'Practice' && t.totalQuestions && t.totalQuestions > 0)
            .reduce((acc, task) => {
                acc.attempted += task.totalQuestions || 0;
                acc.correct += task.correctAnswers || 0;
                acc.incorrect += task.incorrectAnswers || 0;
                acc.tasks.push(task);
                return acc;
            }, { attempted: 0, correct: 0, incorrect: 0, tasks: [] as Task[] });
        
        const efficiencyScore = (totalStudyTime + totalBreakTime > 0) ? (totalStudyTime / (totalStudyTime + totalBreakTime)) * 100 : 0;
        
        const topicPerformance = completedTasksToday.map(task => {
            const accuracy = (task.totalQuestions && task.totalQuestions > 0 && task.correctAnswers !== undefined) ? (task.correctAnswers / task.totalQuestions) * 100 : null;
            const score = calculateOverallScore(task.difficulty || 0, accuracy);
            return { task, score };
        }).filter(item => item.score > 0);
        
        const strongTopics = topicPerformance.filter(t => t.score >= 80).slice(0, 3);
        const weakTopics = topicPerformance.filter(t => t.score < 50).slice(0, 3);

        return {
            date: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            totalStudyTime,
            plannedTasksTodayCount,
            completedTasksToday,
            tasksToday,
            progressStats,
            dailyLog,
            practiceStats,
            testToday,
            efficiencyScore,
            strongTopics,
            weakTopics,
            tasksTomorrow: tasksTomorrow || [],
        };
    }, [date, dateStr, allTasks, allTestPlans, allBreakSessions, dailyLog, tasksTomorrow]);

    const generatePlainTextReport = () => {
        const { date, totalStudyTime, plannedTasksTodayCount, completedTasksToday, tasksToday, dailyLog, practiceStats, testToday, efficiencyScore, strongTopics, weakTopics, tasksTomorrow } = reportData;
        
        const moodEmoji = ['😞', '😕', '😐', '🙂', '😄'];
        const energyEmoji = ['🪫', '🔋', '⚡️', '🚀', '🔥'];

        let report = `*~-~-~ 🚀 NEET SYNAPSE: DAILY LOG 🚀 ~-~-~*\n`;
        report += `_Generated on ${new Date().toLocaleDateString()} for ${date}_\n\n`;

        report += `*📊 KEY METRICS 📊*\n`;
        report += ` • Total Study Time: *${formatDuration(totalStudyTime)}* ⏰\n`;
        report += ` • Tasks Completed: *${completedTasksToday.length}/${plannedTasksTodayCount}* ✅\n`;
        if (dailyLog) {
            report += ` • Mood / Energy: *${moodEmoji[dailyLog.mood - 1]} / ${energyEmoji[dailyLog.energy - 1]}*\n`;
        }
        report += `\n`;

        report += `*📚 TODAY'S STUDY PLAN 📚*\n`;
        if (completedTasksToday.length > 0) {
            completedTasksToday.forEach(task => {
                report += `  ✅ *${task.name}* (${task.taskType})\n     _(${task.subject} > ${task.chapter})_ - ${formatDuration((task.sessions || []).reduce((a, b) => a + b.duration, 0))}\n`;
            });
        }
        tasksToday.filter(t => t.status === 'Pending').forEach(task => {
            report += `  ⏳ *${task.name}* _(Pending)_\n`;
        });
        if (tasksToday.length === 0) {
            report += `_No tasks were planned for today._\n`;
        }
        report += `\n`;

        if (practiceStats.attempted > 0 || testToday) {
            report += `*🎯 PRACTICE & TEST PERFORMANCE 🎯*\n`;
            if (practiceStats.attempted > 0) {
                const accuracy = (practiceStats.correct / practiceStats.attempted) * 100;
                report += ` • *Practice:* Attempted *${practiceStats.attempted} MCQs* with *${accuracy.toFixed(1)}% accuracy*.\n   (${practiceStats.correct} Correct ✅ | ${practiceStats.incorrect} Incorrect ❌)\n`;
            }
            if (testToday) {
                report += ` • *Mock Test "${testToday.name}":* Scored *${testToday.analysis!.marksObtained}/${testToday.analysis!.totalMarks}* 🏆\n`;
            }
            report += `\n`;
        }

        report += `*💡 AI INSIGHTS & RECOMMENDATIONS 💡*\n`;
        if (strongTopics.length > 0) {
            report += ` • *Strong Topics Today 💪:* ${strongTopics.map(t => t.task.name).join(', ')}\n`;
        }
        if (weakTopics.length > 0) {
            report += ` • *Topics to Revisit 🤔:* ${weakTopics.map(t => t.task.name).join(', ')}\n`;
        }
        if (strongTopics.length === 0 && weakTopics.length === 0) {
            report += ` • _No specific insights from today's performance. Keep up the great work!_\n`;
        }
        report += ` • *Recommendation:* Re-clarify concepts for weaker topics and engage in timed practice for stronger ones to boost speed.\n\n`;

        if (tasksTomorrow.length > 0) {
            report += `*🌅 PREPARING FOR TOMORROW 🌅*\n`;
            tasksTomorrow.slice(0, 3).forEach(task => {
                report += `  • *${task.name}* (${task.priority} Priority)\n`;
            });
            if (tasksTomorrow.length > 3) report += `  ...and ${tasksTomorrow.length - 3} more.\n`;
            report += `\n`;
        }

        report += `*✨ Keep pushing, future doctor! Every day counts. ✨*\n\n`;
        report += `~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~\n`;
        report += `*_Tired of messy notes and missed revisions?_* 🤔\n\n`;
        report += `*Join the revolution with NEET Synapse!* Like me, you can use this smart study planner with AI insights to supercharge your prep. And it's all offline! 🚀\n\n`;
        report += `*Get it for free and start your journey to a top rank! 👇*\n`;
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
    
    const { totalStudyTime, completedTasksToday, plannedTasksTodayCount, practiceStats, efficiencyScore, strongTopics, weakTopics, tasksTomorrow: tasksForNextDay } = reportData;
    const moodEmoji = ['😞', '😕', '😐', '🙂', '😄'];
    const energyEmoji = ['🪫', '🔋', '⚡️', '🚀', '🔥'];

    return (
        <Modal isOpen={true} onClose={onClose} title={`Daily Report: ${reportData.date}`} maxWidth="max-w-4xl">
            <div ref={reportContentRef} className="max-h-[70vh] overflow-y-auto p-1 pr-4 space-y-6">
                
                <section>
                    <h3 className="font-display text-xl font-semibold text-brand-amber-400 mb-3">📊 Basic Info</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-black/30 rounded-lg"><p className="text-xs text-gray-400">Total Study</p><p className="text-lg font-bold">{formatDuration(totalStudyTime)}</p></div>
                        <div className="p-3 bg-black/30 rounded-lg"><p className="text-xs text-gray-400">Tasks</p><p className="text-lg font-bold">{completedTasksToday.length}/{plannedTasksTodayCount}</p></div>
                        {dailyLog && <div className="p-3 bg-black/30 rounded-lg"><p className="text-xs text-gray-400">Mood</p><p className="text-2xl">{moodEmoji[dailyLog.mood - 1]}</p></div>}
                        {dailyLog && <div className="p-3 bg-black/30 rounded-lg"><p className="text-xs text-gray-400">Energy</p><p className="text-2xl">{energyEmoji[dailyLog.energy - 1]}</p></div>}
                    </div>
                </section>
                
                <section>
                    <h3 className="font-display text-xl font-semibold text-brand-amber-400 mb-3">📚 Tasks & Study Plan</h3>
                    <div className="space-y-2">
                        {completedTasksToday.length > 0 ? completedTasksToday.map(task => (
                            <div key={task.id} className="p-2 bg-black/30 rounded-lg text-sm flex justify-between items-center">
                                <span><CheckCircleIcon className="w-4 h-4 inline mr-2 text-green-400"/>{task.name} ({task.subject})</span>
                                <span className="font-mono text-xs text-gray-400">{formatDuration((task.sessions || []).reduce((a,b)=>a+b.duration, 0))}</span>
                            </div>
                        )) : <p className="text-sm text-gray-500 text-center">No tasks completed today.</p>}
                    </div>
                </section>
                
                 {(practiceStats.attempted > 0 || reportData.testToday) && (
                    <section>
                        <h3 className="font-display text-xl font-semibold text-brand-amber-400 mb-3">🎯 Practice & Test Performance</h3>
                        <div className="space-y-2 text-sm">
                            {practiceStats.attempted > 0 && <p>• Attempted <strong className="text-white">{practiceStats.attempted} questions</strong> with <strong className={cn(getScoreColorClass((practiceStats.correct / practiceStats.attempted) * 100))}>{( (practiceStats.correct / practiceStats.attempted) * 100).toFixed(1)}% accuracy</strong>.</p>}
                            {reportData.testToday && <p>• Completed Mock Test <strong className="text-white">"{reportData.testToday.name}"</strong> scoring <strong className="text-brand-amber-300">{reportData.testToday.analysis!.marksObtained}/{reportData.testToday.analysis!.totalMarks}</strong>.</p>}
                        </div>
                    </section>
                )}

                <section>
                    <h3 className="font-display text-xl font-semibold text-brand-amber-400 mb-3">⏱️ Productivity & Efficiency</h3>
                    <div className="space-y-2 text-sm">
                        <p>• Your efficiency score for today was <strong className={cn(getScoreColorClass(efficiencyScore))}>{efficiencyScore.toFixed(0)}%</strong> (study vs break time).</p>
                        {dailyLog?.distractions && <p>• Distractions Noted: <span className="text-gray-400 italic">{dailyLog.distractions}</span></p>}
                    </div>
                </section>

                <section>
                    <h3 className="font-display text-xl font-semibold text-brand-amber-400 mb-3">🧠 AI Insights</h3>
                    <div className="space-y-2 text-sm">
                        {strongTopics.length > 0 && <p>• <strong className="text-green-400">Strong Topics Today:</strong> {strongTopics.map(t => t.task.name).join(', ')}.</p>}
                        {weakTopics.length > 0 && <p>• <strong className="text-red-400">Topics to Revisit:</strong> {weakTopics.map(t => t.task.name).join(', ')}.</p>}
                        <p className="text-xs text-gray-400 mt-2 p-2 bg-black/20 rounded-md">💡 Recommendation: Solidify your understanding of weaker topics before attempting more practice. For strong topics, focus on speed and accuracy under time pressure.</p>
                    </div>
                </section>

                {tasksForNextDay.length > 0 && (
                     <section>
                        <h3 className="font-display text-xl font-semibold text-brand-amber-400 mb-3">🌅 Next Day Plan</h3>
                        <div className="space-y-2">
                             {tasksForNextDay.slice(0, 5).map(task => (
                                <div key={task.id} className="p-2 bg-black/30 rounded-lg text-sm flex justify-between items-center">
                                    <span>{task.name} ({task.subject})</span>
                                    <span className="text-xs text-gray-400">Priority: {task.priority}</span>
                                </div>
                            ))}
                            {tasksForNextDay.length > 5 && <p className="text-xs text-center text-gray-500">...and {tasksForNextDay.length - 5} more.</p>}
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

export default DailyReport;