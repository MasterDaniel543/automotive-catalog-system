import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../EditorDashboard.css';
import config from '../../../config';

function CarrosPanel() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentCar, setCurrentCar] = useState(null);
  const [formData, setFormData] = useState({
    brand: '',
    name: '',
    year: '',
    engine: '',
    transmission: '',
    fuel: '',
    cylinders: '',
    power: '',
    acceleration: '',
    image: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uniqueBrands, setUniqueBrands] = useState([]);
  const [newBrand, setNewBrand] = useState('');
  const [isAddingNewBrand, setIsAddingNewBrand] = useState(false);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.API_URL}/editor/cars`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCars(response.data);
      
      // Extraer marcas únicas
      const brands = [...new Set(response.data.map(car => car.brand))];
      setUniqueBrands(brands.sort());
      
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los carros');
      setLoading(false);
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      brand: '',
      name: '',
      year: '',
      engine: '',
      transmission: '',
      fuel: '',
      cylinders: '',
      power: '',
      acceleration: '',
      image: null
    });
    setPreviewImage(null);
  };

  const handleEdit = (car) => {
    setCurrentCar(car);
    setFormData({
      brand: car.brand,
      name: car.name,
      year: car.year.toString(),
      engine: car.specs.engine,
      transmission: car.specs.transmission,
      fuel: car.specs.fuel,
      cylinders: car.specs.cylinders,
      power: car.specs.power,
      acceleration: car.specs.acceleration,
      image: null,
      originalImage: car.image // Guardar la imagen original
    });
    setPreviewImage(`${config.API_URL}${car.image}`);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formDataToSend = new FormData();
    
    // Agregar todos los campos al FormData
    Object.keys(formData).forEach(key => {
      if (key !== 'image' || (key === 'image' && formData[key] !== null)) {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      if (currentCar) {
        // Actualizar carro existente
        await axios.put(`${config.API_URL}/editor/cars/${currentCar._id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        // Crear nuevo carro
        await axios.post(`${config.API_URL}/editor/cars`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      // Cerrar modal y actualizar lista
      setShowModal(false);
      setShowCreateModal(false);
      fetchCars();
      resetForm();
    } catch (err) {
      console.error('Error al guardar el carro:', err);
      setError('Error al guardar el carro');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este carro?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${config.API_URL}/editor/cars/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchCars();
      } catch (err) {
        console.error('Error al eliminar el carro:', err);
        setError('Error al eliminar el carro');
      }
    }
  };

  const handleCreateCar = () => {
    setFormData({
      brand: '',
      name: '',
      year: '',
      engine: '',
      transmission: '',
      fuel: '',
      cylinders: '',
      power: '',
      acceleration: '',
      image: null
    });
    setPreviewImage(null);
    setIsAddingNewBrand(false);
    setShowCreateModal(true);
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      
      // Añadir todos los campos al FormData
      Object.keys(formData).forEach(key => {
        if (key === 'image' && formData[key]) {
          data.append('image', formData[key]);
        } else if (key !== 'image' && key !== 'originalImage') {
          data.append(key, formData[key]);
        }
      });

      await axios.post(`${config.API_URL}/editor/cars`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setShowCreateModal(false);
      fetchCars();
    } catch (err) {
      setError('Error al crear el carro');
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Crear URL para previsualización
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="panel-content">
      <div className="panel-header">
        <h2>Gestión de Carros</h2>
        <button className="btn-primary" onClick={handleCreateCar}>Añadir Nuevo Carro</button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Año</th>
              <th>Motor</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cars.map(car => (
              <tr key={car._id}>
                <td>
                  <img 
                    src={`${config.API_URL}${car.image}`} 
                    alt={car.name} 
                    className="car-thumbnail" 
                    style={{ width: '80px', height: '50px', objectFit: 'cover' }}
                  />
                </td>
                <td>{car.brand}</td>
                <td>{car.name}</td>
                <td>{car.year}</td>
                <td>{car.specs.engine}</td>
                <td>
                  <button 
                    className="btn-edit" 
                    onClick={() => handleEdit(car)}
                  >
                    Editar
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDelete(car._id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Edición */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Editar Carro</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Marca:</label>
                {!isAddingNewBrand ? (
                  <div className="brand-selection">
                    <select 
                      name="brand" 
                      value={formData.brand} 
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecciona una marca</option>
                      {uniqueBrands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                    <button 
                      type="button" 
                      className="btn-secondary btn-small"
                      onClick={() => {
                        setIsAddingNewBrand(true);
                        setNewBrand('');
                      }}
                    >
                      Agregar Nueva Marca
                    </button>
                  </div>
                ) : (
                  <div className="new-brand-input">
                    <input 
                      type="text" 
                      value={newBrand} 
                      onChange={(e) => setNewBrand(e.target.value)}
                      placeholder="Ingresa nueva marca"
                      required 
                    />
                    <div className="brand-buttons">
                      <button 
                        type="button" 
                        className="btn-primary btn-small"
                        onClick={() => {
                          if (newBrand.trim()) {
                            setFormData(prev => ({ ...prev, brand: newBrand.trim() }));
                            setUniqueBrands(prev => [...prev, newBrand.trim()].sort());
                            setIsAddingNewBrand(false);
                          }
                        }}
                      >
                        Guardar
                      </button>
                      <button 
                        type="button" 
                        className="btn-secondary btn-small"
                        onClick={() => setIsAddingNewBrand(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Modelo:</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Año:</label>
                <input 
                  type="number" 
                  name="year" 
                  value={formData.year} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Motor:</label>
                <input 
                  type="text" 
                  name="engine" 
                  value={formData.engine} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Transmisión:</label>
                <input 
                  type="text" 
                  name="transmission" 
                  value={formData.transmission} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Combustible:</label>
                <input 
                  type="text" 
                  name="fuel" 
                  value={formData.fuel} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Cilindros:</label>
                <input 
                  type="text" 
                  name="cylinders" 
                  value={formData.cylinders} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Potencia:</label>
                <input 
                  type="text" 
                  name="power" 
                  value={formData.power} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Aceleración:</label>
                <input 
                  type="text" 
                  name="acceleration" 
                  value={formData.acceleration} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Imagen:</label>
                <input 
                  type="file" 
                  name="image" 
                  onChange={handleImageChange} 
                  accept="image/*" 
                />
                {previewImage && (
                  <div className="image-preview">
                    <img 
                      src={previewImage} 
                      alt="Vista previa" 
                      style={{ maxWidth: '200px', maxHeight: '150px' }} 
                    />
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Guardar Cambios</button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Creación */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Añadir Nuevo Carro</h3>
            <form onSubmit={handleSubmitCreate}>
              <div className="form-group">
                <label>Marca:</label>
                {!isAddingNewBrand ? (
                  <div className="brand-selection">
                    <select 
                      name="brand" 
                      value={formData.brand} 
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecciona una marca</option>
                      {uniqueBrands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                    <button 
                      type="button" 
                      className="btn-secondary btn-small"
                      onClick={() => {
                        setIsAddingNewBrand(true);
                        setNewBrand('');
                      }}
                    >
                      Agregar Nueva Marca
                    </button>
                  </div>
                ) : (
                  <div className="new-brand-input">
                    <input 
                      type="text" 
                      value={newBrand} 
                      onChange={(e) => setNewBrand(e.target.value)}
                      placeholder="Ingresa nueva marca"
                      required 
                    />
                    <div className="brand-buttons">
                      <button 
                        type="button" 
                        className="btn-primary btn-small"
                        onClick={() => {
                          if (newBrand.trim()) {
                            setFormData(prev => ({ ...prev, brand: newBrand.trim() }));
                            setUniqueBrands(prev => [...prev, newBrand.trim()].sort());
                            setIsAddingNewBrand(false);
                          }
                        }}
                      >
                        Guardar
                      </button>
                      <button 
                        type="button" 
                        className="btn-secondary btn-small"
                        onClick={() => setIsAddingNewBrand(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Modelo:</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Año:</label>
                <input 
                  type="number" 
                  name="year" 
                  value={formData.year} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Motor:</label>
                <input 
                  type="text" 
                  name="engine" 
                  value={formData.engine} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Transmisión:</label>
                <input 
                  type="text" 
                  name="transmission" 
                  value={formData.transmission} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Combustible:</label>
                <input 
                  type="text" 
                  name="fuel" 
                  value={formData.fuel} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Cilindros:</label>
                <input 
                  type="text" 
                  name="cylinders" 
                  value={formData.cylinders} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Potencia:</label>
                <input 
                  type="text" 
                  name="power" 
                  value={formData.power} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Aceleración:</label>
                <input 
                  type="text" 
                  name="acceleration" 
                  value={formData.acceleration} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Imagen:</label>
                <input 
                  type="file" 
                  name="image" 
                  onChange={handleImageChange} 
                  accept="image/*" 
                  required 
                />
                {previewImage && (
                  <div className="image-preview">
                    <img 
                      src={previewImage} 
                      alt="Vista previa" 
                      style={{ maxWidth: '200px', maxHeight: '150px' }} 
                    />
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Crear Carro</button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CarrosPanel;