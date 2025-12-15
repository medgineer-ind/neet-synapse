
import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskType, SubjectName, TestPlan, Priority, TaskStatus, ActiveTimer, RevisionAttempt } from '../types';
import { syllabus } from '../data/syllabus';
import { cn, formatDuration } from '../lib/utils';
import { PlusIcon, BookOpenIcon, RepeatIcon, TargetIcon, Trash2Icon, TrophyIcon, ClockIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon, FilterIcon, CalendarPlusIcon, StickyNoteIcon, ChevronDownIcon, PlayIcon, BrainCircuitIcon, CheckCircleIcon, AlertTriangleIcon } from './ui/Icons';
import { Card, Button, Select, Input, Textarea, Modal } from './ui/StyledComponents';
import { db } from '../services/db';
import { useLiveQuery } from 'dexie-react-hooks';

// --- Calendar Component ---
const Calendar: React.FC<{
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}> = ({ selectedDate, onDateChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const { monthStart, monthEnd } = useMemo(() => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    return { 
        monthStart: start.toISOString().split('T')[0],
        monthEnd: end.toISOString().split('T')[0]
    };
  }, [currentMonth]);

  const tasksForMonth = useLiveQuery(() => 
      db.tasks.where('date').between(monthStart, monthEnd, true, true).toArray()
  , [monthStart, monthEnd]);

  const taskDates = useMemo(() => {
    const dates = new Map<string, Priority>();
    if (!tasksForMonth) return dates;
    tasksForMonth.forEach(task => {
        const taskDate = new Date(new Date(task.date).toLocaleString("en-US", { timeZone: "UTC" })).toDateString();
        const priorityOrder: Record<Priority, number> = { High: 1, Medium: 2, Low: 3 };
        if (!dates.has(taskDate) || priorityOrder[task.priority] < priorityOrder[dates.get(taskDate)!]) {
            dates.set(taskDate, task.priority);
        }
    });
    return dates;
  }, [tasksForMonth]);

  useEffect(() => {
    setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

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
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`empty-${i}`} className="w-full h-10"></div>);

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = date.toDateString();
        const isSelected = dateString === selectedDate.toDateString();
        const isToday = dateString === new Date().toDateString();
        const taskPriority = taskDates.get(dateString);

        const priorityDotColor: Record<Priority, string> = {
            High: "bg-red-500",
            Medium: "bg-yellow-500",
            Low: "bg-blue-500",
        };

        days.push(
            <div key={day} className="w-full h-10 flex justify-center items-center">
                <button
                    onClick={() => onDateChange(date)}
                    className={cn(
                        "w-9 h-9 rounded-full flex flex-col items-center justify-center transition-all duration-200 relative",
                        isSelected ? "bg-brand-amber-400 text-brand-amber-900 font-bold ring-2 ring-brand-amber-400 ring-offset-2 ring-offset-slate-800" :
                        isToday ? "border-2 border-brand-amber-700 text-brand-amber-400" : "hover:bg-slate-700/50",
                    )}
                >
                    {day}
                    {taskPriority && <div className={cn("w-1.5 h-1.5 rounded-full absolute bottom-1.5", priorityDotColor[taskPriority])}></div>}
                </button>
            </div>
        );
    }
    return days;
  };

  return (
    <Card className="p-4 sticky top-24">
        <div className="flex items-center justify-between mb-4 px-2">
            <Button onClick={() => changeMonth(-1)} variant="ghost" size="sm" className="p-2"><ChevronLeftIcon className="w-5 h-5" /></Button>
            <h3 className="font-display font-semibold text-brand-amber-400 text-xl tracking-wide">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <Button onClick={() => changeMonth(1)} variant="ghost" size="sm" className="p-2"><ChevronRightIcon className="w-5 h-5" /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-display text-gray-400 mb-2">
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
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    onClose: () => void;
}> = ({ selectedDate, onDateChange, onClose }) => {
    const [name, setName] = useState<string>('');
    const [subject, setSubject] = useState<SubjectName>('Physics');
    const [chapter, setChapter] = useState<string>(Object.keys(syllabus.Physics)[0]);
    const [microtopics, setMicrotopics] = useState<string[]>([syllabus.Physics[Object.keys(syllabus.Physics)[0]][0]]);
    const [taskType, setTaskType] = useState<TaskType>('Lecture');
    const [priority, setPriority] = useState<Priority>('Medium');
    const [date, setDate] = useState<string>(selectedDate.toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    
    useEffect(() => {
        setDate(selectedDate.toISOString().split('T')[0]);
    }, [selectedDate]);
    
    useEffect(() => {
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
        const newTask: Task = {
            id: crypto.randomUUID(),
            name, subject, chapter, microtopics, taskType, date, priority, notes,
            status: 'Pending',
            sessions: [],
        };
        db.tasks.add(newTask);
        setName('');
        setNotes('');
        setMicrotopics([syllabus[subject][chapter][0]]);
        onClose();
    };

    return (
        <Card className="p-6">
            <h2 className="font-display text-2xl font-bold text-brand-amber-400 mb-4 tracking-wide">Plan a New Task</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 font-display">Task Name</label>
                    <Input type="text" placeholder="e.g., Solve 50 MCQs on Newton's Laws" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 font-display">Subject</label>
                        <Select value={subject} onChange={handleSubjectChange}>{Object.keys(syllabus).map(s => <option key={s} value={s}>{s}</option>)}</Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 font-display">Chapter</label>
                        <Select value={chapter} onChange={handleChapterChange}>{Object.keys(syllabus[subject]).map(c => <option key={c} value={c}>{c}</option>)}</Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 font-display">Microtopic(s)</label>
                        <div className="max-h-36 overflow-y-auto bg-slate-900/50 border border-slate-700 rounded-md p-2 space-y-2">
                            {syllabus[subject][chapter]?.map(m => (
                                <label key={m} className="flex items-center space-x-2 cursor-pointer p-1 rounded hover:bg-white/10">
                                    <input
                                        type="checkbox"
                                        checked={microtopics.includes(m)}
                                        onChange={() => handleMicrotopicCheckboxChange(m)}
                                        className="form-checkbox h-4 w-4 text-brand-amber-500 bg-slate-800 border-slate-600 rounded focus:ring-brand-amber-500 focus:ring-offset-0"
                                    />
                                    <span className="text-sm">{m}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 font-display">Task Type</label>
                        <Select value={taskType} onChange={e => setTaskType(e.target.value as TaskType)}>
                            <option value="Lecture">Lecture</option>
                            <option value="Revision">Revision</option>
                            <option value="Practice">Practice</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 font-display">Priority</label>
                         <Select value={priority} onChange={e => setPriority(e.target.value as Priority)}>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 font-display">Date</label>
                        <Input type="date" value={date} onChange={handleDateInputChange} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 font-display">Notes (Optional)</label>
                    <Textarea placeholder="Add any notes for this task..." value={notes} onChange={e => setNotes(e.target.value)} rows={2}/>
                </div>
                 <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit"><PlusIcon className="w-5 h-5"/> Add Task</Button>
                </div>
            </form>
        </Card>
    );
};

// --- Task Item Sub-components ---

const TaskTypeTag: React.FC<{ type: TaskType }> = ({ type }) => {
    const typeStyles: Record<string, { icon: React.ReactElement; className: string }> = {
        Lecture: { icon: <BookOpenIcon className="w-4 h-4" />, className: "bg-brand-amber-900/50 text-brand-amber-300 border-brand-amber-700" },
        Revision: { icon: <RepeatIcon className="w-4 h-4" />, className: "bg-green-900/50 text-green-300 border-green-700" },
        Practice: { icon: <TargetIcon className="w-4 h-4" />, className: "bg-brand-orange-900/50 text-brand-orange-400 border-brand-orange-700" },
        Notes: { icon: <StickyNoteIcon className="w-4 h-4" />, className: "bg-slate-700/50 text-slate-300 border-slate-600" },
        RevisionHW: { icon: <RepeatIcon className="w-4 h-4" />, className: "bg-teal-900/50 text-teal-300 border-teal-700" },
        Revision4th: { icon: <RepeatIcon className="w-4 h-4" />, className: "bg-cyan-900/50 text-cyan-300 border-cyan-700" },
        Practice7th: { icon: <TargetIcon className="w-4 h-4" />, className: "bg-violet-900/50 text-violet-300 border-violet-700" },
        Practice9th: { icon: <TargetIcon className="w-4 h-4" />, className: "bg-pink-900/50 text-pink-300 border-pink-700" },
        SpacedRevision: { icon: <BrainCircuitIcon className="w-4 h-4" />, className: "bg-cyan-900/50 text-cyan-300 border-cyan-700" }, // Fallback
    };
    
    // Handle fallback if type not found (shouldn't happen with updated types but safe)
    const style = typeStyles[type] || typeStyles['Revision'];
    
    const labels: Record<string, string> = {
        Lecture: 'Lecture',
        Revision: 'Revision',
        Practice: 'Practice',
        Notes: 'Notes',
        RevisionHW: 'Rev & HW',
        Revision4th: '4th Day Rev',
        Practice7th: '7th Day Prac',
        Practice9th: '9th Day Prac',
    };

    return (
        <span className={cn("flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full border", style.className)}>
            {style.icon}
            {labels[type] || type}
        </span>
    );
};


// --- TaskItem Component ---
const TaskItem: React.FC<{ 
    task: Task; 
    onCompleteTask: (task: Task) => void; 
    onDeleteTask: (id: string) => void; 
    onEditTask: (task: Task) => void; 
    onReschedule: (task: Task) => void;
    isForTest: boolean;
    startTimer: (task: Task) => void;
    activeTimer: ActiveTimer | null;
}> = ({ task, onCompleteTask, onDeleteTask, onEditTask, onReschedule, isForTest, startTimer, activeTimer }) => {
    const [isExpanded, setExpanded] = useState(false);
    const isTimerActiveForThisTask = activeTimer?.task?.id === task.id;
    const totalDuration = useMemo(() => (task.sessions || []).reduce((sum, s) => sum + s.duration, 0), [task.sessions]);
    
    const linkedTasks = useLiveQuery(
        () => task.taskType === 'Lecture' && task.status === 'Completed'
            ? db.tasks.where({ sourceLectureTaskId: task.id as string }).toArray()
            : Promise.resolve([]),
        [task.id, task.taskType, task.status]
    );

    const priorityClasses: Record<Priority, string> = {
        High: "border-l-red-500",
        Medium: "border-l-yellow-500",
        Low: "border-l-blue-500",
    };

    const workflowSteps = useMemo(() => {
        if (!linkedTasks) return [];
        // Sort specifically for display
        const orderMap: Record<string, number> = {
            'Notes': 1,
            'RevisionHW': 2,
            'Revision4th': 3,
            'Practice7th': 4,
            'Practice9th': 5
        };
        
        return linkedTasks.sort((a,b) => (orderMap[a.taskType] || 99) - (orderMap[b.taskType] || 99));
    }, [linkedTasks]);

    const hasDetails = task.notes || task.originalDate || (task.taskType === 'Lecture' && workflowSteps.length > 0);

    return (
        <div className={cn(
            "relative bg-slate-900/50 backdrop-blur-md rounded-lg border border-white/10 transition-all duration-300 group overflow-hidden border-l-4", 
            priorityClasses[task.priority],
            isTimerActiveForThisTask && "animate-pulseGlow border-brand-amber-400"
        )}>
            <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                        {isForTest && <span title="This topic is in an upcoming test"><TrophyIcon className="w-5 h-5 text-yellow-400"/></span>}
                        {task.notes && <span title="Has notes"><StickyNoteIcon className="w-4 h-4 text-gray-400" /></span>}
                        <p className="font-semibold text-gray-100 truncate" title={task.name}>{task.name}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <TaskTypeTag type={task.taskType} />
                        {totalDuration > 0 && (
                            <span className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-blue-900/50 text-blue-300 border border-blue-700" title="Total time logged">
                                <ClockIcon className="w-4 h-4" />
                                {formatDuration(totalDuration)}
                            </span>
                        )}
                        <p className="text-xs text-gray-400 truncate" title={task.microtopics.join(', ')}>
                           {task.microtopics.join(', ')} ({task.chapter})
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1 self-end sm:self-center flex-shrink-0 transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100">
                    {task.status === 'Pending' ? (
                        <>
                            <Button onClick={() => onCompleteTask(task)} variant="secondary" size="sm">Complete</Button>
                            {!isTimerActiveForThisTask && (
                                <Button 
                                    onClick={() => startTimer(task)} 
                                    variant="ghost" 
                                    size="sm" 
                                    className="p-2" 
                                    aria-label="Start timer"
                                    disabled={!!activeTimer}
                                >
                                    <PlayIcon className="w-4 h-4"/>
                                </Button>
                            )}
                        </>
                    ) : (
                        <span className="text-sm font-bold text-green-400 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">Completed</span>
                    )}
                    {task.status === 'Pending' && (
                        <>
                            <Button onClick={() => onReschedule(task)} variant="ghost" size="sm" className="p-2" aria-label="Reschedule task">
                                <CalendarPlusIcon className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => onEditTask(task)} variant="ghost" size="sm" className="p-2" aria-label="Edit task">
                                <PencilIcon className="w-4 h-4" />
                            </Button>
                        </>
                    )}
                    <Button onClick={() => onDeleteTask(task.id)} variant="ghost" size="sm" className="p-2 hover:bg-red-500/10 hover:text-red-400" aria-label="Delete task">
                        <Trash2Icon className="w-4 h-4" />
                    </Button>
                     {hasDetails && (
                        <Button onClick={() => setExpanded(prev => !prev)} variant="ghost" size="sm" className="p-2" aria-label="Show details">
                            <ChevronDownIcon className={cn("w-5 h-5 transition-transform", isExpanded && "rotate-180")} />
                        </Button>
                    )}
                </div>
            </div>
            {isExpanded && hasDetails && (
                <div className="px-4 pb-4 border-t border-white/10 text-sm text-gray-300 space-y-2 animate-fadeIn">
                    {task.originalDate && <p><strong className="text-gray-400 font-display">Originally planned for:</strong> {new Date(new Date(task.originalDate).toLocaleString("en-US", { timeZone: "UTC" })).toLocaleDateString()}</p>}
                    {task.notes && <div><strong className="text-gray-400 font-display">Notes:</strong><p className="whitespace-pre-wrap pl-2 mt-1 font-mono text-xs">{task.notes}</p></div>}
                    
                    {task.taskType === 'Lecture' && workflowSteps.length > 0 && (
                        <div className="pt-3 mt-3 border-t border-white/10">
                            <strong className="text-gray-400 font-display">Related Subtasks & Schedule:</strong>
                            <div className="space-y-3 mt-2 pl-2">
                                {workflowSteps.map(stepTask => {
                                    const isCompleted = stepTask.status === 'Completed';
                                    const taskDate = new Date(new Date(stepTask.date).toLocaleString("en-US", { timeZone: "UTC" }));
                                    const isOverdue = !isCompleted && taskDate < new Date(new Date().setHours(0,0,0,0));
                                    
                                    return (
                                        <div key={stepTask.id} className="flex items-start gap-3 text-xs">
                                            {isCompleted ? (
                                                <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                            ) : isOverdue ? (
                                                <AlertTriangleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <ClockIcon className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                            )}
                                            
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <span className={cn("font-semibold", isCompleted ? "text-green-300" : isOverdue ? "text-red-300" : "text-gray-300")}>
                                                        {stepTask.name.replace(`: ${task.name}`, '')} 
                                                    </span>
                                                    <span className="text-gray-500">{new Date(stepTask.date).toLocaleDateString()}</span>
                                                </div>
                                                {isCompleted && (
                                                    <div className="text-gray-400 mt-0.5">
                                                        {stepTask.difficulty && <span>Diff: <strong className="text-gray-300">{stepTask.difficulty}/5</strong></span>}
                                                        {stepTask.totalQuestions && <span> | Acc: <strong className="text-gray-300">{((stepTask.correctAnswers || 0) / stepTask.totalQuestions * 100).toFixed(0)}%</strong></span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


// --- Modal Components ---

const EditTaskModal: React.FC<{ task: Task | null; onClose: () => void }> = ({ task, onClose }) => {
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
        db.tasks.update(task.id, formData);
        onClose();
    };

    return (
        <Modal isOpen={!!task} onClose={onClose} title="Edit Task">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 font-display">Task Name</label>
                    <Input type="text" name="name" placeholder="e.g., Solve 50 MCQs on Newton's Laws" value={formData.name || ''} onChange={handleChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 font-display">Subject</label>
                        <Select name="subject" value={formData.subject || ''} onChange={handleSubjectChange}>{Object.keys(syllabus).map(s => <option key={s} value={s}>{s}</option>)}</Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 font-display">Chapter</label>
                        <Select name="chapter" value={formData.chapter || ''} onChange={handleChapterChange}>{chaptersForSubject.map(c => <option key={c} value={c}>{c}</option>)}</Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 font-display">Microtopic(s)</label>
                        <div className="max-h-36 overflow-y-auto bg-slate-900/50 border border-slate-700 rounded-md p-2 space-y-2">
                             {microtopicsForChapter.map(m => (
                                <label key={m} className="flex items-center space-x-2 cursor-pointer p-1 rounded hover:bg-white/10">
                                    <input
                                        type="checkbox"
                                        checked={formData.microtopics?.includes(m) || false}
                                        onChange={() => handleMicrotopicCheckboxChangeForEdit(m)}
                                        className="form-checkbox h-4 w-4 text-brand-amber-500 bg-slate-800 border-slate-600 rounded focus:ring-brand-amber-500 focus:ring-offset-0"
                                    />
                                    <span className="text-sm">{m}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label className="block text-sm font-medium mb-1 font-display">Task Type</label>
                        <Select name="taskType" value={formData.taskType || ''} onChange={handleChange}>
                            <option value="Lecture">Lecture</option>
                            <option value="Revision">Revision</option>
                            <option value="Practice">Practice</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 font-display">Priority</label>
                         <Select name="priority" value={formData.priority || ''} onChange={handleChange}>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 font-display">Date</label>
                        <Input type="date" name="date" value={formData.date || ''} onChange={handleChange} />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1 font-display">Notes (Optional)</label>
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

const RescheduleModal: React.FC<{ task: Task | null; onClose: () => void }> = ({ task, onClose }) => {
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    
    useEffect(() => {
        if(task) {
            setNewDate(task.date);
        }
    }, [task]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (task) {
            db.tasks.update(task.id, { date: newDate, originalDate: task.originalDate || task.date });
            onClose();
        }
    };
    
    return (
        <Modal isOpen={!!task} onClose={onClose} title={`Reschedule: ${task?.name}`}>
            <form onSubmit={handleSubmit}>
                <label className="block text-sm font-medium mb-1 font-display">New Date</label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Reschedule</Button>
                </div>
            </form>
        </Modal>
    );
};

const UpcomingTestDeadlines: React.FC = () => {
    const testPlans = useLiveQuery(() => db.testPlans.toArray(), []);

    const upcomingTestsWithProgress = useMemo(() => {
        if (!testPlans) return [];
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

    if (!upcomingTestsWithProgress || upcomingTestsWithProgress.length === 0) {
        return null;
    }

    return (
        <Card className="p-6">
            <h2 className="font-display text-2xl font-bold text-brand-amber-400 mb-4 tracking-wide">Upcoming Test Deadlines</h2>
            <div className="space-y-4">
                {upcomingTestsWithProgress.map(test => (
                    <div key={test.id} className="p-4 bg-slate-800/50 rounded-lg border border-white/10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold">{test.name}</span>
                            <span className="flex items-center text-sm text-yellow-300 gap-1 font-display">
                                <ClockIcon className="w-4 h-4" /> {test.daysLeft} days left
                            </span>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Preparation Progress</span>
                                <span>{test.progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-2.5">
                                <div className="bg-gradient-to-r from-brand-amber-700 to-brand-amber-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${test.progress}%` }}></div>
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

interface PlannerProps {
    activeTimer: ActiveTimer | null;
    startTimer: (task: Task) => void;
    onCompleteTask: (task: Task) => void;
}

const Planner: React.FC<PlannerProps> = ({ activeTimer, startTimer, onCompleteTask }) => {
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [taskToReschedule, setTaskToReschedule] = useState<Task | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [filters, setFilters] = useState<FilterState>({ subject: 'All', type: 'All', priority: 'All', status: 'All' });
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    const testPlans = useLiveQuery(() => db.testPlans.where('status').equals('Upcoming').toArray(), []);

    const upcomingTestTopics = useMemo(() => {
        if (!testPlans) return new Set<string>();
        const topicSet = new Set<string>();
        testPlans.forEach(p => {
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

    const handleDeleteTask = (id: string) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            db.tasks.delete(id);
        }
    };
    
    const tasksForSelectedDate = useLiveQuery(() => {
        const selectedDateString = selectedDate.toISOString().split('T')[0];
        return db.tasks.where('date').equals(selectedDateString).toArray();
    }, [selectedDate]);

    const filteredAndSortedTasks = useMemo(() => {
        if (!tasksForSelectedDate) return [];
        const priorityOrder: Record<Priority, number> = { 'High': 1, 'Medium': 2, 'Low': 3 };

        return tasksForSelectedDate.filter(task => {
            const subjectMatch = filters.subject === 'All' || task.subject === filters.subject;
            const typeMatch = filters.type === 'All' || task.taskType === filters.type;
            const priorityMatch = filters.priority === 'All' || task.priority === filters.priority;
            const statusMatch = filters.status === 'All' || task.status === filters.status;
            return subjectMatch && typeMatch && priorityMatch && statusMatch;
        }).sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));
    }, [tasksForSelectedDate, filters]);

    const handleClearFilters = () => {
        setFilters({ subject: 'All', type: 'All', priority: 'All', status: 'All' });
        setIsFilterOpen(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {isTaskFormOpen ? (
                    <TaskForm 
                        selectedDate={selectedDate} 
                        onDateChange={setSelectedDate} 
                        onClose={() => setIsTaskFormOpen(false)}
                    />
                ) : (
                    <Button
                        onClick={() => setIsTaskFormOpen(true)}
                        size="lg"
                        className="w-full animate-fadeIn"
                    >
                        <PlusIcon className="w-5 h-5" /> Plan a New Task
                    </Button>
                )}

                <UpcomingTestDeadlines />

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-display text-2xl font-bold text-brand-amber-400 tracking-wide">
                            Tasks for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h2>
                        <Button
                            onClick={() => setIsFilterOpen(prev => !prev)}
                            variant="secondary"
                            size="sm"
                        >
                            <FilterIcon className="w-4 h-4" /> Filter
                        </Button>
                    </div>
                     
                    {isFilterOpen && (
                         <Card className="p-4 mb-4 animate-fadeIn">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                                <Select value={filters.subject} onChange={e => setFilters(f => ({ ...f, subject: e.target.value as any}))}>
                                    <option value="All">All Subjects</option>
                                    {(Object.keys(syllabus) as SubjectName[]).map(s => <option key={s} value={s}>{s}</option>)}
                                </Select>
                                <Select value={filters.type} onChange={e => setFilters(f => ({...f, type: e.target.value as any}))}>
                                    <option value="All">All Types</option>
                                    <option value="Lecture">Lecture</option>
                                    <option value="Revision">Revision</option>
                                    <option value="Practice">Practice</option>
                                    <option value="Notes">Notes</option>
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
                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/10">
                                <Button variant="secondary" size="sm" onClick={handleClearFilters}>Clear</Button>
                                <Button size="sm" onClick={() => setIsFilterOpen(false)}>Apply</Button>
                            </div>
                        </Card>
                    )}

                    {filteredAndSortedTasks.length === 0 ? (
                        <Card className="p-10 text-center text-gray-400 mt-4">
                            <p className="font-display text-lg">No tasks match your criteria for this day.</p>
                            <p className="text-sm">Try adjusting the filters or planning a new task!</p>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {filteredAndSortedTasks.map(task => (
                                <TaskItem 
                                    key={task.id} 
                                    task={task} 
                                    onCompleteTask={onCompleteTask} 
                                    onDeleteTask={handleDeleteTask} 
                                    onEditTask={setTaskToEdit} 
                                    onReschedule={setTaskToReschedule} 
                                    isForTest={isTaskForTest(task)}
                                    startTimer={startTimer}
                                    activeTimer={activeTimer}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="lg:col-span-1">
                <Calendar selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </div>

            <EditTaskModal 
                task={taskToEdit}
                onClose={() => setTaskToEdit(null)}
            />
            <RescheduleModal
                task={taskToReschedule}
                onClose={() => setTaskToReschedule(null)}
            />
        </div>
    );
};

export default Planner;
