import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Catalog.css';
import config from '../../config';

function Catalog() {
  const [cars, setCars] = useState([]);
  const [mostVisitedCars, setMostVisitedCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMostVisited, setShowMostVisited] = useState(false); // Cambiado a false por defecto
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener todos los carros
        const carsResponse = await axios.get(`${config.API_URL}/api/cars`);
        setCars(carsResponse.data);
        
        // Obtener carros más visitados solo si la sección está visible
        if (showMostVisited) {
          const mostVisitedResponse = await axios.get(`${config.API_URL}/api/cars/stats/most-visited?limit=6`);
          setMostVisitedCars(mostVisitedResponse.data);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los coches');
        setLoading(false);
        console.error(err);
      }
    };

    fetchData();
  }, [showMostVisited]); // Dependencia agregada para recargar cuando se muestre la sección

  // Función para cargar carros más visitados cuando se muestra la sección
  const handleShowMostVisited = async () => {
    try {
      const mostVisitedResponse = await axios.get(`${config.API_URL}/api/cars/stats/most-visited?limit=6`);
      setMostVisitedCars(mostVisitedResponse.data);
      setShowMostVisited(true);
    } catch (err) {
      console.error('Error al cargar carros más visitados:', err);
    }
  };

  // Agrupar coches por marca
  const carsByBrand = cars.reduce((acc, car) => {
    const brand = car.brand.toLowerCase();
    if (!acc[brand]) {
      acc[brand] = [];
    }
    acc[brand].push(car);
    return acc;
  }, {});

  // Filtrar coches según la selección y búsqueda
  const filteredCars = selectedBrand === 'all'
    ? cars.filter(car => car.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : cars.filter(car => 
        car.brand.toLowerCase() === selectedBrand &&
        car.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const handleCardClick = (car) => {
    navigate(`/car/${car.brand.toLowerCase()}/${car._id}`);
  };

  // Función para formatear el número de visitas
  const formatViewCount = (count) => {
    if (count === 0) return 'Sin visitas';
    if (count === 1) return '1 visita';
    return `${count} visitas`;
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <section className="catalog" id="catalog">
      <div className="content">
        <div className="title-wrapper-catalog">
          <p>Encuentra lo que deseas</p>
          <h3>Catálogo</h3>
        </div>

        {/* Botón para mostrar sección de más visitados */}
        {!showMostVisited && (
          <div className="show-most-visited">
            <button 
              className="show-button"
              onClick={handleShowMostVisited}
            >
              🔥 Mostrar Modelos Más Visitados
            </button>
          </div>
        )}

        {/* Sección de Más Visitados */}
        {showMostVisited && mostVisitedCars.length > 0 && (
          <div className="most-visited-section">
            <div className="section-header">
              <h4>🔥 Modelos Más Visitados</h4>
              <button 
                className="toggle-button"
                onClick={() => setShowMostVisited(false)}
              >
                Ocultar
              </button>
            </div>
            <div className="most-visited-grid">
              {mostVisitedCars.map(car => (
                <div 
                  key={`most-visited-${car._id}`} 
                  className="car-card most-visited-card"
                  onClick={() => handleCardClick(car)}
                >
                  <div className="popularity-badge">
                    👁️ {car.viewCount}
                  </div>
                  <img 
                    src={`${config.API_URL}${car.image}`} 
                    alt={car.name}
                    className="car-image"
                  />
                  <h3>{car.name}</h3>
                  <p>{car.brand} - {car.year}</p>
                  <span className="view-count">{formatViewCount(car.viewCount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="filter-card">
          <select 
            className="brand-select"
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
          >
            <option value="all">Todas las marcas</option>
            {Object.keys(carsByBrand).map(brand => (
              <option key={brand} value={brand}>{brand.charAt(0).toUpperCase() + brand.slice(1)}</option>
            ))}
          </select>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Elige tu modelo favorito"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-button">Buscar</button>
        </div>

        <div className="catalog-section">
          <h4>Todos los Modelos</h4>
          <div className="car-grid">
            {filteredCars.map(car => (
              <div 
                key={car._id} 
                className="car-card"
                onClick={() => handleCardClick(car)}
                style={{ cursor: 'pointer' }}
              >
                <img 
                  src={`${config.API_URL}${car.image}`} 
                  alt={car.name}
                  className="car-image"
                />
                <h3>{car.name}</h3>
                <p>{car.brand} - {car.year}</p>
                <span className="view-count">{formatViewCount(car.viewCount || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Catalog;