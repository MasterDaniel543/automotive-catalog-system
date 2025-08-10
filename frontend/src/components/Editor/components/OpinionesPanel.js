import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../../config';

function OpinionesPanel() {
  const [opinions, setOpinions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentOpinion, setCurrentOpinion] = useState(null);
  const [editForm, setEditForm] = useState({
    opinion: '',
    destacada: false,
    estado: 'aprobada'
  });

  useEffect(() => {
    fetchOpinions();
  }, []);

  const fetchOpinions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.API_URL}/editor/opinions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpinions(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error al obtener opiniones:', err);
      setError('Error al cargar las opiniones. Por favor, intenta de nuevo más tarde.');
      setLoading(false);
    }
  };

  const handleEdit = (opinion) => {
    setCurrentOpinion(opinion);
    setEditForm({
      opinion: opinion.opinion,
      destacada: opinion.destacada || false,
      estado: opinion.estado || 'aprobada'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta opinión?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${config.API_URL}/editor/opinions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchOpinions();
      } catch (err) {
        console.error('Error al eliminar la opinión:', err);
        setError('Error al eliminar la opinión');
      }
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${config.API_URL}/editor/opinions/${currentOpinion._id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      fetchOpinions();
    } catch (err) {
      console.error('Error al actualizar la opinión:', err);
      setError('Error al actualizar la opinión');
    }
  };

  const handleHighlight = async (id, isHighlighted) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${config.API_URL}/editor/opinions/${id}`, 
        { destacada: !isHighlighted },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Actualizar la lista de opiniones
      setOpinions(opinions.map(opinion => 
        opinion._id === id ? { ...opinion, destacada: !isHighlighted } : opinion
      ));
    } catch (err) {
      console.error('Error al destacar/quitar destacado de la opinión:', err);
      alert('Error al actualizar la opinión. Por favor, intenta de nuevo.');
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${config.API_URL}/editor/opinions/${currentOpinion._id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Actualizar la lista de opiniones
      setOpinions(opinions.map(opinion => 
        opinion._id === currentOpinion._id ? response.data : opinion
      ));
      setShowModal(false);
    } catch (err) {
      console.error('Error al editar la opinión:', err);
      alert('Error al editar la opinión. Por favor, intenta de nuevo.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm({
      ...editForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  if (loading) return <div className="loading">Cargando opiniones...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="opiniones-panel">
      <h2>Gestión de Opiniones</h2>
      
      <table className="data-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Opinión</th>
            <th>Imagen</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Destacada</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {opinions.map(opinion => (
            <tr key={opinion._id}>
              <td>{opinion.usuario}</td>
              <td>{opinion.opinion.length > 50 ? `${opinion.opinion.substring(0, 50)}...` : opinion.opinion}</td>
              <td>
                {opinion.image ? (
                  <div className="opinion-image-container">
                    <img 
                      src={`https://localhost:3443${opinion.image}`} 
                      alt="Imagen de la opinión" 
                      className="opinion-thumbnail" 
                      onClick={() => window.open(`https://localhost:3443${opinion.image}`, '_blank')}
                    />
                  </div>
                ) : (
                  <span>Sin imagen</span>
                )}
              </td>
              <td>{new Date(opinion.createdAt).toLocaleDateString()}</td>
              <td>{opinion.estado || 'aprobada'}</td>
              <td>{opinion.destacada ? 'Sí' : 'No'}</td>
              <td>
                <button 
                  className="action-btn edit-btn" 
                  onClick={() => handleEdit(opinion)}
                >
                  Editar
                </button>
                <button 
                  className="action-btn delete-btn" 
                  onClick={() => handleDelete(opinion._id)}
                >
                  Eliminar
                </button>
                <button 
                  className="action-btn highlight-btn" 
                  onClick={() => handleHighlight(opinion._id, opinion.destacada)}
                >
                  {opinion.destacada ? 'Quitar destacado' : 'Destacar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal de edición */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Editar Opinión</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmitEdit}>
              <div className="form-group">
                <label htmlFor="opinion">Opinión:</label>
                <textarea
                  id="opinion"
                  name="opinion"
                  value={editForm.opinion}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              {currentOpinion && currentOpinion.image && (
                <div className="form-group">
                  <label>Imagen actual:</label>
                  <div className="current-image-preview">
                    <img 
                      src={`${config.API_URL}${currentOpinion.image}`} 
                      alt="Imagen de la opinión" 
                      className="opinion-image-preview" 
                    />
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="estado">Estado:</label>
                <select
                  id="estado"
                  name="estado"
                  value={editForm.estado}
                  onChange={handleInputChange}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="rechazada">Rechazada</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="destacada"
                    checked={editForm.destacada}
                    onChange={handleInputChange}
                  />
                  Destacar esta opinión
                </label>
              </div>
              
              <button type="submit" className="submit-btn">Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OpinionesPanel;