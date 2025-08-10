import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CarDetails.css';
import config from '../../config';

const CarDetails = () => {
  const { brand, id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        setLoading(true);
        
        // Verificar si ya se incrementó en esta sesión
        const viewedCars = JSON.parse(sessionStorage.getItem('viewedCars') || '[]');
        const alreadyViewed = viewedCars.includes(id);
        
        if (!alreadyViewed) {
          // Primera vez viendo este carro en esta sesión - incrementar contador
          const response = await axios.get(`${config.API_URL}/api/cars/${id}`);
          setCar(response.data);
          
          // Marcar como visto en esta sesión
          viewedCars.push(id);
          sessionStorage.setItem('viewedCars', JSON.stringify(viewedCars));
        } else {
          // Ya se vio en esta sesión - obtener sin incrementar
          const response = await axios.get(`${config.API_URL}/api/cars`);
          const foundCar = response.data.find(c => c._id === id);
          setCar(foundCar);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los detalles del carro');
        setLoading(false);
        console.error(err);
      }
    };

    fetchCarDetails();
  }, [id]);

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!car) return <div>Carro no encontrado</div>;

  return (
    <section className="car-details">
      <div className="container">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Volver al catálogo
        </button>
        <div className="car-details-content">
          <div className="car-image">
            <img src={`${config.API_URL}${car.image}`} alt={car.name} />
          </div>
          <div className="car-info">
            <h2>{car.name}</h2>
            <p className="brand">Marca: {car.brand}</p>
            <p className="year">Año: {car.year}</p>
            <p className="view-count">👁️ {car.viewCount || 0} visitas</p>
            <div className="specs-grid">
              <div className="spec-item">
                <h4>Motor</h4>
                <p>{car.specs.engine}</p>
              </div>
              <div className="spec-item">
                <h4>Transmisión</h4>
                <p>{car.specs.transmission}</p>
              </div>
              <div className="spec-item">
                <h4>Combustible</h4>
                <p>{car.specs.fuel}</p>
              </div>
              <div className="spec-item">
                <h4>Cilindros</h4>
                <p>{car.specs.cylinders}</p>
              </div>
              <div className="spec-item">
                <h4>Potencia</h4>
                <p>{car.specs.power}</p>
              </div>
              <div className="spec-item">
                <h4>Aceleración</h4>
                <p>{car.specs.acceleration}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CarDetails;