const mongoose = require('mongoose');

const opinionSchema = new mongoose.Schema({
    usuario: {
        type: String,
        required: true
    },
    opinion: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    destacada: {
        type: Boolean,
        default: false
    },
    estado: {
        type: String,
        enum: ['pendiente', 'aprobada', 'rechazada'],
        default: 'aprobada'
    },
    editadaPor: {
        type: String,
        default: null
    },
    fechaEdicion: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('Opinion', opinionSchema);