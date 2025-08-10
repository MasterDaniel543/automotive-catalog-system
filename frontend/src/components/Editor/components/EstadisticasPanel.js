import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../../config';

const EstadisticasPanel = () => {
  const [stats, setStats] = useState({
    mostVisited: [],
    generalStats: null,
    brandStats: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('general');

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Obtener estadísticas generales
      const [mostVisitedRes, generalRes, brandRes] = await Promise.all([
        axios.get(`${config.API_URL}/api/cars/stats/most-visited?limit=10`),
        axios.get(`${config.API_URL}/api/cars/stats/general`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${config.API_URL}/api/cars/stats/by-brand`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats({
        mostVisited: mostVisitedRes.data,
        generalStats: generalRes.data,
        brandStats: brandRes.data
      });
      setLoading(false);
    } catch (err) {
      setError('Error al cargar las estadísticas');
      setLoading(false);
      console.error(err);
    }
  };

  const resetCarViews = async (carId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${config.API_URL}/api/cars/${carId}/reset-views`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStatistics(); // Recargar estadísticas
    } catch (err) {
      console.error('Error al resetear vistas:', err);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  if (loading) return <div className="loading">Cargando estadísticas...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="panel-content">
      <div className="panel-header">
        <h2>📈 Estadísticas de Visitas</h2>
        <button className="btn-primary" onClick={fetchStatistics}>
          🔄 Actualizar
        </button>
      </div>

      {/* Navegación de vistas */}
      <div className="stats-nav">
        <button 
          className={`nav-btn ${activeView === 'general' ? 'active' : ''}`}
          onClick={() => setActiveView('general')}
        >
          📊 General
        </button>
        <button 
          className={`nav-btn ${activeView === 'top10' ? 'active' : ''}`}
          onClick={() => setActiveView('top10')}
        >
          🏆 Top 10
        </button>
        <button 
          className={`nav-btn ${activeView === 'brands' ? 'active' : ''}`}
          onClick={() => setActiveView('brands')}
        >
          🚗 Por Marca
        </button>
      </div>

      {/* Vista General */}
      {activeView === 'general' && stats.generalStats && (
        <div className="stats-section">
          <div className="stats-cards">
            <div className="stat-card">
              <h3>Total de Visitas</h3>
              <p className="stat-number">{formatNumber(stats.generalStats.totalViews)}</p>
            </div>
            <div className="stat-card">
              <h3>Promedio por Carro</h3>
              <p className="stat-number">{stats.generalStats.averageViews.toFixed(1)}</p>
            </div>
            <div className="stat-card">
              <h3>Carros sin Visitas</h3>
              <p className="stat-number">{stats.generalStats.unvisitedCars}</p>
            </div>
            <div className="stat-card">
              <h3>Más Visitado</h3>
              <p className="stat-text">{stats.generalStats.mostVisitedCar?.name || 'N/A'}</p>
              <p className="stat-subtext">{formatNumber(stats.generalStats.mostVisitedCar?.viewCount || 0)} visitas</p>
            </div>
          </div>
        </div>
      )}

      {/* Top 10 Más Visitados */}
      {activeView === 'top10' && (
        <div className="stats-section">
          <h3>🏆 Top 10 Carros Más Visitados</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Posición</th>
                  <th>Imagen</th>
                  <th>Marca</th>
                  <th>Modelo</th>
                  <th>Año</th>
                  <th>Visitas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {stats.mostVisited.map((car, index) => (
                  <tr key={car._id}>
                    <td>
                      <span className={`position-badge ${index < 3 ? 'top-three' : ''}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td>
                      <img 
                        src={`${config.API_URL}${car.image}`} 
                        alt={car.name} 
                        className="car-thumbnail"
                        style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    </td>
                    <td>{car.brand}</td>
                    <td>{car.name}</td>
                    <td>{car.year}</td>
                    <td>
                      <span className="view-count-badge">
                        👁️ {formatNumber(car.viewCount)}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-reset"
                        onClick={() => resetCarViews(car._id)}
                        title="Resetear contador"
                      >
                        🔄 Reset
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estadísticas por Marca */}
      {activeView === 'brands' && (
        <div className="stats-section">
          <h3>🚗 Estadísticas por Marca</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Marca</th>
                  <th>Total Carros</th>
                  <th>Total Visitas</th>
                  <th>Promedio por Carro</th>
                  <th>Más Visitado</th>
                </tr>
              </thead>
              <tbody>
                {stats.brandStats.map((brand) => (
                  <tr key={brand.brand}>
                    <td><strong>{brand.brand}</strong></td>
                    <td>{brand.carCount}</td>
                    <td>{formatNumber(brand.totalViews)}</td>
                    <td>{brand.averageViews.toFixed(1)}</td>
                    <td>
                      {brand.mostVisited?.name || 'N/A'}
                      {brand.mostVisited && (
                        <span className="view-count-small">
                          ({formatNumber(brand.mostVisited.viewCount)} visitas)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstadisticasPanel;