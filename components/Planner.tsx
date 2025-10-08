import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskType, SubjectName, TestPlan, Priority, TaskStatus } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { syllabus } from '../data/syllabus';
import { cn, generatePerformanceSummary } from '../lib/utils';
import { PlusIcon, BookOpenIcon, RepeatIcon, TargetIcon, Trash2Icon, TrophyIcon, ClockIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon, FilterIcon, CalendarPlusIcon, StickyNoteIcon, ChevronDownIcon } from './ui/Icons';
import { Card, Button, Select, Input, Textarea, Modal } from './ui/StyledComponents';

// --- Calendar Component ---
const Calendar: React.FC<{
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  tasks: Task[];
}> = ({ selectedDate, onDateChange, tasks }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const taskDates = useMemo(() => {
    const dates = new Set<string>();
    tasks.forEach(task => {
        const taskDate = new Date(new Date(task.date).toLocaleString("en-US", { timeZone: "UTC" }));
        dates.add(taskDate.toDateString());
    });
    return dates;
  }, [tasks]);

  const changeMonth = (amount: number) => {
    setCurrentMonth(prev => {
        const newMonth = new Date(prev);
        newMonth.setMonth(prev.getMonth() + amount);
        return newMonth;
    });
  };

  const renderCalendarDays = () => {
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="w-full h-10"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isSelected = date.toDateString() === selectedDate.toDateString();
        const isToday = date.toDateString() === new Date().toDateString();
        const hasTask = taskDates.has(date.toDateString());

        days.push(
            <div key={day} className="w-full h-10 flex justify-center items-center">
                <button
                    onClick={() => onDateChange(date)}
                    className={cn(
                        "w-9 h-9 rounded-full flex flex-col items-center justify-center transition-colors duration-200",
                        isSelected ? "bg-brand-cyan-500 text-brand-blue-900 font-bold" :
                        isToday ? "border-2 border-brand-cyan-700" : "hover:bg-white/10",
                    )}
                >
                    {day}
                    {hasTask && <div className={cn("w-1 h-1 rounded-full mt-0.5", isSelected ? 'bg-brand-blue-900' : 'bg-brand-cyan-500')}></div>}
                </button>
            </div>
        );
    }
    return days;
  };

  return (
    <Card className="p-4 sticky top-24">
        <div className="flex items-center justify-between mb-4 px-2">
            <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-white/10"><ChevronLeftIcon className="w-5 h-5" /></button>
            <h3 className="font-semibold text-brand-cyan-400 text-lg">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-white/10"><ChevronRightIcon className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
            {renderCalendarDays()}
        </div>
    </Card>
  );
};


// --- TaskForm Component ---

const TaskForm: React.FC<{
    onAddTask: (task: Omit<Task, 'id' | 'status'>) => void;
    selectedDate: Date;
    onDateChange: (date: Date) => void;
}> = ({ onAddTask, selectedDate, onDateChange }) => {
    const [name, setName] = useState<string>('');
    const [subject, setSubject] = useState<SubjectName>('Physics');
    const [chapter, setChapter] = useState<string>(Object.keys(syllabus.Physics)[0]);
    const [microtopics, setMicrotopics] = useState<string[]>([syllabus.Physics[Object.keys(syllabus.Physics)[0]][0]]);
    const [taskType, setTaskType] = useState<TaskType>('Study');
    const [priority, setPriority] = useState<Priority>('Medium');
    const [date, setDate] = useState<string>(selectedDate.toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    
    useEffect(() => {
        setDate(selectedDate.toISOString().split('T')[0]);
    }, [selectedDate]);
    
    useEffect(() => {
      // Set default microtopic when chapter changes
      if(chapter && syllabus[subject][chapter]) {
        setMicrotopics([syllabus[subject][chapter][0]]);
      }
    }, [chapter, subject]);

    const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSubject = e.target.value as SubjectName;
        setSubject(newSubject);
        const newChapter = Object.keys(syllabus[newSubject])[0];
        setChapter(newChapter);
        setMicrotopics([syllabus[newSubject][newChapter][0]]);
    };

    const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newChapter = e.target.value;
        setChapter(newChapter);
        setMicrotopics([syllabus[subject][newChapter][0]]);
    };
    
    const handleMicrotopicCheckboxChange = (microtopic: string) => {
        setMicrotopics(prev => {
            if (prev.includes(microtopic)) {
                return prev.filter(m => m !== microtopic);
            } else {
                return [...prev, microtopic];
            }
        });
    };
    
    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateString = e.target.value;
        if (dateString) {
            // "YYYY-MM-DD" from input is parsed as UTC midnight. Adjust to local timezone to avoid off-by-one day issues.
            const utcDate = new Date(dateString);
            const localDate = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
            onDateChange(localDate);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || microtopics.length === 0) {
            alert('Please enter a task name and select at least one microtopic.');
            return;
        }
        onAddTask({ name, subject, chapter, microtopics, taskType, date, priority, notes });
        setName('');
        setNotes('');
        setMicrotopics([syllabus[subject][chapter][0]]);
    };

    return (
        <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold text-brand-cyan-400 mb-4">Plan a New Task</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Task Name</label>
                    <Input type="text" placeholder="e.g., Solve 50 MCQs on Newton's Laws" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Subject</label>
                        <Select value={subject} onChange={handleSubjectChange}>{Object.keys(syllabus).map(s => <option key={s} value={s}>{s}</option>)}</Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Chapter</label>
                        <Select value={chapter} onChange={handleChapterChange}>{Object.keys(syllabus[subject]).map(c => <option key={c} value={c}>{c}</option>)}</Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Microtopic(s)</label>
                        <div className="max-h-32 overflow-y-auto bg-slate-900/50 border border-brand-cyan-500/20 rounded-md p-2 space-y-2">
                            {syllabus[subject][chapter]?.map(m => (
                                <label key={m} className="flex items-center space-x-2 cursor-pointer p-1 rounded hover:bg-white/10">
                                    <input
                                        type="checkbox"
                                        checked={microtopics.includes(m)}
                                        onChange={() => handleMicrotopicCheckboxChange(m)}
                                        className="form-checkbox h-4 w-4 text-brand-cyan-500 bg-gray-800 border-gray-600 rounded focus:ring-brand-cyan-500 focus:ring-offset-0"
                                    />
                                    <span className="text-sm">{m}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Task Type</label>
                        <Select value={taskType} onChange={e => setTaskType(e.target.value as TaskType)}>
                            <option value="Study">Study</option>
                            <option value="Revision">Revision</option>
                            <option value="Practice">Practice</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Priority</label>
                         <Select value={priority} onChange={e => setPriority(e.target.value as Priority)}>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <Input type="date" value={date} onChange={handleDateInputChange} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                    <Textarea placeholder="Add any notes for this task..." value={notes} onChange={e => setNotes(e.target.value)} rows={2}/>
                </div>
                 <div className="flex justify-end">
                    <Button type="submit" className="w-full md:w-auto mt-2"><PlusIcon className="w-5 h-5"/> Add Task</Button>
                </div>
            </form>
        </Card>
    );
};

// --- Task Item Sub-components ---

const TaskTypeTag: React.FC<{ type: TaskType }> = ({ type }) => {
    const typeStyles: Record<TaskType, { icon: React.ReactElement; className: string }> = {
        Study: { icon: <BookOpenIcon className="w-4 h-4" />, className: "bg-brand-cyan-500/20 text-brand-cyan-400" },
        Revision: { icon: <RepeatIcon className="w-4 h-4" />, className: "bg-green-500/20 text-green-400" },
        Practice: { icon: <TargetIcon className="w-4 h-4" />, className: "bg-purple-500/20 text-purple-400" },
    };
    const { icon, className } = typeStyles[type];
    return (
        <span className={cn("flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full", className)}>
            {icon}
            {type}
        </span>
    );
};

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
     const priorityStyles: Record<Priority, string> = {
        High: "bg-red-500/80 text-white",
        Medium: "bg-yellow-500/80 text-yellow-900",
        Low: "bg-blue-500/80 text-white",
    };
    return (
        <span className={cn("px-2 py-0.5 text-xs font-semibold rounded-md", priorityStyles[priority])}>
            {priority}
        </span>
    );
}

// --- TaskItem Component ---

const TaskItem: React.FC<{ task: Task; onUpdateTask: (task: Task) => void; onDeleteTask: (id: string) => void; onEditTask: (task: Task) => void; onReschedule: (task: Task) => void; isForTest: boolean }> = ({ task, onUpdateTask, onDeleteTask, onEditTask, onReschedule, isForTest }) => {
    const [isExpanded, setExpanded] = useState(false);
    
    return (
        <div className={cn("bg-slate-900/30 rounded-lg animate-fadeIn transition-all border border-transparent hover:border-brand-cyan-500/20", isForTest && "border-l-4 border-yellow-400")}>
            <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                        {isForTest && <span title="This topic is in an upcoming test"><TrophyIcon className="w-5 h-5 text-yellow-400"/></span>}
                        <PriorityBadge priority={task.priority} />
                        {/* FIX: Wrap icon in a span to apply the title attribute for tooltips, as 'title' is not a valid SVG prop in React. */}
                        {task.notes && <span title="Has notes"><StickyNoteIcon className="w-4 h-4 text-gray-400" /></span>}
                        <p className="font-semibold truncate" title={task.name}>{task.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <TaskTypeTag type={task.taskType} />
                        <p className="text-xs text-gray-400 truncate" title={task.microtopics.join(', ')}>
                           {task.microtopics.join(', ')} ({task.subject} > {task.chapter})
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1 self-end sm:self-center flex-shrink-0">
                    {task.status === 'Pending' ? (
                        <Button onClick={() => onUpdateTask(task)} variant="secondary" size="sm">Complete</Button>
                    ) : (
                        <span className="text-xs font-bold text-green-400 px-2 py-1 bg-green-500/20 rounded-full">Completed</span>
                    )}
                    {task.status === 'Pending' && (
                        <>
                            <button onClick={() => onReschedule(task)} className="p-2 text-gray-400 hover:text-brand-cyan-400 transition-colors" aria-label="Reschedule task">
                                <CalendarPlusIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => onEditTask(task)} className="p-2 text-gray-400 hover:text-brand-cyan-400 transition-colors" aria-label="Edit task">
                                <PencilIcon className="w-4 h-4" />
                            </button>
                        </>
                    )}
                    <button onClick={() => onDeleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors" aria-label="Delete task">
                        <Trash2Icon className="w-4 h-4" />
                    </button>
                     {(task.notes || task.originalDate) && (
                        <button onClick={() => setExpanded(prev => !prev)} className="p-2 text-gray-400 hover:text-brand-cyan-400 transition-colors" aria-label="Show details">
                            <ChevronDownIcon className={cn("w-5 h-5 transition-transform", isExpanded && "rotate-180")} />
                        </button>
                    )}
                </div>
            </div>
            {isExpanded && (task.notes || task.originalDate) && (
                <div className="px-4 pb-4 border-t border-white/10 text-sm text-gray-300 space-y-2 animate-fadeIn">
                    {task.originalDate && <p><strong className="text-gray-400">Originally planned for:</strong> {new Date(new Date(task.originalDate).toLocaleString("en-US", { timeZone: "UTC" })).toLocaleDateString()}</p>}
                    {task.notes && <div><strong className="text-gray-400">Notes:</strong><p className="whitespace-pre-wrap pl-2 mt-1">{task.notes}</p></div>}
                </div>
            )}
        </div>
    );
};

// --- Modal Components ---

const CompleteStudyModal: React.FC<{ task: Task | null; onComplete: (difficulty: number) => void; onClose: () => void }> = ({ task, onComplete, onClose }) => {
    const [difficulty, setDifficulty] = useState(3);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onComplete(difficulty);
    };

    return (
        <Modal isOpen={!!task} onClose={onClose} title={`Complete: ${task?.name}`}>
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
                    <Button type="submit">Save</Button>
                </div>
            </form>
        </Modal>
    );
};

const CompletePracticeModal: React.FC<{ task: Task | null; onComplete: (total: number, correct: number) => void; onClose: () => void }> = ({ task, onComplete, onClose }) => {
    const [total, setTotal] = useState('');
    const [correct, setCorrect] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const totalNum = Number(total);
        const correctNum = Number(correct);
        if (totalNum > 0 && correctNum <= totalNum && correctNum >= 0) {
            onComplete(totalNum, correctNum);
        }
    };

    return (
        <Modal isOpen={!!task} onClose={onClose} title={`Practice Feedback: ${task?.name}`}>
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
                    <Button type="submit">Save</Button>
                </div>
            </form>
        </Modal>
    );
};

