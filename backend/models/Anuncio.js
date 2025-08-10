const mongoose = require('mongoose');

const anuncioSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true
    },
    contenido: {
        type: String,
        required: true
    },
    imagen: {
        type: String,
        required: false
    },
    fechaInicio: {
        type: Date,
        required: true
    },
    fechaFin: {
        type: Date,
        required: true
    },
    activo: {
        type: Boolean,
        default: true
    },
    creadoPor: {
        type: String,
        required: true
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

module.exports = mongoose.model('Anuncio', anuncioSchema);