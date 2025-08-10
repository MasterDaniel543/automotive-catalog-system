import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
// Eliminamos la importación de useTheme
import axios from 'axios';
import './UserSettings.css';
import config from '../../config';

function UserSettings() {
    const navigate = useNavigate();
    // Eliminamos la constante theme y toggleTheme
    const [captchaEnabled, setCaptchaEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    // Nuevo estado para el modal de confirmación
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const decoded = jwtDecode(token);
            if (decoded.role !== 'user') {
                navigate('/');
                return;
            }

            // Cargar la configuración del usuario
            fetchUserSettings(token);
        } catch (error) {
            navigate('/login');
        }
    }, [navigate]);

    const fetchUserSettings = async (token) => {
        try {
            const response = await axios.get(`${config.API_URL}/api/user/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCaptchaEnabled(response.data.captchaEnabled);
        } catch (error) {
            console.error('Error al cargar la configuración:', error);
        }
    };

    const handleCaptchaToggle = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setLoading(true);
        try {
            const response = await axios.post(`${config.API_URL}/api/user/settings/captcha`, {
                enabled: !captchaEnabled
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCaptchaEnabled(response.data.captchaEnabled);
        } catch (error) {
            console.error('Error al actualizar la configuración:', error);
        } finally {
            setLoading(false);
        }
    };

    // Nueva función para mostrar el modal de confirmación
    const showRevokePrivacyConfirmation = () => {
        setShowConfirmModal(true);
    };

    // Nueva función para rechazar las políticas de privacidad y eliminar datos
    const handleRevokePrivacyPolicy = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setLoading(true);
        try {
            await axios.post(`${config.API_URL}/api/user/revoke-privacy-policy`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Cerrar sesión y redirigir al inicio
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            localStorage.removeItem('rol');
            localStorage.removeItem('email');
            
            navigate('/');
            alert('Tu cuenta y todos tus datos han sido eliminados correctamente.');
        } catch (error) {
            console.error('Error al revocar políticas de privacidad:', error);
            alert('Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.');
        } finally {
            setLoading(false);
            setShowConfirmModal(false);
        }
    };

    return (
        <div className="settings-container">
            <button className="back-button" onClick={() => navigate(-1)}>
                ← Regresar
            </button>
            
            <div className="settings-header">
                <h2>Configuración de Usuario</h2>
            </div>

            <div className="settings-section">
                <h3>Seguridad</h3>
                <div className="security-toggle">
                    <span>CAPTCHA al iniciar sesión</span>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={captchaEnabled}
                            onChange={handleCaptchaToggle}
                            disabled={loading}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
                <p className="security-description">
                    Activa esta opción para añadir una capa adicional de seguridad durante el inicio de sesión. El CAPTCHA ayuda a prevenir accesos automatizados no autorizados a tu cuenta.
                </p>
            </div>

            {/* Nueva sección para revocar políticas de privacidad */}
            <div className="settings-section danger-zone">
                <h3>Zona de Peligro</h3>
                <div className="danger-action">
                    <div className="danger-info">
                        <h4>Rechazar Políticas de Privacidad</h4>
                        <p>
                            Al rechazar las políticas de privacidad, tu cuenta y todos tus datos (incluyendo publicaciones, opiniones y cualquier otra información) serán eliminados permanentemente. Esta acción no se puede deshacer.
                        </p>
                    </div>
                    <button 
                        className="danger-button"
                        onClick={showRevokePrivacyConfirmation}
                        disabled={loading}
                    >
                        Rechazar y Eliminar Datos
                    </button>
                </div>
            </div>

            {/* Modal de confirmación */}
            {showConfirmModal && (
                <div className="modal-overlay">
                    <div className="confirmation-modal">
                        <h3>¿Estás seguro?</h3>
                        <p>
                            Esta acción eliminará permanentemente tu cuenta y todos tus datos. No podrás recuperar esta información.
                        </p>
                        <div className="modal-buttons">
                            <button 
                                className="cancel-button"
                                onClick={() => setShowConfirmModal(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="confirm-button"
                                onClick={handleRevokePrivacyPolicy}
                                disabled={loading}
                            >
                                {loading ? 'Procesando...' : 'Sí, eliminar todo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserSettings;