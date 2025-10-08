
import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Planner from './components/Planner';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import TestPlanner from './components/TestPlanner';
import Timeline from './components/Timeline';
import { SunIcon, MoonIcon, ClipboardListIcon, LayoutDashboardIcon, SettingsIcon, FileTextIcon, CalendarClockIcon } from './components/ui/Icons';
import { Theme } from './types';
import LiveBackground from './components/LiveBackground';

const Header: React.FC = () => {
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
                        <NavLink
                            to="/settings"
                            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300"
                            style={({ isActive }) => isActive ? activeLinkStyle : { borderBottom: '2px solid transparent' }}
                        >
                            <SettingsIcon className="w-5 h-5 mr-2" /> Settings
                        </NavLink>
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
                <NavLink
                    to="/settings"
                    className="flex flex-col items-center justify-center w-full text-xs font-medium text-gray-300 hover:text-brand-cyan-400 transition-all duration-300 pt-1"
                    style={({ isActive }) => isActive ? activeLinkStyle : {}}
                >
                    <SettingsIcon className="w-6 h-6 mb-1" /> Settings
                </NavLink>
            </div>
        </nav>
    );
};


const App: React.FC = () => {
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    return (
        <div className="relative min-h-screen text-gray-200 font-sans transition-colors duration-500">
            <LiveBackground />
            <div className="absolute inset-0 -z-10 bg-brand-blue-900/95 dark:bg-brand-blue-900/95"></div>
            <Header />
            <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
                <Routes>
                    <Route path="/" element={<Planner />} />
                    <Route path="/test-planner" element={<TestPlanner />} />
                    <Route path="/timeline" element={<Timeline />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </main>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            <BottomNavBar />
        </div>
    );
}

export default App;