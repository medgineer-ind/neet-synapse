

import React, { useMemo, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Task, TestPlan, TaskType, Priority } from '../types';
import { cn } from '../lib/utils';
import { BookOpenIcon, RepeatIcon, TargetIcon, TrophyIcon } from './ui/Icons';
import { Card } from './ui/StyledComponents';

// Fix: Moved AgendaItem type outside the component so it's available in the render scope.
type AgendaItem = {
    type: 'task' | 'test';
    data: Task | TestPlan;
    date: Date;
};

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
        High: "border-red-500/80 text-red-400",
        Medium: "border-yellow-500/80 text-yellow-400",
        Low: "border-blue-500/80 text-blue-400",
    };
    return (
        <span className={cn("px-2 py-0.5 text-xs font-semibold rounded-md border", priorityStyles[priority])}>
            {priority}
        </span>
    );
}

const AgendaTaskItem: React.FC<{ task: Task, isCompleted?: boolean }> = ({ task, isCompleted = false }) => {
    return (
        <div className={cn(
            "bg-slate-900/50 p-3 rounded-lg border-l-4",
            isCompleted ? "border-green-500/50" : "border-brand-cyan-700/50"
        )}>
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                         <p className="font-semibold" title={task.name}>{task.name}</p>
                    </div>
                     <p className="text-xs text-gray-400" title={task.microtopics.join(', ')}>
                       {task.subject} &gt; {task.chapter} &gt; {task.microtopics.join(', ')}
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
                    <PriorityBadge priority={task.priority} />
                    <TaskTypeTag type={task.taskType} />
                </div>
            </div>
        </div>
    );
};

const AgendaTestItem: React.FC<{ test: TestPlan }> = ({ test }) => {
    return (
         <div className="bg-slate-900/50 p-3 rounded-lg border-l-4 border-yellow-500/50">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <TrophyIcon className="w-5 h-5 text-yellow-400"/>
                        <p className="font-semibold" title={test.name}>Test: {test.name}</p>
                    </div>
                    <p className="text-xs text-gray-400">
                        {/* FIX: The chapter count logic was causing a TypeScript error due to type inference issues with `reduce`. Replaced with a safer `filter` and `reduce` combination to ensure types are handled correctly, especially with potentially malformed data from localStorage. */}
                        Syllabus includes {Object.values(test.syllabus || {}).filter(Array.isArray).reduce((sum, chapters) => sum + chapters.length, 0)} chapters.
                    </p>
                </div>
            </div>
        </div>
    );
};

const ShowCompletedToggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
    <div className="flex items-center justify-end mb-4 -mt-4">
        <label htmlFor="show-completed" className="flex items-center cursor-pointer text-sm">
            <input
                id="show-completed"
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                className="form-checkbox h-4 w-4 text-brand-cyan-500 bg-gray-800 border-gray-600 rounded focus:ring-brand-cyan-500 focus:ring-offset-0 mr-2"
            />
            <span className="text-gray-300">Show Today's Completed Tasks</span>
        </label>
    </div>
);


