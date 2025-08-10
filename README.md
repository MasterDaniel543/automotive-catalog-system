# Sistema de Gestión de Catálogo Automotriz

## Descripción
Sistema web seguro para la gestión de usuarios, roles y catálogos jerárquicos de información de vehículos automotrices.

## Tecnologías Utilizadas

### Frontend
- React.js 18
- Material-UI (MUI)
- React Router DOM
- Axios
- JWT Decode

### Backend
- Node.js
- Express.js
- MongoDB con Mongoose
- JWT para autenticación
- Bcrypt para encriptación
- Multer para carga de archivos

### Base de Datos
- MongoDB

## Estructura del Proyecto
frontend/          # Aplicación React
    src/
        components/
        context/
        pages/
        utils/
        App.js
        index.js
    package.json

backend/           # API Node.js
    models/
    uploads/
    controllers/
    routes/
    server.js
README.md


## Instalación y Configuración

### Prerrequisitos
- Node.js (v14 o superior)
- MongoDB
- Git

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Funcionalidades

- ✅ Autenticación y autorización con JWT
- ✅ Gestión de usuarios (CRUD)
- ✅ Roles: Administrador, Usuario Estándar
- ✅ Catálogo de vehículos (marcas/modelos)
- ✅ Sistema de opiniones
- ✅ Panel de administración
- ✅ Carga de imágenes

## Contribución

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto es para fines educativos.