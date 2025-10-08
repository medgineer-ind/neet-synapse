

import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { TestPlan, SubjectName, AnalyzedTopic, Task, TopicStatus, TestPlanAnalysis, TopicPracticeAttempt, ProgressStats } from '../types';
import { syllabus } from '../data/syllabus';
import { cn, calculateProgress, analyzeSyllabusForTest, generatePerformanceSummary } from '../lib/utils';
import { PlusIcon, Trash2Icon, BrainIcon, ClipboardCheckIcon } from './ui/Icons';
import { Card, Button, Input, Modal } from './ui/StyledComponents';

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


const CreateTestModal: React.FC<{ isOpen: boolean; onClose: () => void; onAddTest: (test: Omit<TestPlan, 'id'|'status'>) => void }> = ({ isOpen, onClose, onAddTest }) => {
    const [name, setName] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSyllabus, setSelectedSyllabus] = useState<TestPlan['syllabus']>({});
    const [tasks] = useLocalStorage<Task[]>('tasks', []);

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
        if (!name.trim() || Object.keys(selectedSyllabus).length === 0) {
            alert('Please provide a test name and select at least one chapter.');
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

        onAddTest({ name, date, syllabus: selectedSyllabus, topicStatus });
        // Reset form
        setName('');
        setDate(new Date().toISOString().split('T')[0]);
        setSelectedSyllabus({});
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Plan a New Test">
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Input type="text" placeholder="Test Name (e.g., Mock Test 1)" value={name} onChange={e => setName(e.target.value)} required />
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                
                <h3 className="font-semibold text-brand-cyan-400 mb-2">Select Syllabus</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto p-2 bg-black/20 rounded-md">
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

const TestAnalysisModal: React.FC<{ test: TestPlan | null, onClose: () => void, onComplete: (id: string, analysis: TestPlanAnalysis) => void }> = ({ test, onClose, onComplete }) => {
    const [marksObtained, setMarksObtained] = useState('');
    const [totalMarks, setTotalMarks] = useState('');
    const [rank, setRank] = useState('');
    const [percentile, setPercentile] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!test) return;
        const analysis: TestPlanAnalysis = {
            notes,
            marksObtained: Number(marksObtained),
            totalMarks: Number(totalMarks),
            rank: rank ? Number(rank) : undefined,
            percentile: percentile ? Number(percentile) : undefined,
        }
        onComplete(test.id, analysis);
        // Reset form
        setMarksObtained(''); setTotalMarks(''); setRank(''); setPercentile(''); setNotes('');
        onClose();
    };

    if (!test) return null;

    return (
        <Modal isOpen={!!test} onClose={onClose} title={`Analyze: ${test.name}`} maxWidth="max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Marks Obtained</label>
                        <Input type="number" value={marksObtained} onChange={e => setMarksObtained(e.target.value)} required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Total Marks</label>
                        <Input type="number" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Rank (Optional)</label>
                        <Input type="number" value={rank} onChange={e => setRank(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Percentile (Optional)</label>
                        <Input type="number" step="0.01" value={percentile} onChange={e => setPercentile(e.target.value)} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Analysis & Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="w-full bg-slate-900/50 border border-brand-cyan-500/20 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-cyan-500 placeholder:text-gray-500" placeholder="e.g., Made silly mistakes in Physics..."></textarea>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary">Save Analysis</Button>
                </div>
            </form>
        </Modal>
    );
};

const ViewAnalysisModal: React.FC<{ test: TestPlan | null, onClose: () => void }> = ({ test, onClose }) => {
    
    const groupedTopics = useMemo(() => {
        if (!test?.topicStatus) return {};
        return test.topicStatus.reduce((acc, topic) => {
            if (!acc[topic.subject]) acc[topic.subject] = {};
            if (!acc[topic.subject][topic.chapter]) acc[topic.subject][topic.chapter] = [];
            acc[topic.subject][topic.chapter].push(topic);
            return acc;
        }, {} as Record<SubjectName, Record<string, TopicStatus[]>>);
    }, [test]);
    
    if (!test || !test.analysis) return null;

    const getAvgAccuracy = (attempts: TopicPracticeAttempt[]) => {
        if (attempts.length === 0) return null;
        const totalQ = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);
        const correctQ = attempts.reduce((sum, a) => sum + a.correctAnswers, 0);
        return totalQ > 0 ? (correctQ / totalQ) * 100 : 0;
    };

    return (
         <Modal isOpen={!!test} onClose={onClose} title={`Analysis: ${test.name}`} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-2 bg-black/20 rounded-lg">
                        <p className="text-xs text-gray-400">Score</p>
                        <p className="text-lg font-bold text-brand-cyan-400">{test.analysis.marksObtained} / {test.analysis.totalMarks}</p>
                    </div>
                    <div className="p-2 bg-black/20 rounded-lg">
                        <p className="text-xs text-gray-400">Percentage</p>
                         <p className="text-lg font-bold text-brand-cyan-400">{test.analysis.totalMarks && test.analysis.marksObtained ? ((test.analysis.marksObtained / test.analysis.totalMarks) * 100).toFixed(2) : 'N/A'}%</p>
                    </div>
                    <div className="p-2 bg-black/20 rounded-lg">
                        <p className="text-xs text-gray-400">Rank</p>
                        <p className="text-lg font-bold text-brand-cyan-400">{test.analysis.rank ?? 'N/A'}</p>
                    </div>
                     <div className="p-2 bg-black/20 rounded-lg">
                        <p className="text-xs text-gray-400">Percentile</p>
                        <p className="text-lg font-bold text-brand-cyan-400">{test.analysis.percentile ?? 'N/A'}</p>
                    </div>
                </div>

                {test.analysis.notes && (
                    <div>
                        <h4 className="font-semibold mb-2">Notes</h4>
                        <p className="text-sm p-3 bg-black/20 rounded-md border-l-2 border-brand-cyan-700 whitespace-pre-wrap">{test.analysis.notes}</p>
                    </div>
                )}
                
                <div>
                    <h4 className="font-semibold mb-2 mt-4">Preparation History</h4>
                    <div className="space-y-4 max-h-80 overflow-y-auto bg-black/20 p-3 rounded-lg">
                    {(Object.keys(groupedTopics) as SubjectName[]).map(subject => (
                        <div key={subject}>
                            <h5 className="font-bold text-brand-cyan-500">{subject}</h5>
                             {Object.keys(groupedTopics[subject]).map(chapter => (
                                <div key={chapter} className="pl-4 mt-2">
                                    <p className="font-semibold text-sm text-gray-300 border-b border-white/10 pb-1 mb-1">{chapter}</p>
                                    <ul className="text-xs space-y-1">
                                    {groupedTopics[subject][chapter].map(topic => {
                                        const avgAccuracy = getAvgAccuracy(topic.practiceAttempts);
                                        return (
                                            <li key={topic.microtopic} className="flex justify-between items-center">
                                                <span>{topic.microtopic}</span>
                                                <div className="flex items-center gap-4">
                                                    <span>Rev. Diff: <span className="font-bold">{topic.revisionDifficulty ?? 'N/A'}</span></span>
                                                    <span>Prac. Acc: <span className="font-bold">{avgAccuracy !== null ? `${avgAccuracy.toFixed(0)}%` : 'N/A'}</span></span>
                                                </div>
                                            </li>
                                        )
                                    })}
                                    </ul>
                                </div>
                             ))}
                        </div>
                    ))}
                    </div>
                </div>

                 <div className="flex justify-end mt-6">
                    <Button onClick={onClose} variant="secondary">Close</Button>
                </div>
            </div>
        </Modal>
    );
}

const LogRevisionModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (difficulty: number) => void; topicName: string; }> = ({ isOpen, onClose, onSave, topicName }) => {
    const [difficulty, setDifficulty] = useState(3);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(difficulty);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Revise: ${topicName}`} maxWidth="max-w-md">
            <form onSubmit={handleSubmit}>
                <label className="block mb-2">How difficult was this topic? (1: Easy - 5: Hard)</label>
                <div className="flex items-center gap-4 my-4">
                    <span>1</span>
                    <input type="range" min="1" max="5" value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} className="w-full" />
                    <span>5</span>
                    <span className="font-bold text-brand-cyan-400 w-4">{difficulty}</span>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary">Save</Button>
                </div>
            </form>
        </Modal>
    );
};

const LogPracticeModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (total: number, correct: number) => void; topicName: string; }> = ({ isOpen, onClose, onSave, topicName }) => {
    const [total, setTotal] = useState('');
    const [correct, setCorrect] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const totalNum = Number(total);
        const correctNum = Number(correct);
        if (totalNum > 0 && correctNum <= totalNum && correctNum >= 0) {
            onSave(totalNum, correctNum);
            onClose();
        }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Practice: ${topicName}`} maxWidth="max-w-md">
             <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className="block mb-1">Total Questions Attempted</label>
                        <Input type="number" value={total} onChange={e => setTotal(e.target.value)} min="1" required />
                    </div>
                    <div>
                        <label className="block mb-1">Number of Correct Answers</label>
                        <Input type="number" value={correct} onChange={e => setCorrect(e.target.value)} min="0" max={total || undefined} required />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary">Save</Button>
                </div>
            </form>
        </Modal>
    );
};


const TestPlanner: React.FC = () => {
    const [tests, setTests] = useLocalStorage<TestPlan[]>('testPlans', []);
    const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [testToAnalyze, setTestToAnalyze] = useState<TestPlan | null>(null);
    const [viewingTest, setViewingTest] = useState<TestPlan | null>(null);
    const [expandedTest, setExpandedTest] = useState<string | null>(null);

    // State for logging revision/practice
    const [isRevisionModalOpen, setRevisionModalOpen] = useState(false);
    const [isPracticeModalOpen, setPracticeModalOpen] = useState(false);
    const [topicToUpdate, setTopicToUpdate] = useState<TopicStatus | null>(null);
    const [currentTestId, setCurrentTestId] = useState<string | null>(null);
    
    const progressStats = useMemo(() => calculateProgress(tasks), [tasks]);
    
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

    const addTest = (testData: Omit<TestPlan, 'id'|'status'>) => {
        const newTest: TestPlan = { ...testData, id: crypto.randomUUID(), status: 'Upcoming' };
        setTests(prev => [...prev, newTest].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    };

    const deleteTest = (id: string) => {
        if (window.confirm('Are you sure you want to delete this test plan?')) {
            setTests(tests.filter(t => t.id !== id));
        }
    };
    
    const completeTest = (id: string, analysis: TestPlanAnalysis) => {
        setTests(tests.map(t => t.id === id ? { ...t, status: 'Completed', analysis } : t));
    };

    const handleSaveRevision = (difficulty: number) => {
        if (!currentTestId || !topicToUpdate) return;
        
        let currentTestName = '';
        setTests(prevTests => prevTests.map(test => {
            if (test.id !== currentTestId) return test;
            currentTestName = test.name;
            const updatedTopicStatus = test.topicStatus.map(topic => 
                topic.microtopic === topicToUpdate.microtopic && topic.chapter === topicToUpdate.chapter ? { ...topic, revisionDifficulty: difficulty } : topic
            );
            return { ...test, topicStatus: updatedTopicStatus };
        }));

        const performanceSummary = generatePerformanceSummary(difficulty, undefined, undefined);
        const notes = `Auto-generated from test preparation for "${currentTestName}".` + performanceSummary;

        const newTask: Task = {
            id: crypto.randomUUID(),
            name: `Revise: ${topicToUpdate.microtopic}`,
            subject: topicToUpdate.subject,
            chapter: topicToUpdate.chapter,
            microtopics: [topicToUpdate.microtopic],
            taskType: 'Revision',
            date: new Date().toISOString().split('T')[0],
            status: 'Completed',
            priority: 'High',
            notes: notes,
            difficulty: difficulty,
        };
        setTasks(prevTasks => [...prevTasks, newTask].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    };

    const handleSavePractice = (total: number, correct: number) => {
        if (!currentTestId || !topicToUpdate) return;
        
        let currentTestName = '';
        setTests(prevTests => prevTests.map(test => {
            if (test.id !== currentTestId) return test;
            currentTestName = test.name;
            const updatedTopicStatus = test.topicStatus.map(topic => {
                if (topic.microtopic !== topicToUpdate.microtopic || topic.chapter !== topicToUpdate.chapter) return topic;
                const newAttempt: TopicPracticeAttempt = { id: crypto.randomUUID(), totalQuestions: total, correctAnswers: correct };
                return { ...topic, practiceAttempts: [...topic.practiceAttempts, newAttempt] };
            });
            return { ...test, topicStatus: updatedTopicStatus };
        }));
        
        const performanceSummary = generatePerformanceSummary(undefined, total, correct);
        const notes = `Auto-generated from test preparation for "${currentTestName}".` + performanceSummary;

        const newTask: Task = {
            id: crypto.randomUUID(),
            name: `Practice: ${topicToUpdate.microtopic}`,
            subject: topicToUpdate.subject,
            chapter: topicToUpdate.chapter,
            microtopics: [topicToUpdate.microtopic],
            taskType: 'Practice',
            date: new Date().toISOString().split('T')[0],
            status: 'Completed',
            priority: 'High',
            notes: notes,
            totalQuestions: total,
            correctAnswers: correct,
        };
        setTasks(prevTasks => [...prevTasks, newTask].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    };

    const { upcomingTests, completedTests } = useMemo(() => {
        const upcoming: TestPlan[] = [];
        const completed: TestPlan[] = [];
        tests.forEach(test => {
            if (test.status === 'Upcoming') upcoming.push(test);
            else completed.push(test);
        });
        return { upcomingTests: upcoming, completedTests: completed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) };
    }, [tests]);

    const getAvgAccuracy = (attempts: TopicPracticeAttempt[]) => {
        if (attempts.length === 0) return null;
        const totalQ = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);
        const correctQ = attempts.reduce((sum, a) => sum + a.correctAnswers, 0);
        return totalQ > 0 ? (correctQ / totalQ) * 100 : 0;
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
                                    <div>
                                        <p className="font-semibold">{test.name}</p>
                                        <p className="text-sm text-gray-400">{new Date(new Date(test.date).toLocaleString("en-US", { timeZone: "UTC" })).toDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        <Button onClick={() => setExpandedTest(expandedTest === test.id ? null : test.id)} variant="secondary" size="sm">
                                            {expandedTest === test.id ? 'Hide Prep' : 'Start Prep'}
                                        </Button>
                                        <Button onClick={() => setTestToAnalyze(test)} variant="secondary" size="sm">Mark as Complete</Button>
                                        <button onClick={() => deleteTest(test.id)} className="p-1 text-gray-400 hover:text-red-400 transition-colors"><Trash2Icon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                {expandedTest === test.id && (
                                    <div className="w-full bg-black/20 p-4 rounded-lg max-h-[70vh] overflow-y-auto space-y-6">
                                        <div>
                                            <h4 className="font-semibold text-brand-cyan-500 mb-2">AI-Powered Topic Analysis</h4>
                                            {(() => {
                                                const { weakTopics, averageTopics, strongTopics } = analyzeSyllabusForTest(test.syllabus, progressStats);
                                                return <TopicAnalysis weakTopics={weakTopics} averageTopics={averageTopics} strongTopics={strongTopics} />;
                                            })()}
                                        </div>
                                        
                                        <div>
                                            <h4 className="font-semibold text-brand-cyan-500 mb-2">Test Preparation Checklist</h4>
                                            <div className="space-y-4">
                                                {(() => {
                                                    const groupedTopics = test.topicStatus.reduce((acc, topic) => {
                                                        if (!acc[topic.subject]) acc[topic.subject] = {};
                                                        if (!acc[topic.subject][topic.chapter]) acc[topic.subject][topic.chapter] = [];
                                                        acc[topic.subject][topic.chapter].push(topic);
                                                        return acc;
                                                    }, {} as Record<SubjectName, Record<string, TopicStatus[]>>);

                                                    return (Object.keys(groupedTopics) as SubjectName[]).map(subject => (
                                                        <div key={subject}>
                                                            <h5 className="font-bold text-brand-cyan-400 text-sm uppercase tracking-wider bg-brand-cyan-900/50 p-2 rounded-t-md sticky top-0 z-10">
                                                                {subject}
                                                            </h5>
                                                            {Object.keys(groupedTopics[subject]).map(chapter => (
                                                                <div key={chapter} className="mb-2">
                                                                    <p className="font-semibold text-gray-300 bg-black/40 p-2 text-sm">{chapter}</p>
                                                                    <div className="space-y-2 p-2">
                                                                        {groupedTopics[subject][chapter].map(topic => {
                                                                            const avgAccuracy = getAvgAccuracy(topic.practiceAttempts);
                                                                            const dailyStats = progressStats.subjects[topic.subject]
                                                                                ?.chapters[topic.chapter]
                                                                                ?.microtopics[topic.microtopic];
                                                                            
                                                                            const dailyScore = (dailyStats && dailyStats.completed > 0 && (dailyStats.avgDifficulty > 0 || dailyStats.avgAccuracy !== null))
                                                                                ? calculateOverallScore(dailyStats.avgDifficulty, dailyStats.avgAccuracy)
                                                                                : undefined;

                                                                            return (
                                                                                <Card key={topic.microtopic} className="p-3 text-xs">
                                                                                    <p className={cn("font-semibold mb-2", dailyScore !== undefined && getScoreColorClass(dailyScore))}>{topic.microtopic}</p>
                                                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                                                                                        <div className="p-2 bg-slate-900/50 rounded-md">
                                                                                            <p className="font-bold text-gray-400">Daily Perf.</p>
                                                                                            {dailyScore !== undefined ? (
                                                                                                <div className={cn("font-bold text-lg", getScoreColorClass(dailyScore))}>
                                                                                                    {dailyScore.toFixed(0)}
                                                                                                </div>
                                                                                            ) : (
                                                                                                <span className="text-gray-500">No Data</span>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="p-2 bg-slate-900/50 rounded-md flex flex-col justify-between items-center">
                                                                                             <p className="font-bold text-gray-400">Revision</p>
                                                                                             {topic.revisionDifficulty ? (
                                                                                                <span className="font-bold text-lg"> {topic.revisionDifficulty}/5</span>
                                                                                            ) : (
                                                                                                <Button variant="ghost" size="sm" className="mt-1" onClick={() => { setCurrentTestId(test.id); setTopicToUpdate(topic); setRevisionModalOpen(true); }}><BrainIcon className="w-4 h-4 mr-1"/>Revise</Button>
                                                                                            )}
                                                                                        </div>
                                                                                         <div className="p-2 bg-slate-900/50 rounded-md flex flex-col justify-between items-center">
                                                                                            <p className="font-bold text-gray-400">Practice</p>
                                                                                            <div className="flex-grow flex flex-col justify-center">
                                                                                                {avgAccuracy !== null && (
                                                                                                    <span className={cn('font-bold block mb-1 text-lg', avgAccuracy >= 80 ? 'text-green-400' : avgAccuracy >= 50 ? 'text-yellow-400' : 'text-red-400')}>
                                                                                                        {avgAccuracy?.toFixed(0) ?? 'N/A'}%
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                            <Button variant="ghost" size="sm" className="mt-1" onClick={() => { setCurrentTestId(test.id); setTopicToUpdate(topic); setPracticeModalOpen(true); }}><ClipboardCheckIcon className="w-4 h-4 mr-1"/>Practice</Button>
                                                                                        </div>
                                                                                    </div>
                                                                                </Card>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ));
                                                })()}
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
                         {completedTests.map(test => (
                            <Card key={test.id} className="p-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div>
                                        <p className="font-semibold">{test.name} - <span className="text-brand-cyan-400 font-bold">{test.analysis?.marksObtained} / {test.analysis?.totalMarks}</span></p>
                                        <p className="text-sm text-gray-400">{new Date(new Date(test.date).toLocaleString("en-US", { timeZone: "UTC" })).toDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        <Button onClick={() => setViewingTest(test)} variant="secondary" size="sm">View Analysis</Button>
                                        <button onClick={() => deleteTest(test.id)} className="p-1 text-gray-400 hover:text-red-400 transition-colors"><Trash2Icon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : <Card className="p-6 text-center text-gray-400">You haven't completed any tests yet.</Card>}
            </section>
            
            <CreateTestModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onAddTest={addTest} />
            <TestAnalysisModal test={testToAnalyze} onClose={() => setTestToAnalyze(null)} onComplete={completeTest} />
            <ViewAnalysisModal test={viewingTest} onClose={() => setViewingTest(null)} />
            <LogRevisionModal 
                isOpen={isRevisionModalOpen} 
                onClose={() => { setRevisionModalOpen(false); setTopicToUpdate(null); }}
                topicName={topicToUpdate?.microtopic || ''}
                onSave={handleSaveRevision}
            />
            <LogPracticeModal 
                isOpen={isPracticeModalOpen} 
                onClose={() => { setPracticeModalOpen(false); setTopicToUpdate(null); }}
                topicName={topicToUpdate?.microtopic || ''}
                onSave={handleSavePractice}
            />
        </div>
    );
};

export default TestPlanner;