
import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Planner from './components/Planner';
import Dashboard from './components/Dashboard';
import TestPlanner from './components/TestPlanner';
import Timeline from './components/Timeline';
import { SunIcon, MoonIcon, ClipboardListIcon, LayoutDashboardIcon, SettingsIcon, FileTextIcon, CalendarClockIcon, MoreVerticalIcon, XIcon, HelpCircleIcon, UserIcon, ShareIcon, InfoIcon } from './components/ui/Icons';
import { Theme } from './types';
import LiveBackground from './components/LiveBackground';
import SettingsModal from './components/SettingsModal';
import AboutModal from './components/AboutModal';
import useLocalStorage from './hooks/useLocalStorage';
import { currentNotification } from './data/notification';
import NotificationBanner from './components/NotificationBanner';

const Menu: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onOpenSettings: () => void;
    onOpenAbout: () => void;
}> = ({ isOpen, onClose, onOpenSettings, onOpenAbout }) => {
    if (!isOpen) return null;

    const handleMenuClick = (action: () => void) => {
        action();
        onClose();
    }

    const handleShare = async () => {
        const shareData = {
            title: 'NEET Synapse',
            text: 'Check out NEET Synapse, a futuristic planner to organize, track, and analyze your NEET prep. Fully offline!',
            url: 'https://neetsynapse.vercel.app/',
        };

        // Use Web Share API if available
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // Log error but don't show an alert, as it's likely the user just cancelled the share sheet.
                console.error('Share failed:', err);
            }
        } else {
            // Fallback to copying to clipboard
            try {
                await navigator.clipboard.writeText(shareData.url);
                alert('Link copied to clipboard!');
            } catch (err) {
                 console.error('Failed to copy: ', err);
                 alert('Could not copy link.');
            }
        }
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-black/50 z-[90] animate-fadeIn"
            onClick={onClose}
        >
            <div 
                className="fixed top-20 right-4 w-64 bg-slate-900/80 backdrop-blur-xl border border-brand-cyan-500/30 rounded-lg shadow-glow-cyan-intense p-2 animate-fadeIn"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-2 border-b border-white/10 mb-2">
                    <h3 className="font-bold text-brand-cyan-400">Menu</h3>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <ul className="space-y-1">
                    <li>
                        <button 
                            onClick={() => handleMenuClick(onOpenSettings)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-gray-300 hover:bg-brand-cyan-500/10 hover:text-brand-cyan-300 transition-colors"
                        >
                            <SettingsIcon className="w-5 h-5" /> Settings
                        </button>
                    </li>
                    <li>
                        <button 
                            onClick={handleShare}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-gray-300 hover:bg-brand-cyan-500/10 hover:text-brand-cyan-300 transition-colors"
                        >
                            <ShareIcon className="w-5 h-5" /> Share App
                        </button>
                    </li>
                    <li>
                        <a 
                            href="https://youtube.com/@medgineer-ind?si=QOiBLWvUIx1VVpSm"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-gray-300 hover:bg-brand-cyan-500/10 hover:text-brand-cyan-300 transition-colors"
                        >
                            <HelpCircleIcon className="w-5 h-5" /> Get Help
                        </a>
                    </li>
                     <li>
                        <button 
                            onClick={() => handleMenuClick(onOpenAbout)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-gray-300 hover:bg-brand-cyan-500/10 hover:text-brand-cyan-300 transition-colors"
                        >
                            <UserIcon className="w-5 h-5" /> About Developer
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    );
};


const Header: React.FC<{ onMenuClick: () => void; hasNewNotification: boolean }> = ({ onMenuClick, hasNewNotification }) => {
    const activeLinkStyle = {
        background: 'rgba(0, 239, 255, 0.1)',
        boxShadow: '0 0 15px rgba(0, 239, 255, 0.4)',
        color: '#00EFFF',
        borderBottom: '2px solid #00EFFF'
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-xl border-b border-brand-cyan-500/20">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <span className="font-bold text-xl text-brand-cyan-500 tracking-wider drop-shadow-[0_0_5px_rgba(0,239,255,0.7)]">
                            NEET Synapse
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        <NavLink
                            to="/"
                            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300"
                            style={({ isActive }) => isActive ? activeLinkStyle : { borderBottom: '2px solid transparent' }}
                        >
                           <ClipboardListIcon className="w-5 h-5 mr-2" /> Planner
                        </NavLink>
                        <NavLink
                            to="/test-planner"
                            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300"
                            style={({ isActive }) => isActive ? activeLinkStyle : { borderBottom: '2px solid transparent' }}
                        >
                           <FileTextIcon className="w-5 h-5 mr-2" /> Test Planner
                        </NavLink>
                         <NavLink
                            to="/timeline"
                            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300"
                            style={({ isActive }) => isActive ? activeLinkStyle : { borderBottom: '2px solid transparent' }}
                        >
                           <CalendarClockIcon className="w-5 h-5 mr-2" /> View Agenda
                        </NavLink>
                        <NavLink
                            to="/dashboard"
                            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300"
                            style={({ isActive }) => isActive ? activeLinkStyle : { borderBottom: '2px solid transparent' }}
                        >
                            <LayoutDashboardIcon className="w-5 h-5 mr-2" /> Dashboard
                        </NavLink>
                        <button
                            onClick={onMenuClick}
                            className="relative flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300"
                            style={{ borderBottom: '2px solid transparent' }}
                            aria-label="Open menu"
                        >
                            <MoreVerticalIcon className="w-5 h-5 mr-2" /> Menu
                             {hasNewNotification && (
                                <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-brand-cyan-500 ring-2 ring-slate-900" />
                            )}
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={onMenuClick}
                            className="relative p-2 -mr-2 text-gray-300 hover:text-brand-cyan-400 rounded-md hover:bg-white/10"
                            aria-label="Open menu"
                        >
                            <MoreVerticalIcon className="w-6 h-6" />
                             {hasNewNotification && (
                                <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-brand-cyan-500 ring-2 ring-slate-900" />
                            )}
                        </button>
                    </div>
                </div>
            </nav>
        </header>
    );
};


