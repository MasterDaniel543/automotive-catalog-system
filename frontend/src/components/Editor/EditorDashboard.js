import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import PanelPrincipal from './components/PanelPrincipal';
import OpinionesPanel from './components/OpinionesPanel';
import UsuariosPanel from './components/UsuariosPanel';
import CarrosPanel from './components/CarrosPanel';
import AnunciosPanel from './components/AnunciosPanel';
import EstadisticasPanel from './components/EstadisticasPanel';
import './EditorDashboard.css';

function EditorDashboard() {
  const [activeTab, setActiveTab] = useState('panel');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('rol');
  const navigate = useNavigate();

  // Verificar si el usuario está autenticado y es editor
  if (!token || userRole !== 'editor') {
    return <Navigate to="/" replace />;
  }

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    navigate('/Registro');
  };

  // Función para alternar el sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Función para manejar el cambio de tab y cerrar sidebar en móvil
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false); // Cerrar sidebar después de seleccionar en móvil
  };

  return (
    <div className="editor-dashboard">
      {/* Botón hamburguesa */}
      <button 
        className="hamburger-btn"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <span className={`hamburger-line ${sidebarOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-line ${sidebarOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-line ${sidebarOpen ? 'open' : ''}`}></span>
      </button>

      {/* Overlay para cerrar el menú en móvil */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      <div className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <h2>Panel de Editor</h2>
        <nav>
          <ul>
            <li 
              className={activeTab === 'panel' ? 'active' : ''}
              onClick={() => handleTabChange('panel')}
            >
              Panel Principal
            </li>
            <li 
              className={activeTab === 'estadisticas' ? 'active' : ''}
              onClick={() => handleTabChange('estadisticas')}
            >
              Estadísticas
            </li>
            <li 
              className={activeTab === 'opiniones' ? 'active' : ''}
              onClick={() => handleTabChange('opiniones')}
            >
              Gestión de Opiniones
            </li>
            <li 
              className={activeTab === 'usuarios' ? 'active' : ''}
              onClick={() => handleTabChange('usuarios')}
            >
              Gestión de Usuarios
            </li>
            <li 
              className={activeTab === 'carros' ? 'active' : ''}
              onClick={() => handleTabChange('carros')}
            >
              Gestión de Carros
            </li>
            <li 
              className={activeTab === 'anuncios' ? 'active' : ''}
              onClick={() => handleTabChange('anuncios')}
            >
              Anuncios Destacados
            </li>
            <li 
              className="logout-item"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </li>
          </ul>
        </nav>
      </div>

      <div className="dashboard-content">
        {activeTab === 'panel' && <PanelPrincipal />}
        {activeTab === 'estadisticas' && <EstadisticasPanel />}
        {activeTab === 'opiniones' && <OpinionesPanel />}
        {activeTab === 'usuarios' && <UsuariosPanel />}
        {activeTab === 'carros' && <CarrosPanel />}
        {activeTab === 'anuncios' && <AnunciosPanel />}
      </div>
    </div>
  );
}

export default EditorDashboard;