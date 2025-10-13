import React from 'react';
import { cn } from '../../lib/utils';
import { XIcon } from './Icons';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn(
        "bg-slate-900/50 backdrop-blur-lg border border-white/10 rounded-lg shadow-lg animate-fadeIn",
        className
    )}>
        {children}
    </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost', size?: 'default' | 'sm' | 'lg' }> = ({ children, className, variant = 'primary', size = 'default', ...props }) => {
    const baseClasses = "rounded-md font-display font-semibold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950";
    
    const sizeClasses = {
        default: "px-5 py-2.5 text-sm",
        sm: "px-3 py-1.5 text-xs",
        lg: "px-8 py-4 text-lg",
    };

    const variantClasses = {
        primary: "bg-brand-amber-400 text-brand-amber-900 hover:bg-brand-amber-300 shadow-glow-amber hover:shadow-glow-amber-lg focus:ring-brand-amber-400",
        secondary: "bg-slate-800/60 hover:bg-slate-700/80 text-brand-amber-300 border border-slate-700 hover:border-brand-amber-500/50 focus:ring-brand-amber-500",
        danger: "bg-red-600/60 hover:bg-red-500/80 text-white border border-red-500/50 hover:border-red-400 focus:ring-red-500",
        ghost: "bg-transparent hover:bg-brand-amber-400/10 text-brand-amber-300 focus:ring-brand-amber-500"
    };

    return <button className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)} {...props}>{children}</button>;
};

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, className, ...props }) => (
    <select {...props} className={cn("w-full bg-slate-900/70 border border-slate-700 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-amber-500 focus:border-brand-amber-500", className)}>
        {children}
    </select>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
     <input {...props} className={cn("w-full bg-slate-900/70 border border-slate-700 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-amber-500 focus:border-brand-amber-500 placeholder:text-gray-500", className)} />
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => (
    <textarea {...props} className={cn("w-full bg-slate-900/70 border border-slate-700 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-amber-500 focus:border-brand-amber-500 placeholder:text-gray-500", className)} />
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-[100] animate-fadeIn overflow-y-auto p-4 sm:p-8" onClick={onClose} role="dialog" aria-modal="true">
            <div className={cn("relative bg-slate-900/80 backdrop-blur-2xl border border-brand-amber-400/20 rounded-lg shadow-glow-amber p-6 w-full my-8", maxWidth)} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display text-2xl font-bold text-brand-amber-400 tracking-wide">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors" aria-label="Close modal">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};