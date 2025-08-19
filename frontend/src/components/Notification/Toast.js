import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Zap } from 'lucide-react';

const Toast = ({ 
    id,
    type = 'info', 
    title, 
    message, 
    duration = 5000, 
    onDismiss,
    action = null,
    actions = null,
    persistent = false 
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!persistent && duration > 0) {
            const timer = setTimeout(() => {
                handleDismiss();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, persistent]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            onDismiss(id);
        }, 300); // Match exit animation duration
    };

    const getToastConfig = () => {
        const configs = {
            success: {
                icon: CheckCircle,
                colors: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800',
                iconColor: 'text-green-600',
                progressColor: 'bg-green-500'
            },
            error: {
                icon: AlertCircle,
                colors: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-800',
                iconColor: 'text-red-600',
                progressColor: 'bg-red-500'
            },
            warning: {
                icon: AlertTriangle,
                colors: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 text-yellow-800',
                iconColor: 'text-yellow-600',
                progressColor: 'bg-yellow-500'
            },
            info: {
                icon: Info,
                colors: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800',
                iconColor: 'text-blue-600',
                progressColor: 'bg-blue-500'
            },
            loading: {
                icon: Zap,
                colors: 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 text-gray-800',
                iconColor: 'text-gray-600',
                progressColor: 'bg-gray-500'
            },
            confirm: {
                icon: AlertTriangle,
                colors: 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 text-orange-800',
                iconColor: 'text-orange-600',
                progressColor: 'bg-orange-500'
            }
        };
        return configs[type] || configs.info;
    };

    const config = getToastConfig();
    const Icon = config.icon;

    return (
        <div
            className={`
                relative overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm max-w-md w-full
                transform transition-all duration-300 ease-out
                ${config.colors}
                ${isVisible && !isExiting 
                    ? 'translate-x-0 opacity-100 scale-100' 
                    : isExiting 
                        ? 'translate-x-full opacity-0 scale-95'
                        : 'translate-x-full opacity-0 scale-95'
                }
            `}
            role="alert"
            aria-live="polite"
        >
            {/* Progress Bar */}
            {!persistent && duration > 0 && (
                <div className="absolute top-0 left-0 h-1 bg-black bg-opacity-10 w-full">
                    <div 
                        className={`h-full ${config.progressColor} transition-all ease-linear`}
                        style={{
                            animation: `shrink ${duration}ms linear forwards`
                        }}
                    />
                </div>
            )}

            {/* Main Content */}
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 ${config.iconColor}`}>
                        <Icon className={`w-5 h-5 ${type === 'loading' ? 'animate-pulse' : ''}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {title && (
                            <h4 className="text-sm font-semibold mb-1 leading-tight">
                                {title}
                            </h4>
                        )}
                        <p className="text-sm leading-relaxed opacity-90">
                            {message}
                        </p>

                        {/* Action Button */}
                        {action && (
                            <div className="mt-3">
                                <button
                                    onClick={action.onClick}
                                    className="text-xs font-medium underline hover:no-underline transition-all duration-200 opacity-80 hover:opacity-100"
                                >
                                    {action.label}
                                </button>
                            </div>
                        )}

                        {/* Multiple Action Buttons for Confirm */}
                        {actions && actions.length > 0 && (
                            <div className="mt-3 flex gap-2">
                                {actions.map((actionItem, index) => (
                                    <button
                                        key={index}
                                        onClick={actionItem.onClick}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${actionItem.className || 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
                                    >
                                        {actionItem.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Dismiss Button - Hidden for confirm dialogs */}
                    {type !== 'confirm' && (
                        <button
                            onClick={handleDismiss}
                            className="flex-shrink-0 p-1 rounded-md hover:bg-black hover:bg-opacity-10 transition-colors duration-200 opacity-60 hover:opacity-100"
                            aria-label="Dismiss notification"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Subtle glow effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white to-transparent opacity-20 pointer-events-none" />
        </div>
    );
};

// CSS for progress bar animation (add to global CSS)
const progressBarStyles = `
@keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = progressBarStyles;
    document.head.appendChild(style);
}

export default Toast;
