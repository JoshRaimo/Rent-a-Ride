import { useNotification } from '../contexts/NotificationContext';

// Compatibility hook to make migration easier
export const useToast = () => {
    const notification = useNotification();

    // Create a toast object that mimics react-toastify API
    const toast = {
        success: (message, options = {}) => {
            return notification.success(message, options);
        },
        error: (message, options = {}) => {
            return notification.error(message, options);
        },
        warning: (message, options = {}) => {
            return notification.warning(message, options);
        },
        warn: (message, options = {}) => {
            return notification.warning(message, options);
        },
        info: (message, options = {}) => {
            return notification.info(message, options);
        },
        loading: (message, options = {}) => {
            return notification.loading(message, options);
        },
        promise: (promise, messages) => {
            return notification.promise(promise, messages);
        },
        confirm: (message, options = {}) => {
            return notification.confirm(message, options);
        }
    };

    return { toast, confirm: notification.confirm, ...notification };
};

export default useToast;
