const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    startDate: { 
        type: Date, 
        required: true,
        validate: {
            validator: function(value) {
                return value > new Date();  // Ensure start date is in the future
            },
            message: 'Start date must be in the future'
        }
    },
    endDate: { 
        type: Date, 
        required: true,
        validate: {
            validator: function(value) {
                return value > this.startDate; // Ensure endDate is after startDate
            },
            message: 'End date must be after start date'
        }
    },
    totalPrice: { type: Number, required: true, min: 0 },  // Ensuring price is non-negative
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'canceled', 'completed'], 
        default: 'pending'
    },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);