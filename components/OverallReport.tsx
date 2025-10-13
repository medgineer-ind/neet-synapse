import React, { useMemo, useState } from 'react';
import { Task, TestPlan, BreakSession, SubjectName, ChapterStats } from '../types';
import { formatDuration, calculateProgress, calculateOverallScore, getScoreColorClass } from '../lib/utils';
import { cn } from '../lib/utils';
import { CopyIcon, TrendingUpIcon, TrendingDownIcon, ActivityIcon, ClockIcon, CheckCircleIcon, TargetIcon, TrophyIcon } from './ui/Icons';
import { Button, Modal } from './ui/StyledComponents';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface OverallReportProps {
    allTasks: Task[];
    allTestPlans: TestPlan[];
    allBreakSessions: BreakSession[];
    onClose: () => void;
}

const OverallReport: React.FC<OverallReportProps> = ({ allTasks, allTestPlans, allBreakSessions, onClose }) => {
    const [isCopied, setIsCopied] = useState(false);

    const reportData = useMemo(() => {
        const progressStats = calculateProgress(allTasks);
        const completedTasks = allTasks.filter(t => t.status === 'Completed');
        
        const totalPracticeQs = progressStats.totalQuestions;
        const totalCorrectQs = progressStats.totalCorrect;
        const overallAccuracy = totalPracticeQs > 0 ? (totalCorrectQs / totalPracticeQs) * 100 : 0;
        
        const completedTests = allTestPlans.filter(t => t.status === 'Completed' && t.analysis);
        const avgTestScore = completedTests.length > 0 ? 
            completedTests.reduce((sum, test) => {
                const analysis = test.analysis;
                if (analysis && analysis.totalMarks && analysis.totalMarks > 0) {
                    return sum + ((analysis.marksObtained || 0) / analysis.totalMarks) * 100;
                }
                return sum;
            }, 0) / completedTests.length
            : 0;

        const allChapterScores: { name: string, subject: SubjectName, score: number }[] = [];
        (Object.keys(progressStats.subjects) as SubjectName[]).forEach(subjectName => {
            const subject = progressStats.subjects[subjectName];
            Object.entries(subject.chapters).forEach(([chapterName, chapterData]) => {
                const score = calculateOverallScore((chapterData as ChapterStats).avgDifficulty, (chapterData as ChapterStats).avgAccuracy);
                if(score > 0) {
                    allChapterScores.push({ name: chapterName, subject: subjectName, score });
                }
            });
        });

        const strongestChapters = [...allChapterScores].sort((a,b) => b.score - a.score).slice(0, 5);
        const weakestChapters = [...allChapterScores].sort((a,b) => a.score - b.score).slice(0, 5);
        
        const uniqueStudyDays = new Set(completedTasks.flatMap(task => (task.sessions || []).map(s => s.date.split('T')[0]))).size;

        const subjectPerformanceData = (Object.keys(progressStats.subjects) as SubjectName[]).map(subjectName => {
            const subject = progressStats.subjects[subjectName];
            return {
                name: subjectName,
                "Knowledge Score": calculateOverallScore(subject.avgDifficulty, subject.avgAccuracy),
                "Completion %": subject.completionRate
            };
        });

        return {
            totalStudyTime: progressStats.totalTimeStudied,
            totalTasks: allTasks.length,
            completedTasks: completedTasks.length,
            uniqueStudyDays,
            totalPracticeQs,
            overallAccuracy,
            completedTestsCount: completedTests.length,
            avgTestScore,
            strongestChapters,
            weakestChapters,
            subjectPerformanceData
        };
    }, [allTasks, allTestPlans, allBreakSessions]);
    
    const generatePlainTextReport = () => {
        let report = `*~-~-~ 🚀 NEET SYNAPSE: OVERALL PREPARATION REPORT 🚀 ~-~-~*\n`;
        report += `_Your complete journey towards NEET, summarized._\n\n`;
    
        report += `*🏆 GRAND SUMMARY 🏆*\n`;
        report += ` • Total Study Time: *${formatDuration(reportData.totalStudyTime)}*\n`;
        report += ` • Total Tasks Completed: *${reportData.completedTasks}/${reportData.totalTasks}*\n`;
        report += ` • Total Study Days: *${reportData.uniqueStudyDays}*\n`;
        report += ` • Total MCQs Practiced: *${reportData.totalPracticeQs}*\n`;
        report += ` • Overall Accuracy: *${reportData.overallAccuracy.toFixed(1)}%*\n`;
        report += ` • Mock Tests Completed: *${reportData.completedTestsCount}*\n`;
        report += ` • Average Test Score: *${reportData.avgTestScore.toFixed(1)}%*\n\n`;
    
        report += `*🧠 KNOWLEDGE DEEP-DIVE 🧠*\n`;
        report += `_Your strongest and weakest chapters across all subjects._\n`;
        if (reportData.strongestChapters.length > 0) {
            report += ` • *Strongest Chapters 💪:*\n`;
            reportData.strongestChapters.forEach(c => {
                report += `    - ${c.name} (${c.subject}) - Score: ${c.score.toFixed(0)}/100\n`;
            });
        }
        if (reportData.weakestChapters.length > 0) {
            report += `\n • *Chapters to Fortify 🤔:*\n`;
            reportData.weakestChapters.forEach(c => {
                report += `    - ${c.name} (${c.subject}) - Score: ${c.score.toFixed(0)}/100\n`;
            });
        }
        report += `\n`;
    
        report += `*💡 FINAL RECOMMENDATION 💡*\n`;
        report += `_This is a marathon, not a sprint. You've built a strong foundation. Now, systematically turn your weakest areas into strengths. Dedicate specific revision cycles to them, followed by targeted practice. Keep taking mock tests to simulate exam conditions and track your improvement. You're on the right path!_\n\n`;
    
        report += `*✨ The dream of a white coat is closer than you think. Stay focused! ✨*\n\n`;
        report += `~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~\n`;
        report += `*_This comprehensive analysis is powered by YOUR data._* 🚀\n\n`;
        report += `*Want to give your friends the same strategic advantage? Tell them about NEET Synapse!* The ultimate offline planner for serious aspirants.\n\n`;
        report += `*Get it for free and conquer NEET together! 👇*\n`;
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
        <Modal isOpen={true} onClose={onClose} title="Overall Preparation Report" maxWidth="max-w-4xl">
            <div className="max-h-[70vh] overflow-y-auto p-1 pr-4 space-y-6">
                <section>
                    <h3 className="font-display text-xl font-semibold text-brand-amber-400 mb-3">🏆 Grand Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-black/30 rounded-lg"><p className="text-xs text-gray-400">Total Study</p><p className="text-lg font-bold">{formatDuration(reportData.totalStudyTime)}</p></div>
                        <div className="p-3 bg-black/30 rounded-lg"><p className="text-xs text-gray-400">Tasks Completed</p><p className="text-lg font-bold">{reportData.completedTasks}/{reportData.totalTasks}</p></div>
                        <div className="p-3 bg-black/30 rounded-lg"><p className="text-xs text-gray-400">Total Study Days</p><p className="text-lg font-bold">{reportData.uniqueStudyDays}</p></div>
                        <div className="p-3 bg-black/30 rounded-lg"><p className="text-xs text-gray-400">Avg. Test Score</p><p className="text-lg font-bold">{reportData.avgTestScore.toFixed(1)}%</p></div>
                    </div>
                </section>

                <section>
                    <h3 className="font-display text-xl font-semibold text-brand-amber-400 mb-3">📚 Subject Performance</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={reportData.subjectPerformanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(251, 191, 36, 0.3)' }} cursor={{fill: 'rgba(251, 191, 36, 0.1)'}}/>
                                <Legend />
                                <Bar dataKey="Knowledge Score" fill="#FBBF24" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Completion %" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section>
                    <h3 className="font-display text-xl font-semibold text-brand-amber-400 mb-3">🧠 Knowledge Highlights</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-green-400 mb-2">Top 5 Strongest Chapters</h4>
                            <div className="space-y-2">
                                {reportData.strongestChapters.map(chapter => (
                                     <div key={chapter.name} className="p-2 bg-black/30 rounded-lg text-sm flex justify-between items-center">
                                        <span><TrendingUpIcon className="w-4 h-4 inline mr-2"/>{chapter.name} <span className="text-xs text-gray-400">({chapter.subject})</span></span>
                                        <span className={cn("font-mono text-xs font-bold", getScoreColorClass(chapter.score))}>{chapter.score.toFixed(0)}/100</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div>
                            <h4 className="font-semibold text-red-400 mb-2">Top 5 Weakest Chapters</h4>
                            <div className="space-y-2">
                                {reportData.weakestChapters.map(chapter => (
                                     <div key={chapter.name} className="p-2 bg-black/30 rounded-lg text-sm flex justify-between items-center">
                                        <span><TrendingDownIcon className="w-4 h-4 inline mr-2"/>{chapter.name} <span className="text-xs text-gray-400">({chapter.subject})</span></span>
                                        <span className={cn("font-mono text-xs font-bold", getScoreColorClass(chapter.score))}>{chapter.score.toFixed(0)}/100</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
                
                <footer className="text-center pt-4 border-t border-white/10">
                    <p className="font-bold text-brand-amber-400">This comprehensive analysis is powered by YOUR data.</p>
                    <p className="text-sm text-gray-300 mt-1">Want to give your friends the same strategic advantage? Tell them about NEET Synapse!</p>
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

export default OverallReport;