const ThemeToggle: React.FC<{ theme: Theme, toggleTheme: () => void }> = ({ theme, toggleTheme }) => (
    <button
        onClick={toggleTheme}
        className="fixed bottom-20 right-5 md:bottom-5 z-50 w-12 h-12 bg-slate-900/50 backdrop-blur-xl border border-brand-cyan-500/20 rounded-full flex items-center justify-center text-brand-cyan-500 shadow-glow-cyan hover:shadow-glow-cyan-intense transition-all duration-300"
        aria-label="Toggle theme"
    >
        {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
    </button>
);

const BottomNavBar: React.FC = () => {
    const activeLinkStyle = {
        color: '#00EFFF', // brand-cyan-500
        background: 'linear-gradient(to top, rgba(0, 239, 255, 0.2), transparent)',
        borderTop: '2px solid #00EFFF' 
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-xl border-t border-brand-cyan-500/20">
            <div className="container mx-auto flex justify-around h-16">
                 <NavLink
                    to="/"
                    className="flex flex-col items-center justify-center w-full text-xs font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300 pt-1"
                    style={({ isActive }) => isActive ? activeLinkStyle : {}}
                >
                   <ClipboardListIcon className="w-6 h-6 mb-1" /> Planner
                </NavLink>
                <NavLink
                    to="/test-planner"
                    className="flex flex-col items-center justify-center w-full text-xs font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300 pt-1"
                    style={({ isActive }) => isActive ? activeLinkStyle : {}}
                >
                   <FileTextIcon className="w-6 h-6 mb-1" /> Test Planner
                </NavLink>
                <NavLink
                    to="/timeline"
                    className="flex flex-col items-center justify-center w-full text-xs font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300 pt-1"
                    style={({ isActive }) => isActive ? activeLinkStyle : {}}
                >
                   <CalendarClockIcon className="w-6 h-6 mb-1" /> View Agenda
                </NavLink>
                <NavLink
                    to="/dashboard"
                    className="flex flex-col items-center justify-center w-full text-xs font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300 pt-1"
                    style={({ isActive }) => isActive ? activeLinkStyle : {}}
                >
                    <LayoutDashboardIcon className="w-6 h-6 mb-1" /> Dashboard
                </NavLink>
            </div>
        </nav>
    );
};


const App: React.FC = () => {
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [isAboutModalOpen, setAboutModalOpen] = useState(false);
    const [seenNotificationId, setSeenNotificationId] = useLocalStorage<string>('seenNotificationId', '');
    const [isBannerVisible, setBannerVisible] = useState(false);
    const [hasNewNotification, setHasNewNotification] = useState(false);


    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    useEffect(() => {
        if (currentNotification && currentNotification.id !== seenNotificationId) {
            setHasNewNotification(true);
            setBannerVisible(true);
        }
    }, [seenNotificationId]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    const handleDismissNotification = () => {
        if (currentNotification) {
            setSeenNotificationId(currentNotification.id);
        }
        setBannerVisible(false);
        setHasNewNotification(false);
    };
    
    const handleMenuOpen = () => {
        setMenuOpen(true);
        setHasNewNotification(false); // User has acknowledged the notification indicator
    };


    return (
        <div className="relative min-h-screen text-gray-200 font-sans transition-colors duration-500">
            <LiveBackground />
            <div className="absolute inset-0 -z-10 bg-brand-blue-900/95 dark:bg-brand-blue-900/95"></div>
            <Header onMenuClick={handleMenuOpen} hasNewNotification={hasNewNotification}/>
            <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
                 {isBannerVisible && currentNotification && (
                    <NotificationBanner notification={currentNotification} onDismiss={handleDismissNotification} />
                )}
                <Routes>
                    <Route path="/" element={<Planner />} />
                    <Route path="/test-planner" element={<TestPlanner />} />
                    <Route path="/timeline" element={<Timeline />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
            </main>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            <BottomNavBar />
            <Menu 
                isOpen={isMenuOpen} 
                onClose={() => setMenuOpen(false)}
                onOpenSettings={() => setSettingsModalOpen(true)}
                onOpenAbout={() => setAboutModalOpen(true)}
            />
            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
            <AboutModal isOpen={isAboutModalOpen} onClose={() => setAboutModalOpen(false)} />
        </div>
    );
}

export default App;