const EditTaskModal: React.FC<{ task: Task | null; onUpdate: (task: Task) => void; onClose: () => void }> = ({ task, onUpdate, onClose }) => {
    const [formData, setFormData] = useState<Partial<Task>>({});

    React.useEffect(() => {
        if (task) {
            setFormData(task);
        }
    }, [task]);

    const chaptersForSubject = React.useMemo(() => {
        return formData.subject ? Object.keys(syllabus[formData.subject]) : [];
    }, [formData.subject]);

    const microtopicsForChapter = React.useMemo(() => {
        return (formData.subject && formData.chapter) ? (syllabus[formData.subject][formData.chapter] || []) : [];
    }, [formData.subject, formData.chapter]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMicrotopicCheckboxChangeForEdit = (microtopic: string) => {
        setFormData(prev => {
            const currentMicrotopics = prev.microtopics || [];
            const newMicrotopics = currentMicrotopics.includes(microtopic)
                ? currentMicrotopics.filter(m => m !== microtopic)
                : [...currentMicrotopics, microtopic];
            return { ...prev, microtopics: newMicrotopics };
        });
    };

    const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSubject = e.target.value as SubjectName;
        const newChapter = Object.keys(syllabus[newSubject])[0];
        const newMicrotopics = [syllabus[newSubject][newChapter][0]];
        setFormData({
            ...formData,
            subject: newSubject,
            chapter: newChapter,
            microtopics: newMicrotopics,
        });
    };

    const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newChapter = e.target.value;
        if (!formData.subject) return;
        const newMicrotopics = [syllabus[formData.subject][newChapter][0]];
        setFormData({
            ...formData,
            chapter: newChapter,
            microtopics: newMicrotopics,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name?.trim() || !task) return;
        onUpdate(formData as Task);
    };

    return (
        <Modal isOpen={!!task} onClose={onClose} title="Edit Task">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Task Name</label>
                    <Input type="text" name="name" placeholder="e.g., Solve 50 MCQs on Newton's Laws" value={formData.name || ''} onChange={handleChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Subject</label>
                        <Select name="subject" value={formData.subject || ''} onChange={handleSubjectChange}>{Object.keys(syllabus).map(s => <option key={s} value={s}>{s}</option>)}</Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Chapter</label>
                        <Select name="chapter" value={formData.chapter || ''} onChange={handleChapterChange}>{chaptersForSubject.map(c => <option key={c} value={c}>{c}</option>)}</Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Microtopic(s)</label>
                        <div className="max-h-32 overflow-y-auto bg-slate-900/50 border border-brand-cyan-500/20 rounded-md p-2 space-y-2">
                             {microtopicsForChapter.map(m => (
                                <label key={m} className="flex items-center space-x-2 cursor-pointer p-1 rounded hover:bg-white/10">
                                    <input
                                        type="checkbox"
                                        checked={formData.microtopics?.includes(m) || false}
                                        onChange={() => handleMicrotopicCheckboxChangeForEdit(m)}
                                        className="form-checkbox h-4 w-4 text-brand-cyan-500 bg-gray-800 border-gray-600 rounded focus:ring-brand-cyan-500 focus:ring-offset-0"
                                    />
                                    <span className="text-sm">{m}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label className="block text-sm font-medium mb-1">Task Type</label>
                        <Select name="taskType" value={formData.taskType || ''} onChange={handleChange}>
                            <option value="Study">Study</option>
                            <option value="Revision">Revision</option>
                            <option value="Practice">Practice</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Priority</label>
                         <Select name="priority" value={formData.priority || ''} onChange={handleChange}>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <Input type="date" name="date" value={formData.date || ''} onChange={handleChange} />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                    <Textarea name="notes" placeholder="Add any notes for this task..." value={formData.notes || ''} onChange={handleChange} rows={2}/>
                </div>
                 <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </div>
            </form>
        </Modal>
    );
};

const RescheduleModal: React.FC<{ task: Task | null; onClose: () => void; onReschedule: (task: Task, newDate: string) => void }> = ({ task, onClose, onReschedule }) => {
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    
    useEffect(() => {
        if(task) {
            setNewDate(task.date);
        }
    }, [task]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (task) {
            onReschedule(task, newDate);
        }
    };
    
    return (
        <Modal isOpen={!!task} onClose={onClose} title={`Reschedule: ${task?.name}`}>
            <form onSubmit={handleSubmit}>
                <label className="block text-sm font-medium mb-1">New Date</label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Reschedule</Button>
                </div>
            </form>
        </Modal>
    );
};

const UpcomingTestDeadlines: React.FC<{ testPlans: TestPlan[] }> = ({ testPlans }) => {
    const upcomingTestsWithProgress = useMemo(() => {
        return testPlans
            .filter(p => p.status === 'Upcoming')
            .map(test => {
                const totalTopics = test.topicStatus.length;
                if (totalTopics === 0) {
                    return { ...test, daysLeft: 0, progress: 0 };
                }
                const preparedTopics = test.topicStatus.filter(
                    topic => topic.revisionDifficulty || topic.practiceAttempts.length > 0
                ).length;

                const progress = (preparedTopics / totalTopics) * 100;

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const testDate = new Date(new Date(test.date).toLocaleString("en-US", {timeZone: "UTC"}));
                testDate.setHours(0, 0, 0, 0);

                const timeDiff = testDate.getTime() - today.getTime();
                const daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));

                return { ...test, daysLeft, progress };
            })
            .sort((a, b) => a.daysLeft - b.daysLeft);
    }, [testPlans]);

    if (upcomingTestsWithProgress.length === 0) {
        return null;
    }

    return (
        <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold text-brand-cyan-400 mb-4">Upcoming Test Deadlines</h2>
            <div className="space-y-4">
                {upcomingTestsWithProgress.map(test => (
                    <div key={test.id} className="p-4 bg-slate-900/50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold">{test.name}</span>
                            <span className="flex items-center text-sm text-yellow-300 gap-1">
                                <ClockIcon className="w-4 h-4" /> {test.daysLeft} days left
                            </span>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Preparation Progress</span>
                                <span>{test.progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-black/30 rounded-full h-2.5">
                                <div className="bg-brand-cyan-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${test.progress}%` }}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}


// --- Main Planner Component ---

type FilterState = {
    subject: SubjectName | 'All';
    type: TaskType | 'All';
    priority: Priority | 'All';
    status: TaskStatus | 'All';
}

const Planner: React.FC = () => {
    const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
    const [testPlans] = useLocalStorage<TestPlan[]>('testPlans', []);
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [taskToReschedule, setTaskToReschedule] = useState<Task | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [filters, setFilters] = useState<FilterState>({ subject: 'All', type: 'All', priority: 'All', status: 'All' });
    
    useEffect(() => {
        // One-time migration for old data structure.
        const runMigration = () => {
            setTasks(currentTasks => {
                const needsMigration = currentTasks.some(t => (t as any).microtopic && !t.microtopics);
                if (needsMigration) {
                    console.log("Migrating tasks to new data structure...");
                    return currentTasks.map(t => {
                        const oldTask = t as any;
                        if (oldTask.microtopic && !t.microtopics) {
                            const { microtopic, ...rest } = oldTask;
                            return { ...rest, microtopics: [microtopic] };
                        }
                        return t;
                    });
                }
                return currentTasks; // Return unchanged if no migration needed
            });
        };
        runMigration();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    const upcomingTestTopics = useMemo(() => {
        const topicSet = new Set<string>();
        testPlans
            .filter(p => p.status === 'Upcoming')
            .forEach(p => {
                p.topicStatus.forEach(topic => {
                    topicSet.add(`${topic.subject}-${topic.chapter}-${topic.microtopic}`);
                });
            });
        return topicSet;
    }, [testPlans]);

    const isTaskForTest = (task: Task) => {
        return task.microtopics.some(microtopic => 
            upcomingTestTopics.has(`${task.subject}-${task.chapter}-${microtopic}`)
        );
    };

    const addTask = (taskData: Omit<Task, 'id' | 'status'>) => {
        const newTask: Task = {
            ...taskData,
            id: crypto.randomUUID(),
            status: 'Pending',
        };
        setTasks(prevTasks => [...prevTasks, newTask].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    };

    const handleUpdateTask = (updatedTask: Task) => {
        if (updatedTask.status === 'Pending') {
            setTaskToComplete(updatedTask);
        }
    };
    
    const handleDeleteTask = (id: string) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
        }
    };

    const handleSaveTaskUpdate = (updatedTask: Task) => {
        setTasks(prevTasks => {
            const newTasks = prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t);
            return newTasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
        setTaskToEdit(null);
    };

    const handleConfirmReschedule = (task: Task, newDate: string) => {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, date: newDate, originalDate: t.originalDate || t.date } : t)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setTaskToReschedule(null);
    };

    const handleCompleteStudy = (difficulty: number) => {
        if (!taskToComplete) return;
        const performanceSummary = generatePerformanceSummary(difficulty, undefined, undefined);
        const updatedNotes = (taskToComplete.notes || '') + performanceSummary;

        setTasks(prevTasks => prevTasks.map(t => t.id === taskToComplete.id ? { ...t, status: 'Completed', difficulty, notes: updatedNotes } : t));
        setTaskToComplete(null);
    };

    const handleCompletePractice = (total: number, correct: number) => {
        if (!taskToComplete) return;
        const performanceSummary = generatePerformanceSummary(undefined, total, correct);
        const updatedNotes = (taskToComplete.notes || '') + performanceSummary;

        setTasks(prevTasks => prevTasks.map(t => t.id === taskToComplete.id ? { ...t, status: 'Completed', totalQuestions: total, correctAnswers: correct, notes: updatedNotes } : t));
        setTaskToComplete(null);
    };
    
    const tasksForSelectedDate = useMemo(() => {
        const priorityOrder: Record<Priority, number> = { 'High': 1, 'Medium': 2, 'Low': 3 };
        return tasks.filter(task => {
            const taskDate = new Date(new Date(task.date).toLocaleString("en-US", { timeZone: "UTC" }));
            const dateMatch = taskDate.toDateString() === selectedDate.toDateString();
            const subjectMatch = filters.subject === 'All' || task.subject === filters.subject;
            const typeMatch = filters.type === 'All' || task.taskType === filters.type;
            const priorityMatch = filters.priority === 'All' || task.priority === filters.priority;
            const statusMatch = filters.status === 'All' || task.status === filters.status;
            return dateMatch && subjectMatch && typeMatch && priorityMatch && statusMatch;
        }).sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));
    }, [tasks, selectedDate, filters]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <TaskForm onAddTask={addTask} selectedDate={selectedDate} onDateChange={setSelectedDate} />

                <UpcomingTestDeadlines testPlans={testPlans} />

                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-brand-cyan-400 mb-4">
                        Tasks for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h2>
                     <Card className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                            <div className="md:col-span-1 flex items-center gap-2 text-sm font-semibold">
                                <FilterIcon className="w-5 h-5 text-brand-cyan-400" /> Filters
                            </div>
                            <Select value={filters.subject} onChange={e => setFilters(f => ({ ...f, subject: e.target.value as any}))}>
                                <option value="All">All Subjects</option>
                                {(Object.keys(syllabus) as SubjectName[]).map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                            <Select value={filters.type} onChange={e => setFilters(f => ({...f, type: e.target.value as any}))}>
                                <option value="All">All Types</option>
                                <option value="Study">Study</option>
                                <option value="Revision">Revision</option>
                                <option value="Practice">Practice</option>
                            </Select>
                             <Select value={filters.priority} onChange={e => setFilters(f => ({...f, priority: e.target.value as any}))}>
                                <option value="All">All Priorities</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </Select>
                            <Select value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value as any}))}>
                                <option value="All">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Completed">Completed</option>
                            </Select>
                        </div>
                    </Card>
                </div>

                {tasksForSelectedDate.length === 0 ? (
                    <Card className="p-6 text-center text-gray-400 mt-4">
                        <p>No tasks match your criteria for this day.</p>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {tasksForSelectedDate.map(task => (
                            <TaskItem key={task.id} task={task} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onEditTask={setTaskToEdit} onReschedule={setTaskToReschedule} isForTest={isTaskForTest(task)} />
                        ))}
                    </div>
                )}
            </div>
            
            <div className="lg:col-span-1">
                <Calendar selectedDate={selectedDate} onDateChange={setSelectedDate} tasks={tasks} />
            </div>
            
            <CompleteStudyModal 
                task={taskToComplete && (taskToComplete.taskType === 'Study' || taskToComplete.taskType === 'Revision') ? taskToComplete : null}
                onComplete={handleCompleteStudy}
                onClose={() => setTaskToComplete(null)}
            />
            <CompletePracticeModal 
                task={taskToComplete && taskToComplete.taskType === 'Practice' ? taskToComplete : null}
                onComplete={handleCompletePractice}
                onClose={() => setTaskToComplete(null)}
            />
            <EditTaskModal 
                task={taskToEdit}
                onUpdate={handleSaveTaskUpdate}
                onClose={() => setTaskToEdit(null)}
            />
            <RescheduleModal
                task={taskToReschedule}
                onClose={() => setTaskToReschedule(null)}
                onReschedule={handleConfirmReschedule}
            />
        </div>
    );
};

export default Planner;