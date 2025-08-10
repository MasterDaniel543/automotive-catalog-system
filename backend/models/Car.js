const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    brand: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    specs: {
        engine: {
            type: String,
            required: true
        },
        transmission: {
            type: String,
            required: true
        },
        fuel: {
            type: String,
            required: true
        },
        cylinders: {
            type: String,
            required: true
        },
        power: {
            type: String,
            required: true
        },
        acceleration: {
            type: String,
            required: true
        }
    },
    viewCount: {
        type: Number,
        default: 0,
        min: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: null
    },
    updatedBy: {
        type: String,
        default: null
    }
});

module.exports = mongoose.model('Car', carSchema);