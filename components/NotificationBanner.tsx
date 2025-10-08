
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';
import { InfoIcon, XIcon } from './ui/Icons';
import { Button } from './ui/StyledComponents';

interface Notification {
  id: string;
  message: string;
  link?: string;
  linkText?: string;
}

interface NotificationBannerProps {
  notification: Notification;
  onDismiss: () => void;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ notification, onDismiss }) => {
  return (
    <div className="bg-brand-cyan-900/50 border border-brand-cyan-500/30 rounded-lg p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn shadow-glow-cyan">
      <div className="flex items-center gap-3">
        <InfoIcon className="w-6 h-6 text-brand-cyan-400 flex-shrink-0" />
        <p className="text-sm text-gray-200">{notification.message}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {notification.link && notification.linkText && (
          <NavLink to={notification.link}>
            <Button variant="secondary" size="sm">{notification.linkText}</Button>
          </NavLink>
        )}
        <button onClick={onDismiss} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10" aria-label="Dismiss notification">
          <XIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default NotificationBanner;
