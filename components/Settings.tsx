
import React, { useRef, useState, useEffect } from 'react';
import { Task, TestPlan } from '../types';
import { ShareIcon, AlertTriangleIcon, CalendarClockIcon } from './ui/Icons';
import { Card, Button, Input } from './ui/StyledComponents';
import { db, setMiscItem, getMiscItem } from '../services/db';
import { cn } from '../lib/utils';

const Settings: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [targetDate, setTargetDate] = useState('');

    useEffect(() => {
        getMiscItem('targetDate', '').then((date) => {
            if (date) setTargetDate(date);
            else {
                // Default to 139 days from now if not set
                const d = new Date();
                d.setDate(d.getDate() + 139);
                setTargetDate(d.toISOString().split('T')[0]);
            }
        });
    }, []);

    const handleReset = async () => {
        if (window.confirm('Are you sure you want to delete all your data (tasks and test plans)? This action cannot be undone.')) {
            await db.tasks.clear();
            await db.testPlans.clear();
            alert('All data has been reset.');
        }
    };

    const handleSavePreferences = async () => {
        await setMiscItem('targetDate', targetDate);
        alert('Exam date updated successfully.');
        window.location.reload(); // Reload to apply global context changes efficiently
    };

    const handleExport = async () => {
        const tasks = await db.tasks.toArray();
        const testPlans = await db.testPlans.toArray();
        
        const dataToExport = {
            tasks,
            testPlans,
            version: '1.0'
        };
        const dataStr = JSON.stringify(dataToExport, null, 2);
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
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const importedData = JSON.parse(text);
                    const isNewFormat = importedData && Array.isArray(importedData.tasks) && Array.isArray(importedData.testPlans);
                    const isOldFormat = Array.isArray(importedData) && (importedData.length === 0 || 'id' in importedData[0]);

                    if (isNewFormat) {
                        if (window.confirm(`This will overwrite your current data with ${importedData.tasks.length} tasks and ${importedData.testPlans.length} test plans. Continue?`)) {
                            
                            await db.transaction('rw', db.tasks, db.testPlans, async () => {
                                await db.tasks.clear();
                                await db.testPlans.clear();
                                await db.tasks.bulkAdd(importedData.tasks);
                                await db.testPlans.bulkAdd(importedData.testPlans);
                            });
                            alert('Data imported successfully!');
                        }
                    } 
                    else if (isOldFormat) {
                        if (window.confirm(`This will overwrite your current data with ${importedData.length} tasks (legacy format). Continue?`)) {
                            
                            await db.transaction('rw', db.tasks, db.testPlans, async () => {
                                await db.tasks.clear();
                                await db.testPlans.clear();
                                await db.tasks.bulkAdd(importedData);
                            });
                            alert('Data imported successfully!');
                        }
                    }
                    else {
                        throw new Error('Invalid file format.');
                    }
                }
            } catch (error) {
                alert('Failed to import data. Please check the file format.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="font-display text-4xl font-bold text-brand-amber-400 mb-8 tracking-wide">Settings</h1>

            <Card className="mb-8 p-6">
                <h2 className="font-display text-2xl font-semibold text-brand-amber-400 mb-4 flex items-center gap-2">
                    <CalendarClockIcon className="w-6 h-6" />
                    Exam Settings
                </h2>
                <div className="space-y-6">
                    <div>
                        <label className="block font-bold text-gray-200 mb-2">
                            Target Exam Date
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <Input 
                                type="date" 
                                value={targetDate} 
                                onChange={e => setTargetDate(e.target.value)} 
                                className="max-w-xs"
                            />
                            <Button onClick={handleSavePreferences} size="sm">
                                Save Date
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">The countdown timer on your dashboard will adjust to this date.</p>
                    </div>
                </div>
            </Card>

            <Card className="mb-8 p-6">
                <h2 className="font-display text-2xl font-semibold text-brand-amber-400 mb-4">About NEET Synapse</h2>
                <p className="text-gray-300 mb-4">
                    Developed with passion by <strong className="text-brand-amber-400">medgineer</strong>. I am dedicated to bridging the gap between medicine and technology. Join me on this journey to innovate the future of healthcare and education.
                </p>
                <div className="space-y-2 mb-4">
                    <p className="font-semibold text-gray-200">Connect with me:</p>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                        <li>Telegram: <a href="https://t.me/medgineer" target="_blank" rel="noopener noreferrer" className="text-brand-amber-400 hover:underline">medgineer</a></li>
                        <li>Instagram: <a href="https://www.instagram.com/medgineer.ind?igsh=YzljYTk1ODg3Zg==" target="_blank" rel="noopener noreferrer" className="text-brand-amber-400 hover:underline">medgineer.ind</a></li>
                        <li>YouTube: <a href="https://youtube.com/@medgineer-ind?si=QOiBLWvUIx1VVpSm" target="_blank" rel="noopener noreferrer" className="text-brand-amber-400 hover:underline">medgineer-ind</a></li>
                    </ul>
                </div>
                 
                <div className="border-t border-white/10 my-4"></div>
                <div className="flex items-start gap-3">
                    <ShareIcon className="w-5 h-5 text-brand-amber-400 flex-shrink-0 mt-1" />
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
                    Watch Tutorial
                </Button>
            </Card>
            
             <Card className="mb-8 p-6 border-yellow-500/30">
                <h2 className="font-display text-2xl font-semibold text-yellow-400 mb-4 flex items-center gap-3"><AlertTriangleIcon className="w-6 h-6"/>Data Safety & Backup</h2>
                <div className="space-y-3 text-gray-300">
                    <p>
                        <strong className="text-white">Important:</strong> All your study data is stored <strong className="text-white">only on this device</strong> within this browser. It is not saved in the cloud.
                    </p>
                    <p>
                        This means your data can be <strong className="text-yellow-300">permanently lost</strong> if you:
                    </p>
                    <ul className="list-disc list-inside pl-4 text-sm space-y-1">
                        <li>Clear your browser's cache or site data.</li>
                        <li>Your device is lost, stolen, or damaged.</li>
                        <li><strong className="text-white">(Especially on iPhone/iPad)</strong> Your device automatically clears data for websites you haven't visited in a while.</li>
                    </ul>
                    <p className="font-semibold text-white pt-2 border-t border-white/10">
                        To protect your progress, please export your data regularly. Think of it as your personal cloud backup.
                    </p>
                </div>
            </Card>

            <Card className="mb-8 p-6">
                <h2 className="font-display text-2xl font-semibold text-brand-amber-400 mb-2">Data Management</h2>
                <p className="text-gray-400 mb-6">Backup your data or start fresh. Your backup now includes test plans.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={handleExport} variant="secondary">
                        Export Data (Create Backup)
                    </Button>
                    <Button onClick={handleImportClick} variant="secondary">
                        Import Data (Restore Backup)
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

            <Card className="p-6 border-red-500/30">
                <h2 className="font-display text-2xl font-semibold text-red-400 mb-2">Danger Zone</h2>
                <p className="text-gray-400 mb-6">This action is irreversible. Please be certain.</p>
                <Button onClick={handleReset} variant="danger">
                    Reset All Data
                </Button>
            </Card>
        </div>
    );
};

export default Settings;
