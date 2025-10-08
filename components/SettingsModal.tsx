
import React, { useRef } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Task, TestPlan } from '../types';
import { Button, Modal } from './ui/StyledComponents';

const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const [, setTasks] = useLocalStorage<Task[]>('tasks', []);
    const [tasksForExport] = useLocalStorage<Task[]>('tasks', []);
    const [, setTestPlans] = useLocalStorage<TestPlan[]>('testPlans', []);
    const [testPlansForExport] = useLocalStorage<TestPlan[]>('testPlans', []);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleReset = () => {
        if (window.confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
            setTasks([]);
            setTestPlans([]);
            alert('All data has been reset.');
            onClose();
        }
    };

    const handleExport = () => {
        const dataToExport = {
            tasks: tasksForExport,
            testPlans: testPlansForExport,
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
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const importedData = JSON.parse(text);
                    // Basic validation for new structure
                    const hasTasks = 'tasks' in importedData && Array.isArray(importedData.tasks);
                    const hasTestPlans = 'testPlans' in importedData && Array.isArray(importedData.testPlans);
                    
                    if (hasTasks && hasTestPlans) {
                        const totalItems = importedData.tasks.length + importedData.testPlans.length;
                        if (window.confirm(`This will overwrite your current data with ${totalItems} items. Continue?`)) {
                            setTasks(importedData.tasks);
                            setTestPlans(importedData.testPlans);
                            alert('Data imported successfully!');
                            onClose();
                        }
                    } else { // Fallback for old structure (just tasks array)
                        if (Array.isArray(importedData) && (importedData.length === 0 || 'id' in importedData[0])) {
                             if (window.confirm(`This will overwrite your current task data with ${importedData.length} tasks. Test plans will not be affected. Continue?`)) {
                                setTasks(importedData);
                                alert('Task data imported successfully!');
                                onClose();
                            }
                        } else {
                            throw new Error('Invalid file format.');
                        }
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
        <Modal isOpen={isOpen} onClose={onClose} title="Settings">
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-brand-cyan-500 mb-2">Data Management</h2>
                    <p className="text-gray-400 mb-6">Backup your data or start fresh.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={handleExport} variant="secondary" disabled={tasksForExport.length === 0 && testPlansForExport.length === 0}>
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
                </div>

                <div className="border-t border-white/20"></div>
                
                <div>
                    <h2 className="text-xl font-semibold text-red-400 mb-2">Danger Zone</h2>
                    <p className="text-gray-400 mb-6">This action is irreversible. Please be certain.</p>
                    <Button onClick={handleReset} variant="danger">
                        Reset All Data
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default SettingsModal;
