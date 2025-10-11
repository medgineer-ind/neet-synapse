import React, { useMemo, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Task, TestPlan, TaskType, Priority } from '../types';
import { cn } from '../lib/utils';
import { BookOpenIcon, RepeatIcon, TargetIcon, TrophyIcon, BrainCircuitIcon } from './ui/Icons';
import { Card } from './ui/StyledComponents';

type AgendaItem = {
    id: string;
    type: 'task' | 'test';
    data: Task | TestPlan;
    date: Date;
};

const TaskTypeTag: React.FC<{ type: TaskType }> = ({ type }) => {
    const typeStyles: Record<TaskType, { icon: React.ReactElement; className: string }> = {
        Lecture: { icon: <BookOpenIcon className="w-4 h-4" />, className: "bg-brand-amber-900/50 text-brand-amber-300 border-brand-amber-700" },
        Revision: { icon: <RepeatIcon className="w-4 h-4" />, className: "bg-green-900/50 text-green-300 border-green-700" },
        Practice: { icon: <TargetIcon className="w-4 h-4" />, className: "bg-brand-orange-900/50 text-brand-orange-400 border-brand-orange-700" },
        SpacedRevision: { icon: <BrainCircuitIcon className="w-4 h-4" />, className: "bg-cyan-900/50 text-cyan-300 border-cyan-700" },
    };
    const { icon, className } = typeStyles[type];
    return (
        <span className={cn("flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full border", className)}>
            {icon}
            {type === 'SpacedRevision' ? 'Spaced Rev.' : type}
        </span>
    );
};

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
     const priorityStyles: Record<Priority, string> = {
        High: "border-red-500 text-red-400",
        Medium: "border-yellow-500 text-yellow-400",
        Low: "border-blue-500 text-blue-400",
    };
    return (
        <span className={cn("px-2 py-0.5 text-xs font-semibold rounded-md border", priorityStyles[priority])}>
            {priority}
        </span>
    );
}

const AgendaItemCard: React.FC<{ item: AgendaItem; isCompleted?: boolean }> = ({ item, isCompleted = false }) => {
    const isTask = item.type === 'task';
    const data = item.data as Task | TestPlan;

    const baseClasses = "relative pl-8 py-4 pr-4 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-lg";
    const statusClasses = isTask 
        ? (isCompleted ? "border-green-500/50" : "border-brand-amber-700/50") 
        : "border-yellow-500/50";

    const dotClasses = isTask
        ? (isCompleted ? "bg-green-500" : "bg-brand-amber-400")
        : "bg-yellow-500";
    
    return (
        <div className={cn(baseClasses, statusClasses)}>
            <div className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-slate-700", dotClasses)}></div>
            {isTask ? (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold" title={data.name}>{data.name}</p>
                        <p className="text-xs text-gray-400" title={(data as Task).microtopics.join(', ')}>
                           {(data as Task).subject} &gt; {(data as Task).chapter}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
                        <PriorityBadge priority={(data as Task).priority} />
                        <TaskTypeTag type={(data as Task).taskType} />
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <TrophyIcon className="w-6 h-6 text-yellow-400 flex-shrink-0"/>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold" title={data.name}>Test: {data.name}</p>
                        <p className="text-xs text-gray-400">
                           Syllabus includes {Object.values((data as TestPlan).syllabus || {}).filter(Array.isArray).reduce((sum, chapters) => sum + chapters.length, 0)} chapters.
                        </p>
                    </div>
                </div>
            )}
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
                className="form-checkbox h-4 w-4 text-brand-amber-500 bg-slate-800 border-slate-600 rounded focus:ring-brand-amber-500 focus:ring-offset-0 mr-2"
            />
            <span className="text-gray-300 font-display">Show Today's Completed Tasks</span>
        </label>
    </div>
);


const Timeline: React.FC = () => {
    const [tasks] = useLocalStorage<Task[]>('tasks', []);
    const [testPlans] = useLocalStorage<TestPlan[]>('testPlans', []);
    const [showCompleted, setShowCompleted] = useState(false);

    // Fix: Added an explicit return type to useMemo to help TypeScript correctly infer the types.
    const { overdueItems, todayItems, upcomingGrouped, completedTodayTasks } = useMemo<{
        overdueItems: AgendaItem[];
        todayItems: AgendaItem[];
        upcomingGrouped: Record<string, AgendaItem[]>;
        completedTodayTasks: Task[];
    }>(() => {
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
            return { id: item.id, type: type as 'task' | 'test', data: item, date: itemDate };
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
            if (a.date.getTime() !== b.date.getTime()) return a.date.getTime() - b.date.getTime();
            if (a.type === 'test') return -1; // Tests first on the same day
            if (b.type === 'test') return 1;
            return (priorityOrder[(a.data as Task).priority] || 3) - (priorityOrder[(b.data as Task).priority] || 3);
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

    const renderSection = (title: string, items: AgendaItem[], color: string, isCompleted: boolean = false) => (
        <div className="relative pl-8">
            <div className="absolute top-5 left-0 w-0.5 h-full bg-slate-700"></div>
            <div className={cn("absolute left-[-5px] top-0 w-6 h-6 rounded-full flex items-center justify-center", color)}>
                <div className="w-3 h-3 bg-slate-950 rounded-full"></div>
            </div>
            <h2 className={cn("font-display text-2xl font-bold sticky top-20 backdrop-blur-sm py-2 z-10", color.replace('bg-', 'text-'))}>{title}</h2>
            {items.length > 0 ? (
                <div className="space-y-3 mt-2">
                    {items.map(item => <AgendaItemCard key={item.id} item={item} isCompleted={isCompleted} />)}
                </div>
            ) : (
                <Card className="p-6 text-center text-gray-400 mt-2">No items for this period.</Card>
            )}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-4xl font-bold text-brand-amber-400 mb-8 tracking-wide">Agenda</h1>
            <ShowCompletedToggle checked={showCompleted} onChange={setShowCompleted} />

            {!hasPendingItems && (!showCompleted || completedTodayTasks.length === 0) ? (
                 <Card className="p-10 text-center text-gray-400">
                    <p className="font-display text-lg">You're all caught up!</p>
                    <p className="text-sm">No pending tasks or tests for today or the week ahead.</p>
                </Card>
            ) : (
                <div className="space-y-12">
                    {overdueItems.length > 0 && renderSection("Overdue", overdueItems, "bg-red-500")}
                    {todayItems.length > 0 && renderSection("Today", todayItems, "bg-brand-amber-400")}
                    
                    {Object.entries(upcomingGrouped).map(([date, items]) => (
                        <div key={date} className="relative pl-8">
                            <div className="absolute top-5 left-0 w-0.5 h-full bg-slate-700"></div>
                            <div className="absolute left-[-5px] top-0 w-6 h-6 rounded-full flex items-center justify-center bg-yellow-500">
                                <div className="w-3 h-3 bg-slate-950 rounded-full"></div>
                            </div>
                            <h2 className="font-display text-2xl font-bold text-yellow-400 sticky top-20 backdrop-blur-sm py-2 z-10">{formatDateHeader(date)}</h2>
                            <div className="space-y-3 mt-2">
                                {items.map(item => <AgendaItemCard key={item.id} item={item} />)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
             {showCompleted && (
                <div className="mt-12">
                    {/* Fix: Cast `completedTodayTasks` to Task[] to resolve TypeScript inference issue where it was treated as `unknown`. */}
                    {renderSection("Completed Today", (completedTodayTasks as Task[]).map(task => ({ id: task.id, type: 'task', data: task, date: new Date() })), "bg-green-500", true)}
                </div>
            )}
        </div>
    );
};

export default Timeline;