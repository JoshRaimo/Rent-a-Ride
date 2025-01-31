const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    pricePerDay: { type: Number, required: true },
    availabilityStatus: { type: Boolean, default: true },
    image: { type: String, required: false },
}, { timestamps: true });

carSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Car', carSchema);