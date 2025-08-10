import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';
import config from '../../config';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    usuario: '',
    email: '',
    contraseña: '',
    role: 'user'  // Cambiado de 'rol' a 'role'
  });
  const [editingUser, setEditingUser] = useState(null);
  const [showForm, setShowForm] = useState(false); // Estado para mostrar/ocultar el formulario
  const [currentUser, setCurrentUser] = useState(null); // Estado para almacenar el usuario actual
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Verificar si el usuario es admin
    const checkAdmin = async () => {
      try {
        const response = await axios.get(`${config.API_URL}/admin/check`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.data.isAdmin) {
          navigate('/');
        } else {
          // Guardar información del usuario actual
          setCurrentUser(response.data.user);
          fetchUsers();
        }
      } catch (err) {
        navigate('/');
      }
    };

    checkAdmin();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los usuarios');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      if (editingUser) {
        // Usar el ID en lugar del username
        await axios.put(`${config.API_URL}/admin/update-user/${editingUser._id}`, {
          usuario: formData.usuario,
          email: formData.email,
          contraseña: formData.contraseña,
          role: formData.role
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Crear nuevo usuario
        await axios.post(`${config.API_URL}/admin/registro`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Limpiar formulario y actualizar lista
      setFormData({ usuario: '', email: '', contraseña: '', role: 'user' });
      setEditingUser(null);
      setShowForm(false); // Ocultar formulario después de enviar
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar la solicitud');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      usuario: user.username, // Asegúrate de usar el campo correcto del usuario
      email: user.email,
      contraseña: '', // No mostramos la contraseña actual por seguridad
      role: user.role // Cambiado de 'rol' a 'role'
    });
    setShowForm(true); // Mostrar formulario al editar
  };

  const handleDeleteUser = async (userId, userRol, userEmail) => {
    // Verificar si el usuario a eliminar es administrador
    if (userRol === 'admin') {
      setError('No puedes eliminar a un administrador');
      return;
    }
    
    // Verificar si el usuario a eliminar es el mismo usuario actual
    if (currentUser && currentUser.email === userEmail) {
      setError('No puedes eliminarte a ti mismo');
      return;
    }

    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${config.API_URL}/admin/delete-user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchUsers();
      } catch (err) {
        setError('Error al eliminar el usuario');
      }
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setFormData({ usuario: '', email: '', contraseña: '', role: 'user' }); // Cambiado 'rol' a 'role'
    setShowForm(false); // Ocultar formulario al cancelar
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({ usuario: '', email: '', contraseña: '', role: 'user' }); // Cambiado 'rol' a 'role'
    setShowForm(true); // Mostrar formulario para añadir usuario
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    navigate('/registro'); // Redirige a Registro.js en lugar de /login
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Panel de Administración</h1>
        <button onClick={handleLogout} className="logout-button">
          Cerrar Sesión
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="admin-container">
        {showForm ? (
          <div className="user-form-container">
            <h2>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-group">
                <label htmlFor="usuario">Usuario:</label>
                <input
                  type="text"
                  id="usuario"
                  name="usuario"
                  value={formData.usuario}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="contraseña">
                  {editingUser ? 'Nueva Contraseña (dejar en blanco para mantener la actual):' : 'Contraseña:'}
                </label>
                <input
                  type="password"
                  id="contraseña"
                  name="contraseña"
                  value={formData.contraseña}
                  onChange={handleInputChange}
                  required={!editingUser}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="role">Rol:</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="user">Usuario</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              <div className="form-buttons">
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="admin-actions">
            <button onClick={handleAddUser} className="add-button">
              Añadir Usuario
            </button>
          </div>
        )}
        
        <div className="users-list-container">
          <h2>Usuarios Registrados</h2>
          <table className="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.email}</td>
                  <td>
                    {user.role === 'admin' ? 'Administrador' : 
                     user.role === 'editor' ? 'Editor' : 'Usuario'}
                  </td>
                  <td>
                    <button onClick={() => handleEdit(user)} className="btn-edit">
                      Editar
                    </button>
                    {user.role !== 'admin' && (
                      <button 
                        onClick={() => handleDeleteUser(user._id, user.role, user.email)} 
                        className="btn-delete"
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;