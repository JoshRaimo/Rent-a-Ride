import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationContainer from '../components/Notification/NotificationContainer';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children, position = 'top-right', maxNotifications = 5 }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((notification) => {
        const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const newNotification = {
            id,
            timestamp: Date.now(),
            ...notification
        };

        setNotifications(prev => {
            const updated = [newNotification, ...prev];
            // Limit the number of notifications
            return updated.slice(0, maxNotifications);
        });

        return id;
    }, [maxNotifications]);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // Convenience methods for different notification types
    const success = useCallback((message, options = {}) => {
        return addNotification({
            type: 'success',
            message,
            duration: 4000,
            ...options
        });
    }, [addNotification]);

    const error = useCallback((message, options = {}) => {
        return addNotification({
            type: 'error',
            message,
            duration: 6000,
            ...options
        });
    }, [addNotification]);

    const warning = useCallback((message, options = {}) => {
        return addNotification({
            type: 'warning',
            message,
            duration: 5000,
            ...options
        });
    }, [addNotification]);

    const info = useCallback((message, options = {}) => {
        return addNotification({
            type: 'info',
            message,
            duration: 4000,
            ...options
        });
    }, [addNotification]);

    const loading = useCallback((message, options = {}) => {
        return addNotification({
            type: 'loading',
            message,
            persistent: true,
            ...options
        });
    }, [addNotification]);

    // Confirmation dialog method
    const confirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            const {
                title = 'Confirm Action',
                confirmText = 'OK',
                cancelText = 'Cancel',
                confirmButtonClass = 'bg-red-600 hover:bg-red-700',
                ...otherOptions
            } = options;

            const confirmAction = () => {
                removeNotification(id);
                resolve(true);
            };

            const cancelAction = () => {
                removeNotification(id);
                resolve(false);
            };

            const id = addNotification({
                type: 'confirm',
                message,
                title,
                persistent: true,
                actions: [
                    {
                        label: cancelText,
                        onClick: cancelAction,
                        className: 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                    },
                    {
                        label: confirmText,
                        onClick: confirmAction,
                        className: confirmButtonClass + ' text-white'
                    }
                ],
                ...otherOptions
            });
        });
    }, [addNotification, removeNotification]);

    // Advanced notification methods
    const promise = useCallback(async (promiseOrFunction, messages = {}) => {
        const {
            loading: loadingMsg = 'Loading...',
            success: successMsg = 'Success!',
            error: errorMsg = 'Something went wrong'
        } = messages;

        const loadingId = loading(loadingMsg);

        try {
            const result = typeof promiseOrFunction === 'function' 
                ? await promiseOrFunction() 
                : await promiseOrFunction;

            removeNotification(loadingId);
            success(typeof successMsg === 'function' ? successMsg(result) : successMsg);
            return result;
        } catch (err) {
            removeNotification(loadingId);
            error(typeof errorMsg === 'function' ? errorMsg(err) : errorMsg);
            throw err;
        }
    }, [loading, success, error, removeNotification]);

    const contextValue = {
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        success,
        error,
        warning,
        info,
        loading,
        confirm,
        promise
    };

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
            <NotificationContainer
                notifications={notifications}
                onDismiss={removeNotification}
                position={position}
            />
        </NotificationContext.Provider>
    );
};

export default NotificationContext;