const Timeline: React.FC = () => {
    const [tasks] = useLocalStorage<Task[]>('tasks', []);
    const [testPlans] = useLocalStorage<TestPlan[]>('testPlans', []);
    const [showCompleted, setShowCompleted] = useState(false);

    const { overdueItems, todayItems, upcomingGrouped, completedTodayTasks } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const oneWeekFromNow = new Date(today);
        oneWeekFromNow.setDate(today.getDate() + 7);

        const allPendingItems: (Task | TestPlan)[] = [
            ...tasks.filter(task => task.status === 'Pending'),
            ...testPlans.filter(test => test.status === 'Upcoming'),
        ];
        

        const items: AgendaItem[] = allPendingItems.map(item => {
            const itemDate = new Date(new Date(item.date).toLocaleString("en-US", { timeZone: "UTC" }));
            itemDate.setHours(0, 0, 0, 0);
            const type = 'chapter' in item && 'microtopics' in item ? 'task' : 'test';
            return { type: type as 'task' | 'test', data: item, date: itemDate };
        });

        const overdueItems: AgendaItem[] = [];
        const todayItems: AgendaItem[] = [];
        const upcomingItems: AgendaItem[] = [];

        items.forEach(item => {
            if (item.date < today) {
                overdueItems.push(item);
            } else if (item.date.getTime() === today.getTime()) {
                todayItems.push(item);
            } else if (item.date > today && item.date <= oneWeekFromNow) {
                upcomingItems.push(item);
            }
        });

        const priorityOrder: Record<Priority, number> = { 'High': 1, 'Medium': 2, 'Low': 3 };
        const sortFn = (a: AgendaItem, b: AgendaItem) => {
            if (a.date < b.date) return -1;
            if (a.date > b.date) return 1;
            if (a.type === 'task' && b.type === 'task') {
                return (priorityOrder[(a.data as Task).priority] || 3) - (priorityOrder[(b.data as Task).priority] || 3);
            }
            return 0;
        };
        
        overdueItems.sort(sortFn);
        todayItems.sort(sortFn);
        upcomingItems.sort(sortFn);

        const upcomingGrouped = upcomingItems.reduce((acc, item) => {
            const dateStr = item.date.toDateString();
            if (!acc[dateStr]) acc[dateStr] = [];
            acc[dateStr].push(item);
            return acc;
        }, {} as Record<string, AgendaItem[]>);

        const completedTodayTasks = tasks
            .filter(task => {
                const taskDate = new Date(new Date(task.date).toLocaleString("en-US", { timeZone: "UTC" }));
                taskDate.setHours(0, 0, 0, 0);
                return task.status === 'Completed' && taskDate.getTime() === today.getTime();
            })
            .sort((a,b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));

        return { overdueItems, todayItems, upcomingGrouped, completedTodayTasks };
    }, [tasks, testPlans]);

    const formatDateHeader = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0,0,0,0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === tomorrow.toDateString()) {
            return "Tomorrow";
        }
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };
    
    const hasPendingItems = overdueItems.length > 0 || todayItems.length > 0 || Object.keys(upcomingGrouped).length > 0;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-brand-cyan-400 mb-8">View Agenda</h1>
            <ShowCompletedToggle checked={showCompleted} onChange={setShowCompleted} />

            {!hasPendingItems && !showCompleted ? (
                 <Card className="p-6 text-center text-gray-400">
                    <p>You're all caught up! No pending tasks or tests for today or the week ahead.</p>
                </Card>
            ) : (
                <div className="space-y-6">
                    {overdueItems.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-red-400 sticky top-20 backdrop-blur-sm py-2 z-10">Overdue</h2>
                            <div className="space-y-2 mt-2">
                                {overdueItems.map(item => 
                                    item.type === 'task'
                                        ? <AgendaTaskItem key={(item.data as Task).id} task={item.data as Task} />
                                        : <AgendaTestItem key={(item.data as TestPlan).id} test={item.data as TestPlan} />
                                )}
                            </div>
                        </div>
                    )}
                    
                    {todayItems.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-brand-cyan-400 sticky top-20 backdrop-blur-sm py-2 z-10">Today's Agenda</h2>
                            <div className="space-y-2 mt-2">
                                {todayItems.map(item =>
                                    item.type === 'task'
                                        ? <AgendaTaskItem key={(item.data as Task).id} task={item.data as Task} />
                                        : <AgendaTestItem key={(item.data as TestPlan).id} test={item.data as TestPlan} />
                                )}
                            </div>
                        </div>
                    )}

                    {Object.keys(upcomingGrouped).length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-yellow-400 sticky top-20 backdrop-blur-sm py-2 z-10">Upcoming (Next 7 Days)</h2>
                             <div className="space-y-4 mt-2">
                                {Object.entries(upcomingGrouped).map(([date, items]) => (
                                    <div key={date}>
                                        <h3 className="font-semibold text-gray-300">{formatDateHeader(date)}</h3>
                                        <div className="space-y-2 mt-1 pl-4 border-l-2 border-white/10">
                                            {/* FIX: Add an Array.isArray check to ensure `items` is an array before mapping over it, preventing runtime errors. */}
                                            {Array.isArray(items) && items.map(item =>
                                                item.type === 'task'
                                                    ? <AgendaTaskItem key={(item.data as Task).id} task={item.data as Task} />
                                                    : <AgendaTestItem key={(item.data as TestPlan).id} test={item.data as TestPlan} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            
             {showCompleted && (
                <div className="mt-8">
                    <h2 className="text-lg font-bold text-green-400 sticky top-20 backdrop-blur-sm py-2 z-10">Completed Today</h2>
                     {completedTodayTasks.length > 0 ? (
                        <div className="space-y-2 mt-2">
                            {completedTodayTasks.map(task => <AgendaTaskItem key={task.id} task={task} isCompleted />)}
                        </div>
                    ) : (
                        <Card className="p-6 text-center text-gray-400 mt-2">
                            <p>No tasks completed today. Keep going!</p>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default Timeline;