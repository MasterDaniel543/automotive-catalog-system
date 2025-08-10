import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../../config';

function UsuariosPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [suspendForm, setSuspendForm] = useState({
    days: 1,
    reason: ''
  });
  const [warnForm, setWarnForm] = useState({
    message: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.API_URL}/editor/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      setError('Error al cargar los usuarios. Por favor, intenta de nuevo más tarde.');
      setLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleSuspendSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${config.API_URL}/editor/suspend-user`, {
        userId: currentUser._id,
        days: suspendForm.days,
        reason: suspendForm.reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowSuspendModal(false);
      fetchUsers();
    } catch (err) {
      console.error('Error al suspender usuario:', err);
      setError('Error al suspender al usuario');
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleWarnSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${config.API_URL}/editor/warn-user`, {
        userId: currentUser._id,
        message: warnForm.message
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowWarnModal(false);
      fetchUsers();
    } catch (err) {
      console.error('Error al advertir usuario:', err);
      setError('Error al enviar advertencia al usuario');
    }
  };

  const handleSuspend = (user) => {
    setCurrentUser(user);
    setSuspendForm({
      days: 1,
      reason: ''
    });
    setShowSuspendModal(true);
  };

  const handleWarn = (user) => {
    setCurrentUser(user);
    setWarnForm({
      message: ''
    });
    setShowWarnModal(true);
  };

  const handleSubmitSuspend = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/editor/users/${currentUser.username}/suspend`,
        suspendForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Actualizar la lista de usuarios
      fetchUsers();
      setShowSuspendModal(false);
    } catch (err) {
      console.error('Error al suspender usuario:', err);
      alert('Error al suspender usuario. Por favor, intenta de nuevo.');
    }
  };

  const handleSubmitWarn = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/editor/users/${currentUser.username}/warn`,
        warnForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Actualizar la lista de usuarios
      fetchUsers();
      setShowWarnModal(false);
    } catch (err) {
      console.error('Error al enviar advertencia:', err);
      alert('Error al enviar advertencia. Por favor, intenta de nuevo.');
    }
  };

  const handleInputChange = (e, formSetter) => {
    const { name, value } = e.target;
    formSetter(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  if (loading) return <div className="loading">Cargando usuarios...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="usuarios-panel">
      <h2>Gestión de Usuarios</h2>
      
      <table className="data-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Email</th>
            <th>Fecha de Registro</th>
            <th>Estado</th>
            <th>Advertencias</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                {user.suspended ? 
                  `Suspendido hasta ${new Date(user.suspensionEndDate).toLocaleDateString()}` : 
                  'Activo'}
              </td>
              <td>{user.warnings ? user.warnings.length : 0}</td>
              <td>
                <button 
                  className="action-btn edit-btn" 
                  onClick={() => handleSuspend(user)}
                  disabled={user.suspended}
                >
                  Suspender
                </button>
                <button 
                  className="action-btn warning-btn" 
                  onClick={() => handleWarn(user)}
                >
                  Advertir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal de suspensión */}
      {showSuspendModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Suspender Usuario: {currentUser.username}</h3>
              <button className="close-btn" onClick={() => setShowSuspendModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmitSuspend}>
              <div className="form-group">
                <label htmlFor="days">Días de suspensión:</label>
                <input
                  type="number"
                  id="days"
                  name="days"
                  min="1"
                  max="30"
                  value={suspendForm.days}
                  onChange={(e) => handleInputChange(e, setSuspendForm)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="reason">Motivo de la suspensión:</label>
                <textarea
                  id="reason"
                  name="reason"
                  value={suspendForm.reason}
                  onChange={(e) => handleInputChange(e, setSuspendForm)}
                  required
                />
              </div>
              
              <button type="submit" className="submit-btn">Suspender Usuario</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de advertencia */}
      {showWarnModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Advertir a Usuario: {currentUser.username}</h3>
              <button className="close-btn" onClick={() => setShowWarnModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmitWarn}>
              <div className="form-group">
                <label htmlFor="message">Mensaje de advertencia:</label>
                <textarea
                  id="message"
                  name="message"
                  value={warnForm.message}
                  onChange={(e) => handleInputChange(e, setWarnForm)}
                  required
                />
              </div>
              
              <button type="submit" className="submit-btn">Enviar Advertencia</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsuariosPanel;