import React from 'react';
import { cn } from '../../lib/utils';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn(
        "bg-slate-900/50 backdrop-blur-xl border border-brand-cyan-500/20 rounded-lg shadow-glow-cyan-light animate-fadeIn",
        className
    )}>
        {children}
    </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost', size?: 'default' | 'sm' }> = ({ children, className, variant = 'primary', size = 'default', ...props }) => {
    const baseClasses = "rounded-md font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const sizeClasses = {
        default: "px-4 py-2 text-sm",
        sm: "px-2 py-1 text-xs",
    };

    const variantClasses = {
        primary: "bg-brand-cyan-500 text-brand-blue-900 hover:bg-brand-cyan-400 shadow-glow-cyan-light hover:shadow-glow-cyan-intense",
        secondary: "bg-white/10 hover:bg-white/20 text-brand-cyan-300 border border-brand-cyan-500/20 hover:border-brand-cyan-500/50",
        danger: "bg-red-500/50 hover:bg-red-500/80 text-white border border-red-500/30 hover:border-red-500/60",
        ghost: "bg-transparent hover:bg-brand-cyan-500/10 text-brand-cyan-300"
    };

    return <button className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)} {...props}>{children}</button>;
};

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, className, ...props }) => (
    <select {...props} className={cn("w-full bg-slate-900/50 border border-brand-cyan-500/20 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-cyan-500 focus:bg-slate-900/70", className)}>
        {children}
    </select>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
     <input {...props} className={cn("w-full bg-slate-900/50 border border-brand-cyan-500/20 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-cyan-500 focus:bg-slate-900/70 placeholder:text-gray-500", className)} />
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => (
    <textarea {...props} className={cn("w-full bg-slate-900/50 border border-brand-cyan-500/20 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-cyan-500 focus:bg-slate-900/70 placeholder:text-gray-500", className)} />
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] animate-fadeIn" onClick={onClose}>
            <div className={cn("bg-brand-blue-900/90 border border-brand-cyan-700 rounded-lg shadow-glow-cyan p-6 w-full backdrop-blur-lg", maxWidth)} onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-brand-cyan-400 mb-4">{title}</h3>
                {children}
            </div>
        </div>
    );
};
