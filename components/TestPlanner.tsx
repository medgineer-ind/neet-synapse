import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { TestPlan, SubjectName, AnalyzedTopic, Task, TopicStatus, TestPlanAnalysis, TopicPracticeAttempt, ProgressStats, ActiveTimer, SubjectTestPerformance, ChapterStats, MicrotopicStats } from '../types';
import { syllabus } from '../data/syllabus';
import { cn, calculateProgress, analyzeSyllabusForTest, formatDuration, calculateOverallScore, getScoreColorClass } from '../lib/utils';
import { PlusIcon, Trash2Icon, BrainIcon, ClipboardCheckIcon, ClockIcon, RepeatIcon, TargetIcon, TrophyIcon, AtomIcon, FlaskConicalIcon, LeafIcon, DnaIcon, ChevronDownIcon, TrendingUpIcon } from './ui/Icons';
import { Card, Button, Input, Modal } from './ui/StyledComponents';
import { TimeEditor } from './ui/TimeEditor';

// --- New Test Planner Components ---

const TopicAnalysis: React.FC<{ weakTopics: AnalyzedTopic[]; averageTopics: AnalyzedTopic[]; strongTopics: AnalyzedTopic[] }> = ({ weakTopics, averageTopics, strongTopics }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
            <h4 className="font-semibold text-red-400 mb-2">Weak Topics</h4>
            {weakTopics.length > 0 ? (
                <ul className="text-xs space-y-2 max-h-48 overflow-y-auto pr-2">
                    {weakTopics.map(t => <li key={t.microtopic} className="p-2 bg-red-500/10 rounded-md"><strong>{t.microtopic}</strong> <br /> ({t.subject} &gt; {t.chapter}) <br /> <span className="text-red-300">Score: {t.overallScore.toFixed(0)}</span></li>)}
                </ul>
            ) : <p className="text-xs text-gray-400">No specific weak topics found.</p>}
        </div>
        <div>
            <h4 className="font-semibold text-yellow-400 mb-2">Average Topics</h4>
            {averageTopics.length > 0 ? (
                <ul className="text-xs space-y-2 max-h-48 overflow-y-auto pr-2">
                    {averageTopics.map(t => <li key={t.microtopic} className="p-2 bg-yellow-500/10 rounded-md"><strong>{t.microtopic}</strong> <br /> ({t.subject} &gt; {t.chapter}) <br /> <span className="text-yellow-300">Score: {t.overallScore.toFixed(0)}</span></li>)}
                </ul>
            ) : <p className="text-xs text-gray-400">No average topics found.</p>}
        </div>
        <div>
            <h4 className="font-semibold text-green-400 mb-2">Strong Topics</h4>
            {strongTopics.length > 0 ? (
                <ul className="text-xs space-y-2 max-h-48 overflow-y-auto pr-2">
                    {strongTopics.map(t => <li key={t.microtopic} className="p-2 bg-green-500/10 rounded-md"><strong>{t.microtopic}</strong> <br /> ({t.subject} &gt; {t.chapter}) <br /> <span className="text-green-300">Score: {t.overallScore.toFixed(0)}</span></li>)}
                </ul>
            ) : <p className="text-xs text-gray-400">Not enough data to determine strong topics.</p>}
        </div>
    </div>
);


