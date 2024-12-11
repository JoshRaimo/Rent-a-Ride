const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    pricePerDay: { type: Number, required: true },
    availabilityStatus: { type: Boolean, required: true },
    image: { type: String, default: null }, // Optional image field
});

module.exports = mongoose.model('Car', carSchema);