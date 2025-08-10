const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios'); 
require('dotenv').config();

// Importar módulos para HTTPS
const https = require('https');
const fs = require('fs');
const path = require('path');

// Importar RSS parser
const Parser = require('rss-parser');
const parser = new Parser();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Middleware para verificar token y roles
const verifyToken = (requiredRole) => {
    return (req, res, next) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token no proporcionado' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;

            if (requiredRole && decoded.role !== requiredRole) {
                return res.status(403).json({ 
                    message: 'Acceso denegado: No tienes los permisos necesarios' 
                });
            }

            next();
        } catch (error) {
            res.status(401).json({ message: 'Token inválido o expirado' });
        }
    };
};

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Importación de modelos
const User = require('./models/User');
const Opinion = require('./models/Opinion');
const Anuncio = require('./models/Anuncio');
const Car = require('./models/Car');
const multer = require('multer');

// Configuración de multer para el almacenamiento de imágenes
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb) {
        cb(null, 'opinion-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Solo se permiten imágenes!');
        }
    }
}).single('image');

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static('uploads'));

//=============================================================================
// RUTAS DE OPINIONES
//=============================================================================

// Obtener todas las opiniones
app.get('/api/opinions', async (req, res) => {
    try {
        const opinions = await Opinion.find().sort({ createdAt: -1 });
        res.json(opinions);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las opiniones' });
    }
});

// Crear una nueva opinión (requiere autenticación)
app.post('/api/opinions', verifyToken(), upload, async (req, res) => {
    try {
        const { opinion } = req.body;
        const usuario = req.user.usuario;

        const newOpinion = new Opinion({
            usuario,
            opinion,
            image: req.file ? `/uploads/${req.file.filename}` : null
        });

        await newOpinion.save();
        res.status(201).json(newOpinion);
    } catch (error) {
        console.error('Error al crear la opinión:', error);
        res.status(500).json({ message: 'Error al crear la opinión' });
    }
});

// Obtener opiniones destacadas
app.get('/api/opinions/destacadas', async (req, res) => {
    try {
        const opinionesDestacadas = await Opinion.find({ 
            destacada: true,
            estado: 'aprobada'
        }).sort({ createdAt: -1 });
        res.json(opinionesDestacadas);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las opiniones destacadas' });
    }
});

//=============================================================================
// RUTAS DE AUTENTICACIÓN Y USUARIOS
//=============================================================================

// Ruta de registro para usuarios normales
app.post('/registro', async (req, res) => {
    try {
        const { usuario, email, contraseña, privacyPolicyAccepted } = req.body;

        // Verificar si el usuario aceptó el aviso de privacidad
        if (!privacyPolicyAccepted) {
            return res.status(400).json({ 
                message: 'Debes aceptar el aviso de privacidad para registrarte' 
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ $or: [{ email }, { username: usuario }] });
        if (existingUser) {
            return res.status(409).json({ 
                message: 'El usuario o correo electrónico ya está registrado' 
            });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contraseña, salt);

        // Crear nuevo usuario (siempre como usuario normal)
        const user = new User({
            username: usuario,
            email: email,
            password: hashedPassword,
            role: 'user', // Forzar rol de usuario normal
            privacyPolicyAccepted: true
        });

        await user.save();
        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Ruta de login
app.post('/login', async (req, res) => {
    try {
        const { email, contraseña, captchaResponse } = req.body;

        // Buscar usuario por email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Correo electrónico no encontrado' });
        }

        // Si el CAPTCHA está habilitado para el usuario, verificar la respuesta
        if (user.captchaEnabled) {
            if (!captchaResponse) {
                return res.status(400).json({ message: 'Se requiere verificación CAPTCHA' });
            }

            try {
                const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaResponse}`;
                const response = await axios.get(verificationURL);

                if (!response.data.success) {
                    return res.status(400).json({ message: 'Verificación CAPTCHA fallida' });
                }
            } catch (error) {
                console.error('Error al verificar CAPTCHA:', error);
                return res.status(500).json({ message: 'Error al verificar CAPTCHA' });
            }
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(contraseña, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        // Crear token JWT con información del rol
        const token = jwt.sign(
            { 
                userId: user._id, 
                role: user.role,
                usuario: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            usuario: user.username,
            role: user.role
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Ruta para obtener información del usuario
app.get('/user-info', verifyToken(), async (req, res) => {
    try {
        const usuario = req.query.usuario;
        const user = await User.findOne({ username: usuario });
        
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({
            usuario: user.username,
            rol: user.role,
            email: user.email
        });
    } catch (error) {
        console.error('Error al obtener información del usuario:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Ruta para obtener la configuración del usuario
app.get('/api/user/settings', verifyToken(), async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ captchaEnabled: user.captchaEnabled });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la configuración' });
    }
});

// Ruta para actualizar la configuración del usuario
app.put('/api/user/settings', verifyToken(), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { captchaEnabled } = req.body;
        
        if (captchaEnabled === undefined) {
            return res.status(400).json({ message: 'Configuración de CAPTCHA no proporcionada' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { captchaEnabled },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ captchaEnabled: user.captchaEnabled });
    } catch (error) {
        console.error('Error al actualizar la configuración:', error);
        res.status(500).json({ message: 'Error al actualizar la configuración' });
    }
});

// Ruta para verificar el estado del CAPTCHA de un usuario
app.get('/api/check-captcha/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ captchaEnabled: user.captchaEnabled });
    } catch (error) {
        res.status(500).json({ message: 'Error al verificar el estado del CAPTCHA' });
    }
});

//=============================================================================
// RUTAS DE ADMINISTRACIÓN
//=============================================================================

// Verificar si el usuario es administrador
app.get('/admin/check', verifyToken(), async (req, res) => {
    try {
        // El middleware verifyToken ya ha verificado el token
        // y ha añadido la información del usuario a req.user
        const user = await User.findOne({ username: req.user.usuario });
        
        if (!user) {
            return res.status(404).json({ isAdmin: false, message: 'Usuario no encontrado' });
        }
        
        // Verificar si el usuario tiene rol de admin
        const isAdmin = user.role === 'admin';
        
        res.json({ isAdmin });
    } catch (error) {
        console.error('Error al verificar admin:', error);
        res.status(500).json({ isAdmin: false, message: 'Error en el servidor' });
    }
});

// Ruta de registro exclusiva para administradores
app.post('/admin/registro', verifyToken('admin'), async (req, res) => {
    try {
        const { usuario, email, contraseña, role } = req.body;

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ $or: [{ email }, { username: usuario }] });
        if (existingUser) {
            return res.status(409).json({ 
                message: 'El usuario o correo electrónico ya está registrado' 
            });
        }

        // Validar el rol proporcionado
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ 
                message: 'Rol no válido' 
            });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contraseña, salt);

        // Crear nuevo usuario con el rol especificado
        const user = new User({
            username: usuario,
            email: email,
            password: hashedPassword,
            role: role
        });

        await user.save();
        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error('Error en registro por admin:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Obtener todos los usuarios (para administradores)
app.get('/admin/users', verifyToken('admin'), async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Excluye el campo password
        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Actualizar rol de usuario
app.post('/admin/update-user-role', verifyToken('admin'), async (req, res) => {
    try {
        const { usuario, newRole } = req.body;
        const user = await User.findOne({ username: usuario });
        
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        user.role = newRole;
        await user.save();
        
        res.json({ message: 'Rol actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar rol:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Eliminar usuario
// Eliminar usuario
app.delete('/admin/delete-user/:usuario', verifyToken('admin'), async (req, res) => {
    try {
        const { usuario } = req.params;
        
        // Verificar si el usuario a eliminar es el mismo que está haciendo la solicitud
        if (usuario === req.user.usuario) {
            return res.status(403).json({ message: 'No puedes eliminarte a ti mismo' });
        }
        
        // Buscar el usuario antes de eliminarlo para verificar su rol
        const userToDelete = await User.findOne({ username: usuario });
        
        if (!userToDelete) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        // Verificar si el usuario a eliminar es un administrador
        if (userToDelete.role === 'admin') {
            return res.status(403).json({ message: 'No se puede eliminar a un administrador' });
        }
        
        // Si pasa todas las verificaciones, proceder con la eliminación
        const result = await User.findOneAndDelete({ username: usuario });
        
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Actualizar usuario
app.put('/admin/update-user/:id', verifyToken('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario, email, contraseña, role } = req.body;
        
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Actualizar campos
        if (usuario) user.username = usuario;
        if (email) user.email = email;
        if (contraseña) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(contraseña, salt);
        }
        if (role) user.role = role;

        await user.save();
        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

//=============================================================================
// RUTAS PARA EDITORES
//=============================================================================

// Obtener todas las opiniones (para editores)
app.get('/editor/opinions', verifyToken('editor'), async (req, res) => {
    try {
        const opinions = await Opinion.find().sort({ createdAt: -1 });
        res.json(opinions);
    } catch (error) {
        console.error('Error al obtener las opiniones:', error);
        res.status(500).json({ message: 'Error al obtener las opiniones' });
    }
});

// Editar una opinión
app.put('/editor/opinions/:id', verifyToken('editor'), async (req, res) => {
    try {
        const { id } = req.params;
        const { opinion, destacada, estado } = req.body;
        const editorUsername = req.user.usuario;

        const updatedOpinion = await Opinion.findByIdAndUpdate(
            id,
            { 
                opinion, 
                destacada, 
                estado,
                editadaPor: editorUsername,
                fechaEdicion: new Date()
            },
            { new: true }
        );

        if (!updatedOpinion) {
            return res.status(404).json({ message: 'Opinión no encontrada' });
        }

        res.json(updatedOpinion);
    } catch (error) {
        console.error('Error al editar la opinión:', error);
        res.status(500).json({ message: 'Error al editar la opinión' });
    }
});

// Eliminar una opinión
app.delete('/editor/opinions/:id', verifyToken('editor'), async (req, res) => {
    try {
        const { id } = req.params;
        const deletedOpinion = await Opinion.findByIdAndDelete(id);

        if (!deletedOpinion) {
            return res.status(404).json({ message: 'Opinión no encontrada' });
        }

        res.json({ message: 'Opinión eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar la opinión:', error);
        res.status(500).json({ message: 'Error al eliminar la opinión' });
    }
});

// Obtener lista de usuarios (para editores)
app.get('/editor/users', verifyToken('editor'), async (req, res) => {
    try {
        // Excluir contraseñas y limitar información
        const users = await User.find(
            { role: 'user' }, 
            'username email createdAt suspended suspensionEndDate warnings'
        );
        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Suspender temporalmente a un usuario
app.post('/editor/users/:username/suspend', verifyToken('editor'), async (req, res) => {
    try {
        const { username } = req.params;
        const { days, reason } = req.body;
        
        if (!days || days < 1) {
            return res.status(400).json({ message: 'Debe especificar un número válido de días' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // No permitir suspender a administradores o editores
        if (user.role !== 'user') {
            return res.status(403).json({ message: 'No se puede suspender a administradores o editores' });
        }

        const suspensionEndDate = new Date();
        suspensionEndDate.setDate(suspensionEndDate.getDate() + days);

        user.suspended = true;
        user.suspensionEndDate = suspensionEndDate;
        
        // Añadir advertencia con el motivo
        if (reason) {
            user.warnings.push({
                message: `Suspensión temporal por ${days} días. Motivo: ${reason}`,
                date: new Date()
            });
        }

        await user.save();
        res.json({ message: `Usuario suspendido por ${days} días` });
    } catch (error) {
        console.error('Error al suspender usuario:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Enviar advertencia a un usuario
app.post('/editor/users/:username/warn', verifyToken('editor'), async (req, res) => {
    try {
        const { username } = req.params;
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ message: 'Debe incluir un mensaje de advertencia' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // No permitir advertir a administradores o editores
        if (user.role !== 'user') {
            return res.status(403).json({ message: 'No se puede advertir a administradores o editores' });
        }

        user.warnings.push({
            message,
            date: new Date()
        });

        await user.save();
        res.json({ message: 'Advertencia enviada exitosamente' });
    } catch (error) {
        console.error('Error al enviar advertencia:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Obtener estadísticas para el panel principal del editor
app.get('/editor/stats', verifyToken('editor'), async (req, res) => {
    try {
        const totalOpinions = await Opinion.countDocuments();
        const highlightedOpinions = await Opinion.countDocuments({ destacada: true });
        const pendingOpinions = await Opinion.countDocuments({ estado: 'pendiente' });
        const totalUsers = await User.countDocuments({ role: 'user' });
        const suspendedUsers = await User.countDocuments({ suspended: true });
        
        // Opiniones por día (últimos 7 días)
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        const opinionsByDay = await Opinion.aggregate([
            { $match: { createdAt: { $gte: lastWeek } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            totalOpinions,
            highlightedOpinions,
            pendingOpinions,
            totalUsers,
            suspendedUsers,
            opinionsByDay
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

//=============================================================================
// RUTAS PARA ANUNCIOS
//=============================================================================

// Obtener todos los anuncios activos (ruta pública)
app.get('/api/anuncios', async (req, res) => {
    try {
        const currentDate = new Date();
        const anuncios = await Anuncio.find({
            activo: true,
            fechaInicio: { $lte: currentDate },
            fechaFin: { $gte: currentDate }
        }).sort({ createdAt: -1 });
        res.json(anuncios);
    } catch (error) {
        console.error('Error al obtener los anuncios:', error);
        res.status(500).json({ message: 'Error al obtener los anuncios' });
    }
});

// Obtener todos los anuncios (para editores)
app.get('/editor/anuncios', verifyToken('editor'), async (req, res) => {
    try {
        const anuncios = await Anuncio.find().sort({ createdAt: -1 });
        res.json(anuncios);
    } catch (error) {
        console.error('Error al obtener los anuncios:', error);
        res.status(500).json({ message: 'Error al obtener los anuncios' });
    }
});

// Crear un nuevo anuncio
app.post('/editor/anuncios', verifyToken('editor'), upload, async (req, res) => {
    try {
        const { titulo, contenido, fechaInicio, fechaFin } = req.body;
        const editorUsername = req.user.usuario;

        const newAnuncio = new Anuncio({
            titulo,
            contenido,
            fechaInicio: new Date(fechaInicio),
            fechaFin: new Date(fechaFin),
            imagen: req.file ? `/uploads/${req.file.filename}` : null,
            creadoPor: editorUsername
        });

        await newAnuncio.save();
        res.status(201).json(newAnuncio);
    } catch (error) {
        console.error('Error al crear el anuncio:', error);
        res.status(500).json({ message: 'Error al crear el anuncio' });
    }
});

// Actualizar un anuncio
app.put('/editor/anuncios/:id', verifyToken('editor'), upload, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, contenido, fechaInicio, fechaFin, activo } = req.body;
        const editorUsername = req.user.usuario;

        const updateData = {
            titulo,
            contenido,
            fechaInicio: new Date(fechaInicio),
            fechaFin: new Date(fechaFin),
            activo: activo === 'true',
            updatedAt: new Date(),
            updatedBy: editorUsername
        };

        // Si hay una nueva imagen, actualizarla
        if (req.file) {
            updateData.imagen = `/uploads/${req.file.filename}`;
        }

        const updatedAnuncio = await Anuncio.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!updatedAnuncio) {
            return res.status(404).json({ message: 'Anuncio no encontrado' });
        }

        res.json(updatedAnuncio);
    } catch (error) {
        console.error('Error al actualizar el anuncio:', error);
        res.status(500).json({ message: 'Error al actualizar el anuncio' });
    }
});

// Eliminar un anuncio
app.delete('/editor/anuncios/:id', verifyToken('editor'), async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAnuncio = await Anuncio.findByIdAndDelete(id);

        if (!deletedAnuncio) {
            return res.status(404).json({ message: 'Anuncio no encontrado' });
        }

        res.json({ message: 'Anuncio eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar el anuncio:', error);
        res.status(500).json({ message: 'Error al eliminar el anuncio' });
    }
});

//=============================================================================
// RUTAS PARA NOTICIAS AUTOMOTRICES
//=============================================================================

// Obtener noticias de automoción
app.get('/api/news', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 15; // Cambiar mínimo a 15 para asegurar 9+
        
        // URLs de feeds RSS de noticias automotrices en español
        const feeds = [
            'https://news.google.com/rss/search?q=automóviles+coches+autos&hl=es&gl=ES&ceid=ES:es',
            'https://news.google.com/rss/search?q=motor+automoción&hl=es&gl=MX&ceid=MX:es-419',
            'https://news.google.com/rss/search?q=industria+automotriz&hl=es&gl=AR&ceid=AR:es-419'
        ];
        
        let allNews = [];
        
        // Obtener noticias de cada feed
        for (const feedUrl of feeds) {
            try {
                const feed = await parser.parseURL(feedUrl);
                const newsFromFeed = feed.items.slice(0, 8).map(item => ({
                    title: item.title,
                    description: item.contentSnippet || item.content?.substring(0, 200) + '...' || 'Sin descripción disponible',
                    link: item.link,
                    pubDate: item.pubDate,
                    source: item.source?._ || feed.title || 'Fuente desconocida',
                    image: item.enclosure?.url || null
                }));
                allNews = allNews.concat(newsFromFeed);
            } catch (feedError) {
                console.error(`Error al obtener feed ${feedUrl}:`, feedError.message);
            }
        }
        
        // Ordenar por fecha y asegurar mínimo 9 noticias
        allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        const limitedNews = allNews.slice(0, Math.max(limit, 9)); // Mínimo 9 noticias
        
        res.json({
            success: true,
            count: limitedNews.length,
            news: limitedNews
        });
    } catch (error) {
        console.error('Error al obtener noticias:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener las noticias' 
        });
    }
});

// Obtener noticias por categoría específica
app.get('/api/news/search', async (req, res) => {
    try {
        const { keyword, limit = 10 } = req.query;
        
        if (!keyword) {
            return res.status(400).json({ 
                success: false,
                message: 'Se requiere una palabra clave para la búsqueda ejemplo "Automovil' 
            });
        }
        
        // Feed de búsqueda de Google News para términos automotrices
        const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword + ' automotive cars')}&hl=es&gl=MX&ceid=MX:es-419`;
        
        const feed = await parser.parseURL(searchUrl);
        const searchResults = feed.items.slice(0, parseInt(limit)).map(item => ({
            title: item.title,
            description: item.contentSnippet || 'Sin descripción disponible',
            link: item.link,
            pubDate: item.pubDate,
            source: item.source?._ || 'Google News'
        }));
        
        res.json({
            success: true,
            keyword: keyword,
            count: searchResults.length,
            news: searchResults
        });
    } catch (error) {
        console.error('Error en búsqueda de noticias:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al buscar noticias' 
        });
    }
});

//=============================================================================
// RUTAS PARA CARROS
//=============================================================================

// Obtener todos los carros
app.get('/api/cars', async (req, res) => {
    try {
        const cars = await Car.find().sort({ brand: 1, name: 1 });
        res.json(cars);
    } catch (error) {
        console.error('Error al obtener los carros:', error);
        res.status(500).json({ message: 'Error al obtener los carros' });
    }
});

// Obtener un carro específico
app.get('/api/cars/:id', async (req, res) => {
    try {
        // Incrementar contador de visitas y obtener el carro actualizado
        const car = await Car.findByIdAndUpdate(
            req.params.id,
            { $inc: { viewCount: 1 } },
            { new: true }
        );
        
        if (!car) {
            return res.status(404).json({ message: 'Carro no encontrado' });
        }
        
        res.json(car);
    } catch (error) {
        console.error('Error al obtener el carro:', error);
        res.status(500).json({ message: 'Error al obtener el carro' });
    }
});

// Obtener todos los carros (para editores)
app.get('/editor/cars', verifyToken('editor'), async (req, res) => {
    try {
        const cars = await Car.find().sort({ brand: 1, name: 1 });
        res.json(cars);
    } catch (error) {
        console.error('Error al obtener los carros:', error);
        res.status(500).json({ message: 'Error al obtener los carros' });
    }
});

// Crear un nuevo carro
app.post('/editor/cars', verifyToken('editor'), upload, async (req, res) => {
    try {
        const { brand, name, year, engine, transmission, fuel, cylinders, power, acceleration } = req.body;
        const editorUsername = req.user.usuario;

        if (!req.file) {
            return res.status(400).json({ message: 'La imagen es obligatoria' });
        }

        const newCar = new Car({
            brand,
            name,
            year: parseInt(year),
            image: `/uploads/${req.file.filename}`,
            specs: {
                engine,
                transmission,
                fuel,
                cylinders,
                power,
                acceleration
            },
            updatedBy: editorUsername
        });

        await newCar.save();
        res.status(201).json(newCar);
    } catch (error) {
        console.error('Error al crear el carro:', error);
        res.status(500).json({ message: 'Error al crear el carro' });
    }
});

// Actualizar un carro
app.put('/editor/cars/:id', verifyToken('editor'), upload, async (req, res) => {
    try {
        const { id } = req.params;
        const { brand, name, year, engine, transmission, fuel, cylinders, power, acceleration } = req.body;
        const editorUsername = req.user.usuario;

        const updateData = {
            brand,
            name,
            year: parseInt(year),
            specs: {
                engine,
                transmission,
                fuel,
                cylinders,
                power,
                acceleration
            },
            updatedAt: new Date(),
            updatedBy: editorUsername
        };

        // Si se proporciona una nueva imagen, actualizarla
        if (req.file) {
            updateData.image = `/uploads/${req.file.filename}`;
        }

        const updatedCar = await Car.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!updatedCar) {
            return res.status(404).json({ message: 'Carro no encontrado' });
        }

        res.json(updatedCar);
    } catch (error) {
        console.error('Error al actualizar el carro:', error);
        res.status(500).json({ message: 'Error al actualizar el carro' });
    }
});

// Eliminar un carro
app.delete('/editor/cars/:id', verifyToken('editor'), async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCar = await Car.findByIdAndDelete(id);

        if (!deletedCar) {
            return res.status(404).json({ message: 'Carro no encontrado' });
        }

        res.json({ message: 'Carro eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar el carro:', error);
        res.status(500).json({ message: 'Error al eliminar el carro' });
    }
});

//=============================================================================
// RUTAS PARA ESTADÍSTICAS DE VISITAS
//=============================================================================

// Obtener los carros más visitados (público)
app.get('/api/cars/stats/most-visited', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const cars = await Car.find()
            .sort({ viewCount: -1 })
            .limit(limit)
            .select('brand name year image viewCount');
        
        res.json(cars);
    } catch (error) {
        console.error('Error al obtener carros más visitados:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas' });
    }
});

// Obtener estadísticas generales de visitas (para editores/admins)
app.get('/api/cars/stats/general', verifyToken('editor'), async (req, res) => {
    try {
        // Total de visitas
        const totalViews = await Car.aggregate([
            { $group: { _id: null, total: { $sum: '$viewCount' } } }
        ]);
        
        // Promedio de visitas por carro
        const avgViews = await Car.aggregate([
            { $group: { _id: null, average: { $avg: '$viewCount' } } }
        ]);
        
        // Carro más visitado
        const mostVisited = await Car.findOne().sort({ viewCount: -1 }).select('brand name viewCount');
        
        // Carros sin visitas
        const unvisitedCount = await Car.countDocuments({ viewCount: 0 });
        
        // Total de carros
        const totalCars = await Car.countDocuments();
        
        res.json({
            totalViews: totalViews[0]?.total || 0,
            averageViews: Math.round((avgViews[0]?.average || 0) * 100) / 100,
            mostVisited: mostVisited,
            unvisitedCount: unvisitedCount,
            totalCars: totalCars,
            visitedCars: totalCars - unvisitedCount
        });
    } catch (error) {
        console.error('Error al obtener estadísticas generales:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas generales' });
    }
});

// Obtener estadísticas por marca (para editores/admins)
app.get('/api/cars/stats/by-brand', verifyToken('editor'), async (req, res) => {
    try {
        const brandStats = await Car.aggregate([
            {
                $group: {
                    _id: '$brand',
                    totalViews: { $sum: '$viewCount' },
                    carCount: { $sum: 1 },
                    averageViews: { $avg: '$viewCount' },
                    maxViews: { $max: '$viewCount' },
                    minViews: { $min: '$viewCount' },
                    cars: { $push: { name: '$name', viewCount: '$viewCount', _id: '$_id' } }
                }
            },
            {
                $sort: { totalViews: -1 }
            }
        ]);
        
        res.json(brandStats.map(stat => {
            // Encontrar el carro más visitado de esta marca
            const mostVisitedCar = stat.cars.reduce((max, car) => 
                car.viewCount > max.viewCount ? car : max
            );
            
            return {
                brand: stat._id,
                totalViews: stat.totalViews,
                carCount: stat.carCount,
                averageViews: Math.round(stat.averageViews * 100) / 100,
                maxViews: stat.maxViews,
                minViews: stat.minViews,
                mostVisited: mostVisitedCar.viewCount > 0 ? mostVisitedCar : null
            };
        }));
    } catch (error) {
        console.error('Error al obtener estadísticas por marca:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas por marca' });
    }
});

// Resetear contador de visitas de un carro específico (para editores/admins)
app.patch('/api/cars/:id/reset-views', verifyToken('editor'), async (req, res) => {
    try {
        const car = await Car.findByIdAndUpdate(
            req.params.id,
            { viewCount: 0 },
            { new: true }
        );
        
        if (!car) {
            return res.status(404).json({ message: 'Carro no encontrado' });
        }
        
        res.json({ message: 'Contador de visitas reseteado', car });
    } catch (error) {
        console.error('Error al resetear contador:', error);
        res.status(500).json({ message: 'Error al resetear contador de visitas' });
    }
});

//=============================================================================
// INICIAR SERVIDOR
//=============================================================================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor HTTP corriendo en puerto ${PORT}`);
});

// Configuración para HTTPS (puerto 3443)
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// Cargar certificados SSL
try {
    const privateKey = fs.readFileSync(path.join(__dirname, 'certificates', 'key.pem'), 'utf8');
    const certificate = fs.readFileSync(path.join(__dirname, 'certificates', 'cert.pem'), 'utf8');
    
    const credentials = { key: privateKey, cert: certificate };
    
    // Crear servidor HTTPS
    const httpsServer = https.createServer(credentials, app);
    
    // Iniciar servidor HTTPS
    httpsServer.listen(HTTPS_PORT, () => {
        console.log(`Servidor HTTPS corriendo en puerto ${HTTPS_PORT}`);
    });
} catch (error) {
    console.error('Error al iniciar servidor HTTPS:', error);
    console.log('El servidor continuará funcionando solo con HTTP');
}

// Ruta para revocar políticas de privacidad y eliminar datos del usuario
app.post('/api/user/revoke-privacy-policy', verifyToken(), async (req, res) => {
    try {
        const userId = req.user.userId;
        const username = req.user.usuario;
        
        // Eliminar todas las opiniones del usuario
        await Opinion.deleteMany({ usuario: username });
        
        // Buscar y eliminar anuncios creados por el usuario (si aplica)
        await Anuncio.deleteMany({ createdBy: username });
        
        // Buscar y eliminar carros creados por el usuario (si aplica)
        await Car.deleteMany({ createdBy: username });
        
        // Finalmente, eliminar la cuenta del usuario
        await User.findByIdAndDelete(userId);
        
        res.json({ message: 'Cuenta y datos eliminados exitosamente' });
    } catch (error) {
        console.error('Error al revocar políticas de privacidad:', error);
        res.status(500).json({ message: 'Error al procesar la solicitud' });
    }
});