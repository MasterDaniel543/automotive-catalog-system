import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../EditorDashboard.css';
import config from '../../../config';

function AnunciosPanel() {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentAnuncio, setCurrentAnuncio] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    fechaInicio: '',
    fechaFin: '',
    activo: true,
    imagen: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchAnuncios();
  }, []);

  const fetchAnuncios = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.API_URL}/editor/anuncios`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAnuncios(response.data);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los anuncios');
      setLoading(false);
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      contenido: '',
      fechaInicio: '',
      fechaFin: '',
      activo: true,
      imagen: null
    });
    setPreviewImage(null);
  };

  const handleEdit = (anuncio) => {
    setCurrentAnuncio(anuncio);
    setFormData({
      titulo: anuncio.titulo,
      contenido: anuncio.contenido,
      fechaInicio: new Date(anuncio.fechaInicio).toISOString().split('T')[0],
      fechaFin: new Date(anuncio.fechaFin).toISOString().split('T')[0],
      activo: anuncio.activo,
      imagen: null
    });
    setPreviewImage(anuncio.imagen);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formDataToSend = new FormData();
    
    // Agregar todos los campos al FormData
    Object.keys(formData).forEach(key => {
      if (key !== 'imagen' || (key === 'imagen' && formData[key] !== null)) {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      if (currentAnuncio) {
        // Actualizar anuncio existente
        await axios.put(`${config.API_URL}/editor/anuncios/${currentAnuncio._id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        // Crear nuevo anuncio
        await axios.post(`${config.API_URL}/editor/anuncios`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      // Cerrar modal y actualizar lista
      setShowModal(false);
      setShowCreateModal(false);
      fetchAnuncios();
      resetForm();
    } catch (err) {
      console.error('Error al guardar el anuncio:', err);
      setError('Error al guardar el anuncio');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este anuncio?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${config.API_URL}/editor/anuncios/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchAnuncios();
      } catch (err) {
        console.error('Error al eliminar el anuncio:', err);
        setError('Error al eliminar el anuncio');
      }
    }
  };

  const handleCreateNew = () => {
    setFormData({
      titulo: '',
      contenido: '',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
      activo: true,
      imagen: null
    });
    setPreviewImage(null);
    setShowCreateModal(true);
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      
      // Añadir todos los campos al FormData
      Object.keys(formData).forEach(key => {
        if (key === 'imagen' && formData[key]) {
          data.append('image', formData[key]);
        } else {
          data.append(key, formData[key]);
        }
      });

      await axios.post(`${config.API_URL}/editor/anuncios`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setShowCreateModal(false);
      fetchAnuncios();
    } catch (err) {
      setError('Error al crear el anuncio');
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file' && files[0]) {
      setFormData({
        ...formData,
        imagen: files[0]
      });
      
      // Crear URL para previsualización
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(files[0]);
    } else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  if (loading) return <div className="loading">Cargando anuncios...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="panel-container">
      <div className="panel-header">
        <h2>Gestión de Anuncios Destacados</h2>
        <button className="create-btn" onClick={handleCreateNew}>
          Crear Nuevo Anuncio
        </button>
      </div>

      {anuncios.length === 0 ? (
        <div className="no-data-message">No hay anuncios disponibles</div>
      ) : (
        <div className="data-grid">
          {anuncios.map(anuncio => (
            <div key={anuncio._id} className="data-card">
              <div className="card-header">
                <h3>{anuncio.titulo}</h3>
                <div className="status-badge" style={{ backgroundColor: anuncio.activo ? 'var(--success)' : 'var(--danger)' }}>
                  {anuncio.activo ? 'Activo' : 'Inactivo'}
                </div>
              </div>
              
              {anuncio.imagen && (
                <div className="card-image">
                  <img src={`${config.API_URL}${anuncio.imagen}`} alt={anuncio.titulo} />
                </div>
              )}
              
              <div className="card-content">
                <p>{anuncio.contenido.length > 100 ? anuncio.contenido.substring(0, 100) + '...' : anuncio.contenido}</p>
                <div className="date-info">
                  <span>Desde: {formatDate(anuncio.fechaInicio)}</span>
                  <span>Hasta: {formatDate(anuncio.fechaFin)}</span>
                </div>
                <div className="created-info">
                  <span>Creado por: {anuncio.creadoPor}</span>
                  <span>Fecha: {formatDate(anuncio.createdAt)}</span>
                </div>
              </div>
              
              <div className="card-actions">
                <button className="edit-btn" onClick={() => handleEdit(anuncio)}>Editar</button>
                <button className="delete-btn" onClick={() => handleDelete(anuncio._id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edición */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Editar Anuncio</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Título:</label>
                <input 
                  type="text" 
                  name="titulo" 
                  value={formData.titulo} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Contenido:</label>
                <textarea 
                  name="contenido" 
                  value={formData.contenido} 
                  onChange={handleInputChange} 
                  required 
                  rows="5"
                ></textarea>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de inicio:</label>
                  <input 
                    type="date" 
                    name="fechaInicio" 
                    value={formData.fechaInicio} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>Fecha de fin:</label>
                  <input 
                    type="date" 
                    name="fechaFin" 
                    value={formData.fechaFin} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    name="activo" 
                    checked={formData.activo} 
                    onChange={handleInputChange} 
                  />
                  Anuncio activo
                </label>
              </div>
              
              <div className="form-group">
                <label>Imagen (opcional):</label>
                <input 
                  type="file" 
                  name="imagen" 
                  onChange={handleInputChange} 
                  accept="image/*" 
                />
                {previewImage && (
                  <div className="current-image-preview">
                    <img src={previewImage.startsWith('http') ? previewImage : `${config.API_URL}${previewImage}`} alt="Vista previa" />
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="submit-btn">Guardar Cambios</button>
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Creación */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Crear Nuevo Anuncio</h3>
            <form onSubmit={handleSubmitCreate}>
              <div className="form-group">
                <label>Título:</label>
                <input 
                  type="text" 
                  name="titulo" 
                  value={formData.titulo} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Contenido:</label>
                <textarea 
                  name="contenido" 
                  value={formData.contenido} 
                  onChange={handleInputChange} 
                  required 
                  rows="5"
                ></textarea>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de inicio:</label>
                  <input 
                    type="date" 
                    name="fechaInicio" 
                    value={formData.fechaInicio} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>Fecha de fin:</label>
                  <input 
                    type="date" 
                    name="fechaFin" 
                    value={formData.fechaFin} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Imagen (opcional):</label>
                <input 
                  type="file" 
                  name="imagen" 
                  onChange={handleInputChange} 
                  accept="image/*" 
                />
                {previewImage && (
                  <div className="current-image-preview">
                    <img src={previewImage} alt="Vista previa" />
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="submit-btn">Crear Anuncio</button>
                <button type="button" className="cancel-btn" onClick={() => setShowCreateModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnunciosPanel;