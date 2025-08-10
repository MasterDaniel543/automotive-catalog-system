import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import config from '../../config';
import './Opinions.css';

function Opinions() {
    const [opinions, setOpinions] = useState([]);
    const [newOpinion, setNewOpinion] = useState('');
    const [currentUser, setCurrentUser] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [expandedOpinions, setExpandedOpinions] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    // Nuevo estado para controlar la visualización de opiniones destacadas
    const [mostrarDestacadas, setMostrarDestacadas] = useState(false);
    // Nuevo estado para almacenar las opiniones destacadas
    // eslint-disable-next-line no-unused-vars
    const [opinionesDestacadas, setOpinionesDestacadas] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = JSON.parse(atob(token.split('.')[1]));
                setCurrentUser(decoded.usuario);
            } catch (error) {
                console.error('Error decodificando token:', error);
                localStorage.removeItem('token');
            }
        }
        fetchOpinions();
    }, []);

    const fetchOpinions = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/opinions');
            setOpinions(response.data);
            
            // Filtrar las opiniones destacadas directamente del conjunto completo
            // en lugar de hacer una petición separada que podría estar fallando
            const destacadas = response.data.filter(opinion => opinion.destacada === true);
            setOpinionesDestacadas(destacadas);
            
            // Mantener también la petición original por si se corrige en el futuro
            try {
                const respuestaDestacadas = await axios.get('http://localhost:3001/api/opinions/destacadas');
                // Si la respuesta contiene datos, actualizar el estado
                if (respuestaDestacadas.data && respuestaDestacadas.data.length > 0) {
                    setOpinionesDestacadas(respuestaDestacadas.data);
                }
            } catch (destacadasError) {
                console.error('Error obteniendo opiniones destacadas:', destacadasError);
                // Si falla la petición específica, ya tenemos las destacadas filtradas
            }
        } catch (error) {
            console.error('Error fetching opinions:', error);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImage(file);
    };

    const clearForm = () => {
        setNewOpinion('');
        setImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
//Funcion para expandir opiniones
    const toggleOpinion = (id) => {
        setExpandedOpinions(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // eslint-disable-next-line no-unused-vars
    const encryptImage = async (file) => {
        const reader = new FileReader();
        return new Promise((resolve) => {
            reader.onload = async (e) => {
                const arrayBuffer = e.target.result;
                const key = await window.crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    true,
                    ['encrypt']
                );
                const iv = window.crypto.getRandomValues(new Uint8Array(12));
                const encrypted = await window.crypto.subtle.encrypt(
                    { name: 'AES-GCM', iv },
                    key,
                    arrayBuffer
                );
                
                const encryptedFile = new Blob([iv, encrypted]);
                const keyExported = await window.crypto.subtle.exportKey('raw', key);
                resolve({ file: encryptedFile, key: keyExported, iv });
            };
            reader.readAsArrayBuffer(file);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        
        if (!token) {
            navigate('/registro');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('opinion', newOpinion);
            
            if (image) {
                // Verificar el tipo de archivo
                if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(image.type)) {
                    alert('Solo se permiten archivos JPG, JPEG, PNG y GIF');
                    setLoading(false);
                    return;
                }
                
                // Verificar el tamaño del archivo (5MB máximo)
                if (image.size > 5 * 1024 * 1024) {
                    alert('El archivo es demasiado grande. El tamaño máximo es 5MB');
                    setLoading(false);
                    return;
                }

                formData.append('image', image);
            }

            const response = await axios.post(`${config.API_URL}/api/opinions`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.data) {
                clearForm();
                fetchOpinions();
            }
        } catch (error) {
            console.error('Error submitting opinion:', error);
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('token');
                setCurrentUser('');
                navigate('/login');
            } else {
                alert('Error al publicar la opinión. Por favor, intente nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Filtrar todas las opiniones según el término de búsqueda
    const filteredOpinions = opinions.filter(opinion =>
        opinion.opinion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opinion.usuario.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filtrar opiniones destacadas si es necesario
    const filteredDestacadas = filteredOpinions.filter(opinion => opinion.destacada === true);

    // Determinar qué opiniones mostrar según el estado del checkbox
    const opinionsToDisplay = mostrarDestacadas ? filteredDestacadas : filteredOpinions;

    return (
        <div className="opinions-container">
            <div className="header-section">
                <button className="back-button" onClick={() => navigate(-1)}>
                    ← Regresar
                </button>
                <h2>Opiniones de Usuarios</h2>
            </div>
            
            {/* Añadir botones para alternar entre todas las opiniones y las destacadas */}
            <div className="opinion-filter-buttons">
                <button 
                    className={!mostrarDestacadas ? "active-filter" : ""}
                    onClick={() => setMostrarDestacadas(false)}
                >
                    Todas las Opiniones
                </button>
                <button 
                    className={mostrarDestacadas ? "active-filter" : ""}
                    onClick={() => setMostrarDestacadas(true)}
                >
                    Opiniones Destacadas
                </button>
            </div>
            
            {/* Reemplazar botones por un filtro de checkbox */}
            <div className="opinion-filter">
                <label className="filter-checkbox">
                    <input
                        type="checkbox"
                        checked={mostrarDestacadas}
                        onChange={(e) => setMostrarDestacadas(e.target.checked)}
                    />
                    Mostrar solo opiniones destacadas
                </label>
            </div>
            
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Buscar por usuario o contenido..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {currentUser ? (
                <div className="opinion-section">
                    <button 
                        className="toggle-form-button" 
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? 'Cancelar' : 'Publicar Nueva Opinión'}
                    </button>
                    
                    {showForm && (
                        <form onSubmit={handleSubmit} className="opinion-form">
                            <div className="form-group">
                                <label>Usuario:</label>
                                <input
                                    type="text"
                                    value={currentUser}
                                    disabled
                                    className="user-input"
                                />
                            </div>
                            <textarea
                                value={newOpinion}
                                onChange={(e) => setNewOpinion(e.target.value)}
                                placeholder="Escribe tu opinión..."
                                required
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleImageChange}
                                accept="image/*"
                                className="file-input"
                            />
                            <button type="submit" disabled={loading}>
                                {loading ? 'Publicando...' : 'Publicar Opinión'}
                            </button>
                        </form>
                    )}
                </div>
            ) : (
                <div className="login-prompt">
                    <p>Para publicar una opinión, necesitas iniciar sesión</p>
                    <button onClick={() => navigate('/login')}>Iniciar Sesión</button>
                </div>
            )}

            <div className="opinions-content">
                {opinionsToDisplay.map((opinion, index) => (
                    <div key={index} className={`opinion-card ${opinion.destacada ? 'opinion-destacada' : ''}`}>
                        <div className="opinion-header">
                            <h4>{opinion.usuario}</h4>
                            <span className="opinion-date">
                                {opinion.createdAt ? new Date(opinion.createdAt).toLocaleDateString() : 'Fecha no disponible'}
                            </span>
                            {opinion.destacada && (
                                <span className="destacada-badge">Destacada</span>
                            )}
                        </div>

                        <p className={expandedOpinions[index] ? 'expanded' : ''}>
                            {opinion.opinion.length > 150 && !expandedOpinions[index]
                                ? `${opinion.opinion.substring(0, 150)}...`
                                : opinion.opinion}
                        </p>
                        {opinion.opinion.length > 150 && (
                            <button 
                                className="read-more-btn"
                                onClick={() => toggleOpinion(index)}
                            >
                                {expandedOpinions[index] ? 'Leer menos' : 'Leer más'}
                            </button>
                        )}
                        {opinion.image && (
                            <img 
                                src={`${config.API_URL}${opinion.image}`} 
                                alt="Opinion" 
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                        )}
                    </div>
                ))}
                {opinionsToDisplay.length === 0 && (
                    <div className="no-results">
                        <p>{mostrarDestacadas ? 'No hay opiniones destacadas' : 'No se encontraron opiniones'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Opinions;