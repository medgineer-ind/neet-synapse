


import React, { useRef } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Task } from '../types';
import { cn } from '../lib/utils';
import { ShareIcon } from './ui/Icons';
import { Card, Button } from './ui/StyledComponents';

const Settings: React.FC = () => {
    const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleReset = () => {
        if (window.confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
            setTasks([]);
            alert('All data has been reset.');
        }
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.download = `neet-synapse-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const importedTasks = JSON.parse(text);
                    // Basic validation
                    if (Array.isArray(importedTasks) && (importedTasks.length === 0 || 'id' in importedTasks[0])) {
                        if (window.confirm(`This will overwrite your current data with ${importedTasks.length} tasks. Continue?`)) {
                            setTasks(importedTasks);
                            alert('Data imported successfully!');
                        }
                    } else {
                        throw new Error('Invalid file format.');
                    }
                }
            } catch (error) {
                alert('Failed to import data. Please check the file format.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        // Reset file input
        event.target.value = '';
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-brand-cyan-400 mb-8">Settings</h1>

            <Card className="mb-8">
                <h2 className="text-xl font-semibold text-brand-cyan-500 mb-4">About NEET Synapse</h2>
                <p className="text-gray-300 mb-4">
                    Developed with passion by <strong className="text-brand-cyan-400">medgineer</strong>. I am dedicated to bridging the gap between medicine and technology. Join me on this journey to innovate the future of healthcare and education.
                </p>
                <div className="space-y-2 mb-4">
                    <p className="font-semibold text-gray-200">Connect with me:</p>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                        <li>Telegram: <a href="https://t.me/medgineer" target="_blank" rel="noopener noreferrer" className="text-brand-cyan-400 hover:underline">medgineer</a></li>
                        <li>Instagram: <a href="https://www.instagram.com/medgineer.ind?igsh=YzljYTk1ODg3Zg==" target="_blank" rel="noopener noreferrer" className="text-brand-cyan-400 hover:underline">medgineer.ind</a></li>
                        <li>YouTube: <a href="https://youtube.com/@medgineer-ind?si=QOiBLWvUIx1VVpSm" target="_blank" rel="noopener noreferrer" className="text-brand-cyan-400 hover:underline">medgineer-ind</a></li>
                    </ul>
                </div>
                 
                <div className="border-t border-white/10 my-4"></div>
                <div className="flex items-start gap-3">
                    <ShareIcon className="w-5 h-5 text-brand-cyan-400 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-semibold text-gray-200">Appreciate My Work?</h3>
                        <p className="text-gray-300 text-sm mt-1">
                            If you find NEET Synapse helpful, please share it with your friends. Your support helps this project grow and reach more students!
                        </p>
                    </div>
                </div>
                <div className="border-t border-white/10 mt-4"></div>
                
                 <Button 
                    onClick={() => window.open('https://youtube.com/@medgineer-ind?si=QOiBLWvUIx1VVpSm', '_blank')}
                    variant="secondary"
                    className="w-full mt-4"
                >
                    Get Tutorial
                </Button>
            </Card>
            
            <Card className="mb-8">
                <h2 className="text-xl font-semibold text-brand-cyan-500 mb-2">Data Management</h2>
                <p className="text-gray-400 mb-6">Backup your data or start fresh.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={handleExport} variant="secondary" disabled={tasks.length === 0}>
                        Export Data
                    </Button>
                    <Button onClick={handleImportClick} variant="secondary">
                        Import Data
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        className="hidden"
                        accept="application/json"
                    />
                </div>
            </Card>

            <Card>
                <h2 className="text-xl font-semibold text-red-400 mb-2">Danger Zone</h2>
                <p className="text-gray-400 mb-6">This action is irreversible. Please be certain.</p>
                <Button onClick={handleReset} variant="danger">
                    Reset All Data
                </Button>
            </Card>
        </div>
    );
};

export default Settings;