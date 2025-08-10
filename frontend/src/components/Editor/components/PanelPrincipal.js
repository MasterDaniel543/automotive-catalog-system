import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../../config';

function PanelPrincipal() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${config.API_URL}/editor/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error al obtener estadísticas:', err);
        setError('Error al cargar las estadísticas. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="loading">Cargando estadísticas...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="panel-principal">
      <h2>Panel Principal</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total de Opiniones</h3>
          <div className="stat-value">{stats.totalOpinions}</div>
        </div>
        
        <div className="stat-card">
          <h3>Opiniones Destacadas</h3>
          <div className="stat-value">{stats.highlightedOpinions}</div>
        </div>
        
        <div className="stat-card">
          <h3>Opiniones Pendientes</h3>
          <div className="stat-value">{stats.pendingOpinions}</div>
        </div>
        
        <div className="stat-card">
          <h3>Total de Usuarios</h3>
          <div className="stat-value">{stats.totalUsers}</div>
        </div>
        
        <div className="stat-card">
          <h3>Usuarios Suspendidos</h3>
          <div className="stat-value">{stats.suspendedUsers}</div>
        </div>
      </div>
      
      <div className="chart-container">
        <h3>Opiniones por Día (Últimos 7 días)</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {stats.opinionsByDay.map(day => (
              <tr key={day._id}>
                <td>{new Date(day._id).toLocaleDateString()}</td>
                <td>{day.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PanelPrincipal;