
import React from 'react';
import { Modal, Button } from './ui/StyledComponents';
import { ShareIcon } from './ui/Icons';

const AboutModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="About NEET Synapse">
            <div>
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

                <div className="flex justify-end mt-6">
                    <Button onClick={onClose} variant="secondary">Close</Button>
                </div>
            </div>
        </Modal>
    );
};

export default AboutModal;