const CreateTestModal: React.FC<{ isOpen: boolean; onClose: () => void; onAddTest: (test: Omit<TestPlan, 'id'|'status'>) => void; tasks: Task[] }> = ({ isOpen, onClose, onAddTest, tasks }) => {
    const [name, setName] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [totalQuestions, setTotalQuestions] = useState('');
    const [selectedSyllabus, setSelectedSyllabus] = useState<TestPlan['syllabus']>({});
    
    const progressStats = useMemo(() => calculateProgress(tasks), [tasks]);
    const { weakTopics, averageTopics, strongTopics } = useMemo(() => analyzeSyllabusForTest(selectedSyllabus, progressStats), [selectedSyllabus, progressStats]);

    const handleChapterToggle = (subject: SubjectName, chapter: string) => {
        setSelectedSyllabus(prev => {
            const newSyllabus = { ...prev };
            const subjectChapters = newSyllabus[subject] || [];
            if (subjectChapters.includes(chapter)) {
                newSyllabus[subject] = subjectChapters.filter(c => c !== chapter);
                if (newSyllabus[subject]?.length === 0) {
                    delete newSyllabus[subject];
                }
            } else {
                newSyllabus[subject] = [...subjectChapters, chapter];
            }
            return newSyllabus;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || Object.keys(selectedSyllabus).length === 0 || !totalQuestions) {
            alert('Please provide a test name, total questions, and select at least one chapter.');
            return;
        }
        
        const topicStatus: TopicStatus[] = [];
        (Object.keys(selectedSyllabus) as SubjectName[]).forEach(subject => {
            selectedSyllabus[subject]?.forEach(chapter => {
                syllabus[subject][chapter].forEach(microtopic => {
                    topicStatus.push({
                        subject,
                        chapter,
                        microtopic,
                        practiceAttempts: [],
                    });
                });
            });
        });

        onAddTest({ name, date, syllabus: selectedSyllabus, topicStatus, totalQuestions: Number(totalQuestions) });
        // Reset form
        setName('');
        setDate(new Date().toISOString().split('T')[0]);
        setTotalQuestions('');
        setSelectedSyllabus({});
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Plan a New Test">
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-2">
                        <Input type="text" placeholder="Test Name (e.g., Mock Test 1)" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <Input type="number" placeholder="Total Questions (e.g., 200)" value={totalQuestions} onChange={e => setTotalQuestions(e.target.value)} min="1" required />
                    <div className="md:col-span-3">
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                </div>
                
                <h3 className="font-semibold text-brand-cyan-400 mb-2">Select Syllabus</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-h-60 overflow-y-auto p-2 bg-black/20 rounded-md">
                    {(Object.keys(syllabus) as SubjectName[]).map(subject => (
                        <div key={subject}>
                            <h4 className="font-bold mb-2">{subject}</h4>
                            <div className="space-y-1">
                                {Object.keys(syllabus[subject]).map(chapter => (
                                    <label key={chapter} className="flex items-center text-sm cursor-pointer">
                                        <input type="checkbox"
                                            className="mr-2 form-checkbox h-4 w-4 text-brand-cyan-500 bg-gray-800 border-gray-600 rounded focus:ring-brand-cyan-500 focus:ring-offset-0"
                                            checked={selectedSyllabus[subject]?.includes(chapter) || false}
                                            onChange={() => handleChapterToggle(subject, chapter)}
                                        />
                                        {chapter}
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {Object.keys(selectedSyllabus).length > 0 && <div className="mt-4"><TopicAnalysis weakTopics={weakTopics} averageTopics={averageTopics} strongTopics={strongTopics} /></div>}
                
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary">Create Test</Button>
                </div>
            </form>
        </Modal>
    );
};

const TestAnalysisModal: React.FC<{ test: TestPlan | null, initialDuration: number, onClose: () => void, onComplete: (id: string, analysis: TestPlanAnalysis) => void }> = ({ test, initialDuration, onClose, onComplete }) => {
    const [subjectData, setSubjectData] = useState<Record<string, { total: string, correct: string, incorrect: string }>>({});
    const [rank, setRank] = useState('');
    const [percentile, setPercentile] = useState('');
    const [notes, setNotes] = useState('');
    const [duration, setDuration] = useState(initialDuration);

    useEffect(() => {
        setDuration(initialDuration);
        setRank('');
        setPercentile('');
        setNotes('');
        if (test?.syllabus) {
            const initialData = (Object.keys(test.syllabus) as SubjectName[]).reduce((acc, subject) => {
                acc[subject] = { total: '', correct: '', incorrect: '' };
                return acc;
            }, {} as Record<string, { total: string; correct: string; incorrect: string }>);
            setSubjectData(initialData);
        }
    }, [initialDuration, test]);

    const handleSubjectDataChange = (subject: SubjectName, field: 'total' | 'correct' | 'incorrect', value: string) => {
        setSubjectData(prev => ({
            ...prev,
            [subject]: { ...prev[subject], [field]: value }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!test) return;

        let totalMarksObtained = 0;
        let totalPossibleMarks = 0;
        const performance: { [key in SubjectName]?: SubjectTestPerformance } = {};

        for (const subject in subjectData) {
            const data = subjectData[subject];
            const totalNum = Number(data.total);
            const correctNum = Number(data.correct);
            const incorrectNum = Number(data.incorrect);

            if (isNaN(totalNum) || isNaN(correctNum) || isNaN(incorrectNum) || totalNum < 0 || correctNum < 0 || incorrectNum < 0) {
                alert(`Please enter valid numbers for ${subject}.`);
                return;
            }
            if ((correctNum + incorrectNum) > totalNum) {
                alert(`For ${subject}, the sum of correct and incorrect answers cannot exceed the total questions.`);
                return;
            }

            const skipped = totalNum - (correctNum + incorrectNum);
            const score = (correctNum * 4) - incorrectNum;

            totalMarksObtained += score;
            totalPossibleMarks += totalNum * 4;

            performance[subject as SubjectName] = {
                totalQuestions: totalNum,
                correct: correctNum,
                incorrect: incorrectNum,
                skipped: skipped,
                score: score,
            };
        }

        const analysis: TestPlanAnalysis = {
            notes,
            marksObtained: totalMarksObtained,
            totalMarks: totalPossibleMarks,
            rank: rank ? Number(rank) : undefined,
            percentile: percentile ? Number(percentile) : undefined,
            testDuration: duration,
            subjectWisePerformance: performance,
        };
        onComplete(test.id, analysis);
    };

    if (!test) return null;

    return (
        <Modal isOpen={!!test} onClose={onClose} title={`Analyze: ${test.name}`} maxWidth="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-brand-cyan-400 mb-3">Subject-wise Performance</h3>
                    <div className="space-y-4">
                        {(Object.keys(test.syllabus) as SubjectName[]).map(subject => (
                            <div key={subject} className="p-3 bg-black/20 rounded-lg">
                                <p className="font-bold mb-2">{subject}</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Total Questions</label>
                                        <Input type="number" value={subjectData[subject]?.total || ''} onChange={e => handleSubjectDataChange(subject, 'total', e.target.value)} min="0" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Correct</label>
                                        <Input type="number" value={subjectData[subject]?.correct || ''} onChange={e => handleSubjectDataChange(subject, 'correct', e.target.value)} min="0" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Incorrect</label>
                                        <Input type="number" value={subjectData[subject]?.incorrect || ''} onChange={e => handleSubjectDataChange(subject, 'incorrect', e.target.value)} min="0" required />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                     <h3 className="text-lg font-semibold text-brand-cyan-400 mb-3">Additional Info</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium mb-1">Rank (Optional)</label>
                            <Input type="number" value={rank} onChange={e => setRank(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Percentile (Optional)</label>
                            <Input type="number" step="0.01" value={percentile} onChange={e => setPercentile(e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium mb-1">Analysis & Notes</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full bg-slate-900/50 border border-brand-cyan-500/20 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-cyan-500 placeholder:text-gray-500" placeholder="e.g., Made silly mistakes in Physics..."></textarea>
                        </div>
                     </div>
                </div>
               
                <TimeEditor initialDuration={duration} onDurationChange={setDuration} />
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary">Save Analysis</Button>
                </div>
            </form>
        </Modal>
    );
};

const TimeAnalysis: React.FC<{ analysis: TestPlanAnalysis }> = ({ analysis }) => {
    const { totalPrepTime, prepTimeByCategory, prepTimeBySubject, testDuration } = analysis;

    if ((!totalPrepTime || totalPrepTime <= 0) && (!testDuration || testDuration <= 0)) {
        return null;
    }

    const subjectsWithTime = prepTimeBySubject ? (Object.keys(prepTimeBySubject) as SubjectName[]).filter(
        subject => (prepTimeBySubject[subject]?.Revision || 0) > 0 || (prepTimeBySubject[subject]?.Practice || 0) > 0
    ) : [];

    return (
        <div className="p-3 bg-black/20 rounded-lg">
            <h4 className="font-semibold mb-3 text-brand-cyan-400">Time Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center mb-4">
                {testDuration && testDuration > 0 && (
                    <div className="p-2 bg-slate-900/50 rounded">
                        <p className="text-xs text-gray-400">Test Duration</p>
                        <p className="text-lg font-bold text-yellow-300 flex items-center justify-center gap-1"><TrophyIcon className="w-4 h-4" />{formatDuration(testDuration)}</p>
                    </div>
                )}
                {totalPrepTime && totalPrepTime > 0 && (
                    <div className="p-2 bg-slate-900/50 rounded">
                        <p className="text-xs text-gray-400">Total Prep Time</p>
                        <p className="text-lg font-bold text-blue-300 flex items-center justify-center gap-1"><ClockIcon className="w-4 h-4" />{formatDuration(totalPrepTime)}</p>
                    </div>
                )}
                {prepTimeByCategory && totalPrepTime && totalPrepTime > 0 && (
                    <>
                        <div className="p-2 bg-slate-900/50 rounded">
                            <p className="text-xs text-gray-400">Revision Time</p>
                            <p className="text-lg font-bold text-green-400 flex items-center justify-center gap-1"><RepeatIcon className="w-4 h-4" />{formatDuration(prepTimeByCategory.Revision)}</p>
                        </div>
                        <div className="p-2 bg-slate-900/50 rounded">
                            <p className="text-xs text-gray-400">Practice Time</p>
                            <p className="text-lg font-bold text-purple-400 flex items-center justify-center gap-1"><TargetIcon className="w-4 h-4" />{formatDuration(prepTimeByCategory.Practice)}</p>
                        </div>
                    </>
                )}
            </div>
            
            {subjectsWithTime.length > 0 && (
                <div>
                    <h5 className="font-semibold text-sm mb-2 text-gray-300">Prep Time per Subject:</h5>
                    <div className="space-y-2">
                        {subjectsWithTime.map(subject => {
                            const revisionTime = prepTimeBySubject?.[subject]?.Revision || 0;
                            const practiceTime = prepTimeBySubject?.[subject]?.Practice || 0;
                            const totalSubjectTime = revisionTime + practiceTime;
                            return (
                                <div key={subject} className="p-2 bg-slate-900/50 rounded-md text-xs">
                                    <p className="font-bold text-gray-200 mb-1">{subject}</p>
                                    <div className="flex justify-around flex-wrap gap-x-4 gap-y-1">
                                        <span className="flex items-center gap-1">Total: <strong className="text-blue-300">{formatDuration(totalSubjectTime)}</strong></span>
                                        <span className="flex items-center gap-1">Revision: <strong className="text-green-300">{formatDuration(revisionTime)}</strong></span>
                                        <span className="flex items-center gap-1">Practice: <strong className="text-purple-300">{formatDuration(practiceTime)}</strong></span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const subjectTabs: { name: SubjectName, icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { name: 'Physics', icon: AtomIcon },
    { name: 'Chemistry', icon: FlaskConicalIcon },
    { name: 'Botany', icon: LeafIcon },
    { name: 'Zoology', icon: DnaIcon },
];

const HistoricalProgressView: React.FC<{ progress: ProgressStats }> = ({ progress }) => {
    const [activeTab, setActiveTab] = useState<SubjectName>('Physics');
    const activeSubjectStats = progress.subjects[activeTab];

    return (
        <div className="p-4 bg-black/20 rounded-lg">
            <div className="border-b border-white/20 mb-4">
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
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-slate-900/80 backdrop-blur-sm z-10">
                            <tr className="border-b border-white/20 text-xs uppercase text-gray-400">
                                <th className="p-3">Topic</th>
                                <th className="p-3 text-center">Tasks</th>
                                <th className="p-3 text-center">Avg. Difficulty</th>
                                <th className="p-3 text-center">Avg. Accuracy</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(Object.entries(activeSubjectStats.chapters) as [string, ChapterStats][]).filter(([, data]) => data.completed > 0).map(([chapterName, chapterData]) => (
                                <React.Fragment key={chapterName}>
                                    <tr className="border-b border-white/10 bg-slate-900/30">
                                        <td className="p-3 font-semibold">{chapterName}</td>
                                        <td className="p-3 text-center">{chapterData.completed}</td>
                                        <td className="p-3 text-center">{chapterData.avgDifficulty > 0 ? chapterData.avgDifficulty.toFixed(2) : 'N/A'}</td>
                                        <td className="p-3 text-center">{chapterData.avgAccuracy !== null ? `${chapterData.avgAccuracy.toFixed(1)}%` : 'N/A'}</td>
                                    </tr>
                                    {(Object.entries(chapterData.microtopics) as [string, MicrotopicStats][]).filter(([, data]) => data.completed > 0).map(([microtopicName, microtopicData]) => (
                                        <tr key={microtopicName} className="bg-black/20 text-gray-400">
                                            <td className="py-2 px-3 pl-12 text-xs">{microtopicName}</td>
                                            <td className="py-2 px-3 text-center">{microtopicData.completed}</td>
                                            <td className="py-2 px-3 text-center">{microtopicData.avgDifficulty > 0 ? microtopicData.avgDifficulty.toFixed(2) : 'N/A'}</td>
                                            <td className="py-2 px-3 text-center">{microtopicData.avgAccuracy !== null ? `${microtopicData.avgAccuracy.toFixed(1)}%` : 'N/A'}</td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const TestAnalysisDetails: React.FC<{ test: TestPlan }> = ({ test }) => {
    if (!test.analysis) return null;

    const analysis = test.analysis;
    const performance = analysis.subjectWisePerformance || {};
    const performanceSubjects = Object.keys(performance) as SubjectName[];

    const totalRow = useMemo(() => {
        if (!performance) return null;
        return performanceSubjects.reduce((acc, subject) => {
            const data = performance[subject];
            if (data) {
                acc.totalQuestions += data.totalQuestions;
                acc.correct += data.correct;
                acc.incorrect += data.incorrect;
                acc.skipped += data.skipped;
                acc.score += data.score;
            }
            return acc;
        }, { totalQuestions: 0, correct: 0, incorrect: 0, skipped: 0, score: 0 });
    }, [performance, performanceSubjects]);

    const overallAccuracy = useMemo(() => {
        if (!totalRow || totalRow.totalQuestions === 0) return 0;
        return (totalRow.correct / totalRow.totalQuestions) * 100;
    }, [totalRow]);

    const scoreDiff = useMemo(() => {
        if (typeof analysis.marksObtained !== 'number' || typeof analysis.predictedScore !== 'number') return null;
        return analysis.marksObtained - analysis.predictedScore;
    }, [analysis.marksObtained, analysis.predictedScore]);
    
    return (
         <div className="space-y-4 p-4 bg-black/20 rounded-b-lg animate-fadeIn">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-center">
                <div className="p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-xs text-gray-400">Actual Score</p>
                    <p className="text-lg font-bold text-brand-cyan-400">{analysis.marksObtained} / {analysis.totalMarks}</p>
                    {scoreDiff !== null && (
                         <p className={cn("text-xs font-semibold", scoreDiff >= 0 ? 'text-green-400' : 'text-red-400')}>
                            {scoreDiff >= 0 ? '+' : ''}{scoreDiff.toFixed(0)} vs Projection
                        </p>
                    )}
                </div>
                <div className="p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-xs text-gray-400">Projected Score</p>
                    <p className="text-lg font-bold text-yellow-300">{analysis.predictedScore} / {analysis.totalMarks}</p>
                </div>
                <div className="p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-xs text-gray-400">Percentage</p>
                     <p className="text-lg font-bold text-brand-cyan-400">{analysis.totalMarks && analysis.marksObtained && analysis.totalMarks > 0 ? ((analysis.marksObtained / analysis.totalMarks) * 100).toFixed(2) : 'N/A'}%</p>
                </div>
                 <div className="p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-xs text-gray-400">Overall Accuracy</p>
                    <p className="text-lg font-bold text-green-400">{overallAccuracy.toFixed(2)}%</p>
                </div>
                <div className="p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-xs text-gray-400">Rank</p>
                    <p className="text-lg font-bold text-brand-cyan-400">{analysis.rank ?? 'N/A'}</p>
                </div>
                 <div className="p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-xs text-gray-400">Percentile</p>
                    <p className="text-lg font-bold text-brand-cyan-400">{analysis.percentile ?? 'N/A'}</p>
                </div>
            </div>

             <div>
                <h4 className="font-semibold mb-2 mt-4">Subject-wise Performance</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900/80">
                            <tr className="border-b border-white/20 text-xs uppercase text-gray-400">
                                <th className="p-3">Subject</th>
                                <th className="p-3 text-center">Score</th>
                                <th className="p-3 text-center">Accuracy</th>
                                <th className="p-3 text-center">Total Qs</th>
                                <th className="p-3 text-center">Correct</th>
                                <th className="p-3 text-center">Incorrect</th>
                                <th className="p-3 text-center">Skipped</th>
                            </tr>
                        </thead>
                        <tbody>
                            {performanceSubjects.map(subject => {
                                const data = performance[subject];
                                if (!data) return null;
                                const subjectMaxMarks = data.totalQuestions * 4;
                                const subjectPercentage = subjectMaxMarks > 0 ? (data.score / subjectMaxMarks) * 100 : 0;
                                const subjectAccuracy = data.totalQuestions > 0 ? (data.correct / data.totalQuestions) * 100 : 0;
                                return (
                                    <tr key={subject} className="border-b border-white/10">
                                        <td className="p-3 font-semibold">{subject}</td>
                                        <td className={cn("p-3 text-center font-mono", subjectPercentage < 40 ? 'text-red-400' : subjectPercentage < 75 ? 'text-yellow-400' : 'text-green-400')}>{data.score} / {subjectMaxMarks}</td>
                                        <td className={cn("p-3 text-center font-mono", subjectAccuracy < 50 ? 'text-red-400' : subjectAccuracy < 80 ? 'text-yellow-400' : 'text-green-400')}>{subjectAccuracy.toFixed(2)}%</td>
                                        <td className="p-3 text-center">{data.totalQuestions}</td>
                                        <td className="p-3 text-center text-green-400">{data.correct}</td>
                                        <td className="p-3 text-center text-red-400">{data.incorrect}</td>
                                        <td className="p-3 text-center text-gray-400">{data.skipped}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        {totalRow && (
                            <tfoot className="font-bold bg-slate-900/80 text-gray-200">
                                <tr>
                                    <td className="p-3">Total</td>
                                    <td className="p-3 text-center font-mono">{totalRow.score} / {analysis.totalMarks}</td>
                                    <td className={cn("p-3 text-center font-mono", overallAccuracy < 50 ? 'text-red-300' : overallAccuracy < 80 ? 'text-yellow-300' : 'text-green-300')}>{overallAccuracy.toFixed(2)}%</td>
                                    <td className="p-3 text-center">{totalRow.totalQuestions}</td>
                                    <td className="p-3 text-center text-green-300">{totalRow.correct}</td>
                                    <td className="p-3 text-center text-red-300">{totalRow.incorrect}</td>
                                    <td className="p-3 text-center text-gray-300">{totalRow.skipped}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            <TimeAnalysis analysis={analysis} />

            {analysis.notes && (
                <div>
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm p-3 bg-black/20 rounded-md border-l-2 border-brand-cyan-700 whitespace-pre-wrap">{analysis.notes}</p>
                </div>
            )}
            
            {analysis.progressSnapshot && (
                <div className="mt-4">
                    <h4 className="font-semibold mb-2">Preparation Status at Time of Test</h4>
                    <HistoricalProgressView progress={analysis.progressSnapshot} />
                </div>
            )}
        </div>
    );
}

const ViewAnalysisModal: React.FC<{ test: TestPlan | null, onClose: () => void }> = ({ test, onClose }) => {
    if (!test || !test.analysis) return null;
    return (
         <Modal isOpen={!!test} onClose={onClose} title={`Analysis: ${test.name}`} maxWidth="max-w-4xl">
            <TestAnalysisDetails test={test} />
            <div className="flex justify-end mt-6">
                <Button onClick={onClose} variant="secondary">Close</Button>
            </div>
        </Modal>
    );
}

const ChapterRevisionModal: React.FC<{
    chapterInfo: { test: TestPlan; subject: SubjectName; chapter: string } | null;
    onClose: () => void;
    onConfirm: (difficulty: number) => void;
}> = ({ chapterInfo, onClose, onConfirm }) => {
    const [difficulty, setDifficulty] = useState(3);

    useEffect(() => {
        setDifficulty(3);
    }, [chapterInfo]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(difficulty);
    };

    if (!chapterInfo) return null;

    return (
        <Modal isOpen={!!chapterInfo} onClose={onClose} title={`Revise Chapter: ${chapterInfo.chapter}`}>
            <form onSubmit={handleSubmit}>
                <label className="block mb-2">How difficult was this chapter? (1: Easy - 5: Hard)</label>
                <div className="flex items-center gap-4 my-4">
                    <span>1</span>
                    <input type="range" min="1" max="5" value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} className="w-full" />
                    <span>5</span>
                    <span className="font-bold text-brand-cyan-400 w-4">{difficulty}</span>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Revision</Button>
                </div>
            </form>
        </Modal>
    );
};

const ChapterPracticeModal: React.FC<{
    chapterInfo: { test: TestPlan; subject: SubjectName; chapter: string } | null;
    onClose: () => void;
    onConfirm: (total: number, correct: number, incorrect: number) => void;
}> = ({ chapterInfo, onClose, onConfirm }) => {
    const [total, setTotal] = useState('');
    const [correct, setCorrect] = useState('');
    const [incorrect, setIncorrect] = useState('');

    useEffect(() => {
        setTotal('');
        setCorrect('');
        setIncorrect('');
    }, [chapterInfo]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const totalNum = Number(total);
        const correctNum = Number(correct);
        const incorrectNum = Number(incorrect || 0);

        if (totalNum > 0 && correctNum >= 0 && incorrectNum >= 0 && (correctNum + incorrectNum <= totalNum)) {
            onConfirm(totalNum, correctNum, incorrectNum);
        } else {
            alert("Please check your numbers. Correct + Incorrect answers must not exceed the total questions attempted.");
        }
    };

    if (!chapterInfo) return null;

    return (
        <Modal isOpen={!!chapterInfo} onClose={onClose} title={`Practice Chapter: ${chapterInfo.chapter}`}>
            <form onSubmit={handleSubmit}>
                <p className="text-sm text-gray-300 mb-4">Enter the results for your practice session on this chapter. This will be logged for all topics within it.</p>
                <div className="space-y-4">
                    <div>
                        <label className="block mb-1">Total Questions Attempted</label>
                        <Input type="number" value={total} onChange={e => setTotal(e.target.value)} min="1" required />
                    </div>
                    <div>
                        <label className="block mb-1">Number of Correct Answers</label>
                        <Input type="number" value={correct} onChange={e => setCorrect(e.target.value)} min="0" max={total || undefined} required />
                    </div>
                    <div>
                        <label className="block mb-1">Number of Incorrect Answers</label>
                        <Input type="number" value={incorrect} onChange={e => setIncorrect(e.target.value)} min="0" max={total && correct ? String(Number(total) - Number(correct)) : undefined} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Practice</Button>
                </div>
            </form>
        </Modal>
    );
};


interface TestPlannerProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    testPlans: TestPlan[];
    setTestPlans: React.Dispatch<React.SetStateAction<TestPlan[]>>;
    activeTimer: ActiveTimer | null;
    startPrepTimer: (task: Task) => void;
    startTestTimer: (test: TestPlan) => void;
    completedTestInfo: { test: TestPlan, duration: number } | null;
    onAnalysisComplete: () => void;
}


const TestPlanner: React.FC<TestPlannerProps> = ({ tasks, setTasks, testPlans, setTestPlans, activeTimer, startPrepTimer, startTestTimer, completedTestInfo, onAnalysisComplete }) => {
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [testToAnalyze, setTestToAnalyze] = useState<TestPlan | null>(null);
    const [viewingTest, setViewingTest] = useState<TestPlan | null>(null);
    const [expandedTest, setExpandedTest] = useState<string | null>(null);
    const [expandedCompletedTest, setExpandedCompletedTest] = useState<string | null>(null);
    const [initialDurationForAnalysis, setInitialDurationForAnalysis] = useState(0);
    const [chapterToRevise, setChapterToRevise] = useState<{ test: TestPlan; subject: SubjectName; chapter: string } | null>(null);
    const [chapterToPractice, setChapterToPractice] = useState<{ test: TestPlan; subject: SubjectName; chapter: string } | null>(null);


    useEffect(() => {
        if (completedTestInfo) {
            setTestToAnalyze(completedTestInfo.test);
            setInitialDurationForAnalysis(completedTestInfo.duration);
        }
    }, [completedTestInfo]);

    const progressStats = useMemo(() => calculateProgress(tasks), [tasks]);
    
    const { upcomingTests, completedTests } = useMemo(() => {
        const upcoming: TestPlan[] = [];
        const completed: TestPlan[] = [];
        testPlans.forEach(test => {
            if (test.status === 'Upcoming') upcoming.push(test);
            else completed.push(test);
        });
        return { upcomingTests: upcoming, completedTests: completed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) };
    }, [testPlans]);

    const calculatePredictionForTest = useCallback((test: TestPlan, currentProgress: ProgressStats): number => {
        if (!test.totalQuestions || test.totalQuestions === 0) {
            return 0;
        }

        const overallIncorrectRatio = (currentProgress.totalIncorrect + currentProgress.totalSkipped) > 0
            ? currentProgress.totalIncorrect / (currentProgress.totalIncorrect + currentProgress.totalSkipped)
            : 0.75; // If no data, assume 75% of non-correct are incorrect

        let totalSyllabusScore = 0;
        let scoredMicrotopicsCount = 0;

        test.topicStatus.forEach(topic => {
            const microtopicStats = currentProgress.subjects[topic.subject]
                ?.chapters[topic.chapter]
                ?.microtopics[topic.microtopic];

            if (microtopicStats && microtopicStats.completed > 0) {
                const score = calculateOverallScore(microtopicStats.avgDifficulty, microtopicStats.avgAccuracy);
                if (score > 0) {
                    totalSyllabusScore += score;
                    scoredMicrotopicsCount++;
                }
            }
        });

        if (scoredMicrotopicsCount === 0) {
            return 0; // Predict 0 if no topics have been studied
        }

        const avgCorrectProbability = (totalSyllabusScore / scoredMicrotopicsCount) / 100;
        const predictedCorrect = test.totalQuestions * avgCorrectProbability;
        const predictedNotCorrect = test.totalQuestions - predictedCorrect;
        const predictedIncorrect = predictedNotCorrect * overallIncorrectRatio;

        const predictedScore = (predictedCorrect * 4) - (predictedIncorrect * 1);

        return Math.max(0, Math.round(predictedScore));
    }, []);

    const testPredictions = useMemo(() => {
        const predictions: Record<string, number> = {};
        upcomingTests.forEach(test => {
            predictions[test.id] = calculatePredictionForTest(test, progressStats);
        });
        return predictions;
    }, [upcomingTests, progressStats, calculatePredictionForTest]);
    
    const detailedPrepTimes = useMemo(() => {
        const details: { [testId: string]: {
            total: number;
            byCategory: { Revision: number; Practice: number; };
            bySubject: { [key in SubjectName]?: { Revision: number; Practice: number; } };
        } } = {};

        upcomingTests.forEach(test => {
            const testPrepTasks = tasks.filter(task => 
                task.status === 'Completed' && 
                task.notes?.includes(`For upcoming test: "${test.name}"`)
            );

            const testDetails = testPrepTasks.reduce((acc, task) => {
                if (task.taskType === 'Revision' || task.taskType === 'Practice') {
                    const duration = (task.sessions || []).reduce((sum, s) => sum + s.duration, 0);
                    
                    acc.total += duration;
                    acc.byCategory[task.taskType] += duration;
                    
                    if (!acc.bySubject[task.subject]) {
                        acc.bySubject[task.subject] = { Revision: 0, Practice: 0 };
                    }
                    acc.bySubject[task.subject]![task.taskType] += duration;
                }
                return acc;
            }, {
                total: 0,
                byCategory: { Revision: 0, Practice: 0 },
                bySubject: {} as { [key in SubjectName]?: { Revision: number; Practice: number; } }
            });

            details[test.id] = testDetails;
        });

        return details;
    }, [tasks, upcomingTests]);

    const addTest = (testData: Omit<TestPlan, 'id'|'status'>) => {
        const newTest: TestPlan = { ...testData, id: crypto.randomUUID(), status: 'Upcoming' };
        setTestPlans(prev => [...prev, newTest].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    };

    const deleteTest = (id: string) => {
        if (window.confirm('Are you sure you want to delete this test plan?')) {
            setTestPlans(testPlans.filter(t => t.id !== id));
        }
    };
    
    const completeTest = (id: string, analysis: TestPlanAnalysis) => {
        const testBeingCompleted = testPlans.find(t => t.id === id);
        if (!testBeingCompleted) return;
        
        const tasksForSnapshot = tasks.filter(task => 
            task.status === 'Completed' && new Date(task.date) <= new Date(testBeingCompleted.date)
        );
    
        const progressSnapshot = calculateProgress(tasksForSnapshot);

        const prepData = detailedPrepTimes[id];
        const finalPrediction = calculatePredictionForTest(testBeingCompleted, progressStats);

        const analysisWithTime: TestPlanAnalysis = { 
            ...analysis, 
            predictedScore: finalPrediction,
            totalPrepTime: prepData?.total || 0,
            prepTimeByCategory: prepData?.byCategory,
            prepTimeBySubject: prepData?.bySubject,
            progressSnapshot: progressSnapshot
        };
        const updatedTest = { ...testBeingCompleted, status: 'Completed' as const, analysis: analysisWithTime };
        
        setTestPlans(prevPlans => prevPlans.map(t => t.id === id ? updatedTest : t));

        setTestToAnalyze(null);
        onAnalysisComplete();
        setViewingTest(updatedTest); // Immediately show the analysis view in a modal
    };
    
    const handleStartRevisionTimer = (test: TestPlan, topic: TopicStatus) => {
        const newTask: Task = {
            id: crypto.randomUUID(),
            name: `Revise: ${topic.microtopic}`,
            subject: topic.subject,
            chapter: topic.chapter,
            microtopics: [topic.microtopic],
            taskType: 'Revision',
            date: new Date().toISOString().split('T')[0],
            status: 'Pending',
            priority: 'High',
            notes: `For upcoming test: "${test.name}"`,
            sessions: [],
        };
        startPrepTimer(newTask);
    };

    const handleStartPracticeTimer = (test: TestPlan, topic: TopicStatus) => {
        const newTask: Task = {
            id: crypto.randomUUID(),
            name: `Practice: ${topic.microtopic}`,
            subject: topic.subject,
            chapter: topic.chapter,
            microtopics: [topic.microtopic],
            taskType: 'Practice',
            date: new Date().toISOString().split('T')[0],
            status: 'Pending',
            priority: 'High',
            notes: `For upcoming test: "${test.name}"`,
            sessions: [],
        };
        startPrepTimer(newTask);
    };

    const handleConfirmChapterRevision = (difficulty: number) => {
        if (!chapterToRevise) return;
        const { test, subject, chapter } = chapterToRevise;

        setTestPlans(prevTests => 
            prevTests.map(t => {
                if (t.id === test.id) {
                    const updatedTopicStatus = t.topicStatus.map(topic => {
                        if (topic.subject === subject && topic.chapter === chapter) {
                            return { ...topic, revisionDifficulty: difficulty };
                        }
                        return topic;
                    });
                    return { ...t, topicStatus: updatedTopicStatus };
                }
                return t;
            })
        );
        setChapterToRevise(null);
    };

    const handleConfirmChapterPractice = (total: number, correct: number, incorrect: number) => {
        if (!chapterToPractice) return;
        const { test, subject, chapter } = chapterToPractice;

        setTestPlans(prevTests => 
            prevTests.map(t => {
                if (t.id === test.id) {
                    const newAttempt: TopicPracticeAttempt = {
                        id: crypto.randomUUID(),
                        totalQuestions: total,
                        correctAnswers: correct,
                        incorrectAnswers: incorrect,
                        duration: 0, // No timer for this action
                    };

                    const updatedTopicStatus = t.topicStatus.map(topic => {
                        if (topic.subject === subject && topic.chapter === chapter) {
                            return { 
                                ...topic, 
                                practiceAttempts: [...topic.practiceAttempts, newAttempt] 
                            };
                        }
                        return topic;
                    });
                    return { ...t, topicStatus: updatedTopicStatus };
                }
                return t;
            })
        );
        setChapterToPractice(null);
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-brand-cyan-400">Test Planner</h1>
                <Button onClick={() => setCreateModalOpen(true)} variant="primary"><PlusIcon /> Plan a Test</Button>
            </div>

            <section>
                <h2 className="text-2xl font-bold text-brand-cyan-400 mb-4">Upcoming Tests</h2>
                {upcomingTests.length > 0 ? (
                    <div className="space-y-4">
                        {upcomingTests.map(test => (
                            <Card key={test.id} className="p-4 flex flex-col gap-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold">{test.name}</p>
                                        <p className="text-sm text-gray-400">{new Date(new Date(test.date).toLocaleString("en-US", { timeZone: "UTC" })).toDateString()}</p>
                                        {(detailedPrepTimes[test.id]?.total || 0) > 0 && (
                                            <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-300">
                                                <ClockIcon className="w-4 h-4" />
                                                <span>Total Prep Time: {formatDuration(detailedPrepTimes[test.id].total)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 self-end sm:self-center">
                                        <div className="text-right">
                                            <p className="text-xs text-yellow-300 flex items-center justify-end gap-1"><TrendingUpIcon className="w-4 h-4"/>Projected Score</p>
                                            <p className="text-2xl font-bold text-yellow-400">{testPredictions[test.id]} / {test.totalQuestions ? test.totalQuestions * 4 : 'N/A'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button onClick={() => startTestTimer(test)} variant="primary" size="sm" disabled={!!activeTimer}><TrophyIcon className="w-4 h-4"/>Start Test</Button>
                                            <Button onClick={() => setExpandedTest(expandedTest === test.id ? null : test.id)} variant="secondary" size="sm">
                                                {expandedTest === test.id ? 'Hide Prep' : 'Start Prep'}
                                            </Button>
                                            <button onClick={() => deleteTest(test.id)} className="p-1 text-gray-400 hover:text-red-400 transition-colors"><Trash2Icon className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                                {expandedTest === test.id && (
                                    <div className="w-full bg-black/20 p-4 rounded-lg max-h-[70vh] overflow-y-auto space-y-6 animate-fadeIn">
                                        <div>
                                            <h4 className="font-semibold text-brand-cyan-500 mb-2">AI-Powered Topic Analysis</h4>
                                            {(() => {
                                                const { weakTopics, averageTopics, strongTopics } = analyzeSyllabusForTest(test.syllabus, progressStats);
                                                return <TopicAnalysis weakTopics={weakTopics} averageTopics={averageTopics} strongTopics={strongTopics} />;
                                            })()}
                                        </div>
                                        
                                        <div>
                                            <h4 className="font-semibold text-brand-cyan-500 mb-2">Test Preparation Checklist</h4>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                    <thead className="sticky top-0 bg-slate-900/70 backdrop-blur-sm z-20">
                                                        <tr className="text-left text-gray-400 border-b border-white/20">
                                                            <th className="py-2 px-3 w-1/2">Topic</th>
                                                            <th className="py-2 px-3 text-center w-1/4">Prep. Status</th>
                                                            <th className="py-2 px-3 text-center w-1/4">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                    {(() => {
                                                        const groupedTopics = test.topicStatus.reduce((acc, topic) => {
                                                            if (!acc[topic.subject]) acc[topic.subject] = {};
                                                            if (!acc[topic.subject][topic.chapter]) acc[topic.subject][topic.chapter] = [];
                                                            acc[topic.subject][topic.chapter].push(topic);
                                                            return acc;
                                                        }, {} as Record<SubjectName, Record<string, TopicStatus[]>>);

                                                        return (Object.keys(groupedTopics) as SubjectName[]).map(subject => (
                                                            <React.Fragment key={subject}>
                                                                <tr className="bg-brand-cyan-900/50 backdrop-blur-sm sticky top-9 z-10">
                                                                    <th colSpan={3} className="py-2 px-3 text-left font-bold text-brand-cyan-400 text-sm uppercase tracking-wider">
                                                                        {subject}
                                                                    </th>
                                                                </tr>
                                                                {Object.keys(groupedTopics[subject]).map(chapter => (
                                                                    <React.Fragment key={chapter}>
                                                                        <tr className="bg-black/40">
                                                                            <td className="py-1.5 px-3 font-semibold text-gray-300 pl-6">
                                                                                {chapter}
                                                                            </td>
                                                                            <td colSpan={2} className="py-1.5 px-3 text-right">
                                                                                <div className="flex justify-end items-center gap-1">
                                                                                    <Button variant="ghost" size="sm" onClick={() => setChapterToRevise({ test, subject, chapter })} disabled={!!activeTimer} title="Mark all topics in this chapter as revised">
                                                                                        <BrainIcon className="w-4 h-4 mr-1"/>Revise All
                                                                                    </Button>
                                                                                    <Button variant="ghost" size="sm" onClick={() => setChapterToPractice({ test, subject, chapter })} disabled={!!activeTimer} title="Log a practice session for all topics in this chapter">
                                                                                        <ClipboardCheckIcon className="w-4 h-4 mr-1"/>Practice All
                                                                                    </Button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                        {groupedTopics[subject][chapter].map(topic => {
                                                                            const dailyStats = progressStats.subjects[topic.subject]
                                                                                ?.chapters[topic.chapter]
                                                                                ?.microtopics[topic.microtopic];
                                                                            
                                                                            const dailyScore = (dailyStats && dailyStats.completed > 0 && (dailyStats.avgDifficulty > 0 || dailyStats.avgAccuracy !== null))
                                                                                ? calculateOverallScore(dailyStats.avgDifficulty, dailyStats.avgAccuracy)
                                                                                : undefined;

                                                                            return (
                                                                                <tr key={topic.microtopic} className="border-b border-white/10 hover:bg-white/5">
                                                                                    <td className={cn("py-1.5 px-3 pl-8", dailyScore !== undefined && getScoreColorClass(dailyScore))}>{topic.microtopic}</td>
                                                                                    <td className="py-1.5 px-3 text-center">
                                                                                         {topic.revisionDifficulty || topic.practiceAttempts.length > 0 ? (
                                                                                            <div className="text-xs space-y-1">
                                                                                                {topic.revisionDifficulty && (
                                                                                                    <span className="flex items-center justify-center gap-1 text-green-300">
                                                                                                        <BrainIcon className="w-3 h-3"/> Revised (Diff: <strong>{topic.revisionDifficulty}</strong>/5)
                                                                                                    </span>
                                                                                                )}
                                                                                                {topic.practiceAttempts.map(attempt => {
                                                                                                    const accuracy = attempt.totalQuestions > 0 ? (attempt.correctAnswers / attempt.totalQuestions) * 100 : 0;
                                                                                                    return (
                                                                                                        <span key={attempt.id} className="flex items-center justify-center gap-1 text-purple-300">
                                                                                                            <ClipboardCheckIcon className="w-3 h-3" /> Practiced: <strong>{accuracy.toFixed(0)}%</strong> ({attempt.correctAnswers}/{attempt.totalQuestions})
                                                                                                        </span>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div className="text-xs text-gray-500">
                                                                                                <p>Overall Score:</p>
                                                                                                <p className={cn("font-bold", dailyScore !== undefined && getScoreColorClass(dailyScore))}>
                                                                                                    {dailyScore !== undefined ? `${dailyScore.toFixed(0)}/100` : 'No Data'}
                                                                                                </p>
                                                                                            </div>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="py-1.5 px-3 text-center">
                                                                                        <div className="flex justify-center items-center gap-1">
                                                                                            <Button variant="ghost" size="sm" onClick={() => handleStartRevisionTimer(test, topic)} disabled={!!activeTimer}><BrainIcon className="w-4 h-4 mr-1"/>Revise</Button>
                                                                                            <Button variant="ghost" size="sm" onClick={() => handleStartPracticeTimer(test, topic)} disabled={!!activeTimer}><ClipboardCheckIcon className="w-4 h-4 mr-1"/>Practice</Button>
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </React.Fragment>
                                                                ))}
                                                            </React.Fragment>
                                                        ));
                                                    })()}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                ) : <Card className="p-6 text-center text-gray-400">No upcoming tests. Plan one now!</Card>}
            </section>
            
            <section className="mt-12">
                <h2 className="text-2xl font-bold text-brand-cyan-400 mb-4">Completed Tests</h2>
                {completedTests.length > 0 ? (
                    <div className="space-y-4">
                         {completedTests.map(test => {
                            const isExpanded = expandedCompletedTest === test.id;
                            const percentage = test.analysis?.totalMarks && test.analysis.marksObtained && test.analysis.totalMarks > 0 ? ((test.analysis.marksObtained / test.analysis.totalMarks) * 100) : 0;
                            return (
                                <Card key={test.id} className="p-0 overflow-hidden">
                                    <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 cursor-pointer hover:bg-white/5" onClick={() => setExpandedCompletedTest(isExpanded ? null : test.id)}>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold">{test.name}</p>
                                            <p className="text-sm text-gray-400">{new Date(new Date(test.date).toLocaleString("en-US", { timeZone: "UTC" })).toDateString()}</p>
                                            {test.analysis?.totalPrepTime && test.analysis.totalPrepTime > 0 ? (
                                                <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-300">
                                                    <ClockIcon className="w-4 h-4" />
                                                    <span>Total Prep Time: {formatDuration(test.analysis.totalPrepTime)}</span>
                                                </div>
                                            ) : null}
                                        </div>
                                        <div className="flex items-center gap-4 self-end sm:self-center">
                                             <div className="text-right">
                                                <p className="text-2xl font-bold text-brand-cyan-400">{test.analysis?.marksObtained} / {test.analysis?.totalMarks}</p>
                                                <p className={cn("text-sm font-semibold", getScoreColorClass(percentage))}>{percentage.toFixed(2)}%</p>
                                             </div>
                                            <button onClick={(e) => { e.stopPropagation(); deleteTest(test.id) }} className="p-2 text-gray-400 hover:text-red-400 transition-colors"><Trash2Icon className="w-5 h-5" /></button>
                                             <ChevronDownIcon className={cn("w-6 h-6 text-gray-400 transition-transform", isExpanded && "rotate-180")} />
                                        </div>
                                    </div>
                                    {isExpanded && <TestAnalysisDetails test={test} />}
                                </Card>
                            )
                        })}
                    </div>
                ) : <Card className="p-6 text-center text-gray-400">You haven't completed any tests yet.</Card>}
            </section>
            
            <CreateTestModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onAddTest={addTest} tasks={tasks} />
            <TestAnalysisModal 
                test={testToAnalyze}
                initialDuration={initialDurationForAnalysis}
                onClose={() => {
                    setTestToAnalyze(null);
                    onAnalysisComplete();
                }}
                onComplete={completeTest} 
            />
            <ViewAnalysisModal test={viewingTest} onClose={() => setViewingTest(null)} />
            <ChapterRevisionModal 
                chapterInfo={chapterToRevise}
                onClose={() => setChapterToRevise(null)}
                onConfirm={handleConfirmChapterRevision}
            />
            <ChapterPracticeModal 
                chapterInfo={chapterToPractice}
                onClose={() => setChapterToPractice(null)}
                onConfirm={handleConfirmChapterPractice}
            />
        </div>
    );
};

export default TestPlanner;