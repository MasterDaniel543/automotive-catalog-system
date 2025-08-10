const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un correo válido']
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'editor', 'admin'],
    default: 'user',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  captchaEnabled: {
    type: Boolean,
    default: false
  },
  suspended: {
    type: Boolean,
    default: false
  },
  suspensionEndDate: {
    type: Date,
    default: null
  },
  warnings: [{
    message: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  // Campo para el aviso de privacidad
  privacyPolicyAccepted: {
    type: Boolean,
    required: true,
    default: false
  }
});

// Índices para mejorar búsquedas
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);