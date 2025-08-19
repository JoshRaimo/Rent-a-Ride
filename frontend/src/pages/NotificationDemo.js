import React from 'react';
import { useToast } from '../hooks/useToast';
import { 
    CheckCircle, 
    AlertCircle, 
    Info, 
    AlertTriangle, 
    Zap,
    RefreshCw,
    Trash2,
    Download,
    Upload,
    Settings
} from 'lucide-react';

const NotificationDemo = () => {
    const { toast, success, error, warning, info, loading, promise, confirm } = useToast();

    const showBasicNotifications = () => {
        success('Car booking confirmed successfully!');
        setTimeout(() => error('Failed to process payment'), 1000);
        setTimeout(() => warning('Your session will expire in 5 minutes'), 2000);
        setTimeout(() => info('New cars available in your area'), 3000);
    };

    const showAdvancedNotifications = () => {
        success('Profile updated successfully!', {
            title: 'Settings Saved',
            duration: 6000,
            action: {
                label: 'View Profile',
                onClick: () => alert('Navigate to profile!')
            }
        });

        setTimeout(() => {
            error('Unable to connect to server', {
                title: 'Connection Error',
                persistent: true,
                action: {
                    label: 'Retry',
                    onClick: () => toast.info('Retrying connection...')
                }
            });
        }, 1000);
    };

    const showLoadingNotification = () => {
        const loadingId = loading('Processing your booking...');
        
        setTimeout(() => {
            // Simulate completion
            success('Booking confirmed! Check your email for details.', {
                title: 'Success!'
            });
        }, 3000);
    };

    const showPromiseNotification = () => {
        const fakeApiCall = () => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (Math.random() > 0.5) {
                        resolve({ carId: 123, bookingId: 'BK001' });
                    } else {
                        reject(new Error('Server timeout'));
                    }
                }, 2000);
            });
        };

        promise(fakeApiCall(), {
            loading: 'Creating your booking...',
            success: (data) => `Booking ${data.bookingId} created successfully!`,
            error: (err) => `Booking failed: ${err.message}`
        });
    };

    const showCarSpecificNotifications = () => {
        // Simulate car rental workflow notifications
        success('2023 Tesla Model 3 reserved for you!', {
            title: 'Car Reserved',
            duration: 4000
        });

        setTimeout(() => {
            info('Remember to bring your driver\'s license', {
                title: 'Pickup Reminder',
                duration: 5000
            });
        }, 1500);

        setTimeout(() => {
            warning('Fuel level is low - please refuel before return', {
                title: 'Fuel Alert',
                duration: 6000,
                action: {
                    label: 'Find Gas Stations',
                    onClick: () => info('Opening maps...')
                }
            });
        }, 3000);
    };

    const showSystemNotifications = () => {
        info('System maintenance scheduled for tonight 2-4 AM', {
            title: 'Maintenance Notice',
            duration: 8000,
            persistent: false
        });

        setTimeout(() => {
            error('Your session has expired. Please log in again.', {
                title: 'Session Expired',
                persistent: true,
                action: {
                    label: 'Login',
                    onClick: () => success('Redirecting to login...')
                }
            });
        }, 2000);
    };

    const showConfirmDialog = async () => {
        const confirmed = await confirm('Are you sure you want to delete this car? This action cannot be undone.', {
            title: 'Delete Car',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmButtonClass: 'bg-red-600 hover:bg-red-700'
        });
        
        if (confirmed) {
            success('Car deleted successfully!', {
                title: 'Car Removed'
            });
        } else {
            info('Delete operation cancelled', {
                title: 'Cancelled'
            });
        }
    };

    const showReviewDemo = () => {
        success('Review submitted with 5 stars!', {
            title: 'Review Submitted',
            duration: 4000
        });

        setTimeout(() => {
            info('Reviews can now be submitted with just a star rating - no text required!', {
                title: 'Review System Updated',
                duration: 6000
            });
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🎉 Beautiful Notification System
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Test all the different notification types and styles in your Rent-a-Ride application.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Notifications */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                Basic Notifications
                            </h2>
                            <div className="space-y-3">
                                <button
                                    onClick={() => success('Operation completed successfully!')}
                                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Success Notification
                                </button>
                                <button
                                    onClick={() => error('Something went wrong. Please try again.')}
                                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Error Notification
                                </button>
                                <button
                                    onClick={() => warning('This action cannot be undone.')}
                                    className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                                >
                                    Warning Notification
                                </button>
                                <button
                                    onClick={() => info('Here\'s some helpful information.')}
                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Info Notification
                                </button>
                            </div>
                        </div>

                        {/* Advanced Notifications */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-purple-600" />
                                Advanced Features
                            </h2>
                            <div className="space-y-3">
                                <button
                                    onClick={showLoadingNotification}
                                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Loading Notification
                                </button>
                                <button
                                    onClick={showPromiseNotification}
                                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Promise Notification
                                </button>
                                <button
                                    onClick={showAdvancedNotifications}
                                    className="w-full bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                                >
                                    With Actions
                                </button>
                                <button
                                    onClick={() => success('This notification will stay until dismissed', { persistent: true, title: 'Persistent' })}
                                    className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                                >
                                    Persistent Notification
                                </button>
                            </div>
                        </div>

                        {/* Demo Scenarios */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-orange-600" />
                                Demo Scenarios
                            </h2>
                            <div className="space-y-3">
                                <button
                                    onClick={showBasicNotifications}
                                    className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    Multiple Notifications
                                </button>
                                <button
                                    onClick={showCarSpecificNotifications}
                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Car Rental Flow
                                </button>
                                <button
                                    onClick={showSystemNotifications}
                                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    System Messages
                                </button>
                                <button
                                    onClick={showConfirmDialog}
                                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Confirmation Dialog
                                </button>
                                <button
                                    onClick={showReviewDemo}
                                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Review System Demo
                                </button>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <Info className="w-5 h-5 text-cyan-600" />
                                Features
                            </h2>
                            <div className="text-sm text-gray-600 space-y-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Smooth animations & transitions
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Auto-dismiss with progress bar
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Action buttons & callbacks
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Persistent notifications
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Promise handling
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Multiple positioning options
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Stacking & queue management
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Accessible & keyboard friendly
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-900 mb-2">💡 Usage Tips</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Use <strong>success</strong> for completed actions (bookings, payments, updates)</li>
                            <li>• Use <strong>error</strong> for failures that need user attention</li>
                            <li>• Use <strong>warning</strong> for important notices or confirmations</li>
                            <li>• Use <strong>info</strong> for helpful tips or neutral information</li>
                            <li>• Use <strong>loading</strong> for long-running operations</li>
                            <li>• Add <strong>actions</strong> for notifications that need user response</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationDemo;
