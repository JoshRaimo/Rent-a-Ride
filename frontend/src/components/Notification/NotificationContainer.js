import React from 'react';
import { createPortal } from 'react-dom';
import Toast from './Toast';

const NotificationContainer = ({ notifications, onDismiss, position = 'top-right' }) => {
    const getPositionClasses = () => {
        const positions = {
            'top-right': 'top-4 right-4',
            'top-left': 'top-4 left-4',
            'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
            'bottom-right': 'bottom-4 right-4',
            'bottom-left': 'bottom-4 left-4',
            'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
        };
        return positions[position] || positions['top-right'];
    };

    if (notifications.length === 0) return null;

    const container = (
        <div 
            className={`fixed z-[9999] pointer-events-none ${getPositionClasses()}`}
            style={{ maxWidth: '420px' }}
        >
            <div className="space-y-3 pointer-events-auto">
                {notifications.map((notification, index) => (
                    <div
                        key={notification.id}
                        style={{
                            animationDelay: `${index * 100}ms`
                        }}
                    >
                        <Toast
                            {...notification}
                            onDismiss={onDismiss}
                        />
                    </div>
                ))}
            </div>
        </div>
    );

    // Render to body using portal
    return createPortal(container, document.body);
};

export default NotificationContainer;
