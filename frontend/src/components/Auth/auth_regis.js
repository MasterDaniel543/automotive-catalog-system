import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import './auth_regis.css';
import config from '../../config';

function LoginForm() {
    const [showLogin, setShowLogin] = useState(true);
    const [email, setEmail] = useState(''); // Ahora usamos email para el login
    const [usuario, setUsuario] = useState(''); // Solo para registro
    const [contraseña, setContraseña] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState([]);
    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();
    const [captchaValue, setCaptchaValue] = useState(null);
    const [requireCaptcha, setRequireCaptcha] = useState(false);
    // Nuevo estado para el aviso de privacidad
    const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
    // Estado para mostrar el modal del aviso de privacidad
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

    const toggleForm = () => {
        setShowLogin(!showLogin);
        setError('');
        setSuccessMessage('');
        setEmail('');
        setUsuario('');
        setContraseña('');
        setPasswordErrors([]);
        setUsernameError('');
        setEmailError('');
        setPrivacyPolicyAccepted(false);
    };

    const checkCaptchaStatus = async (emailValue) => {
        try {
            if (emailValue && showLogin) {
                const response = await axios.get(`${config.API_URL}/api/check-captcha/${emailValue}`);
                setRequireCaptcha(response.data.captchaEnabled);
            }
        } catch (error) {
            console.error('Error al verificar el estado del CAPTCHA:', error);
        }
    };

    // Validaciones en tiempo real para el email
    useEffect(() => {
        if (email) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setEmailError('Ingresa un correo electrónico válido');
            } else {
                setEmailError('');
                checkCaptchaStatus(email);
            }
        }
    }, [email, showLogin]);

    // Validación para nombre de usuario (solo en registro)
    useEffect(() => {
        if (usuario && !showLogin) {
            if (usuario.length < 4) {
                setUsernameError('El usuario debe tener al menos 4 caracteres');
            } else if (!/^[a-zA-Z0-9_]+$/.test(usuario)) {
                setUsernameError('Solo se permiten letras, números y guiones bajos');
            } else {
                setUsernameError('');
            }
        }
    }, [usuario, showLogin]);

    const validatePassword = (password) => {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('La contraseña debe tener al menos 8 caracteres');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('La contraseña debe contener al menos una mayúscula');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('La contraseña debe contener al menos una minúscula');
        }
        
        if (!/[^A-Za-z0-9]/.test(password)) {
            errors.push('La contraseña debe contener al menos un carácter especial');
        }
        
        if (/\d{2}/.test(password)) {
            errors.push('La contraseña no debe contener números consecutivos');
        }
        
        for (let i = 0; i < password.length - 1; i++) {
            const current = password[i].toLowerCase();
            const next = password[i + 1].toLowerCase();
            if (current.match(/[a-z]/) && next.match(/[a-z]/) && 
                next.charCodeAt(0) === current.charCodeAt(0) + 1) {
                errors.push('La contraseña no debe contener letras consecutivas del abecedario');
                break;
            }
        }
        
        return errors;
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setContraseña(newPassword);
        setPasswordErrors(validatePassword(newPassword));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        
        // Validaciones antes de enviar
        if (!showLogin) {
            if (usernameError || emailError || passwordErrors.length > 0) {
                setError('Por favor, corrige los errores antes de continuar');
                return;
            }
            
            if (!usuario || !email || !contraseña) {
                setError('Todos los campos son obligatorios');
                return;
            }

            // Verificar que se haya aceptado el aviso de privacidad
            if (!privacyPolicyAccepted) {
                setError('Debes aceptar el aviso de privacidad para registrarte');
                return;
            }
        } else {
            if (!email || !contraseña) {
                setError('Correo electrónico y contraseña son obligatorios');
                return;
            }

            if (requireCaptcha && !captchaValue) {
                setError('Por favor, complete el CAPTCHA');
                return;
            }
        }

        setLoading(true);

        try {
            let response;
            if (showLogin) {
                response = await axios.post(`${config.API_URL}/login`, {
                    email,
                    contraseña,
                    captchaResponse: requireCaptcha ? captchaValue : undefined
                });

                if (response.data.token) {
                    setSuccessMessage('Inicio de sesión exitoso');
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('email', response.data.email);
                    localStorage.setItem('usuario', response.data.usuario);
                    localStorage.setItem('rol', response.data.role);
                    
                    // Redirección según el rol
                    if (response.data.role === 'admin') {
                        setTimeout(() => navigate('/admin'), 1500);
                    } else if (response.data.role === 'editor') {
                        setTimeout(() => navigate('/editor'), 1500);
                    } else {
                        setTimeout(() => navigate('/'), 1500);
                    }
                } else {
                    setError('Credenciales inválidas');
                }
            } else {
                response = await axios.post(`${config.API_URL}/registro`, {
                    usuario,
                    email,
                    contraseña,
                    privacyPolicyAccepted
                });
                setSuccessMessage('Registro exitoso. Redirigiendo a inicio de sesión...');
                setTimeout(() => {
                    setShowLogin(true);
                    setUsuario('');
                    setEmail('');
                    setContraseña('');
                    setPrivacyPolicyAccepted(false);
                }, 2000);
            }
        } catch (err) {
            if (err.response) {
                if (err.response.status === 404) {
                    setError('Correo electrónico no encontrado');
                } else if (err.response.status === 401) {
                    setError('Contraseña incorrecta');
                } else if (err.response.status === 409) {
                    setError(err.response.data.message || 'El usuario ya existe');
                } else if (err.response.status === 400 && err.response.data.message === 'Se requiere verificación CAPTCHA') {
                    setRequireCaptcha(true);
                    setError('Por favor, complete el CAPTCHA para continuar');
                } else {
                    setError(err.response.data.message || 'Error en el servidor');
                }
            } else {
                setError('Error de conexión');
            }
        } finally {
            setLoading(false);
        }
    };

    // Función para abrir el modal del aviso de privacidad
    const openPrivacyPolicy = (e) => {
        e.preventDefault();
        setShowPrivacyPolicy(true);
    };

    // Función para cerrar el modal del aviso de privacidad
    const closePrivacyPolicy = () => {
        setShowPrivacyPolicy(false);
    };

    return (
        <div className="login-container">
            {/* Modal del aviso de privacidad */}
            {showPrivacyPolicy && (
                <div className="privacy-policy-modal">
                    <div className="privacy-policy-content">
                        <h2>Aviso de Privacidad</h2>
                        <div className="privacy-policy-text">
                            {/* Usar iframe para mostrar el PDF */}
                            <iframe 
                                src="/AVISO DE PRIVACIDAD.pdf" 
                                width="100%" 
                                height="500px" 
                                title="Aviso de Privacidad"
                                frameBorder="0"
                            ></iframe>
                        </div>
                        <button className="form-button" onClick={closePrivacyPolicy}>Cerrar</button>
                    </div>
                </div>
            )}

            <div className="form-toggle-labels">
                <span 
                    className={showLogin ? 'active' : ''} 
                    onClick={() => !loading && setShowLogin(true)}
                >
                    Iniciar Sesión
                </span>
                <span 
                    className={!showLogin ? 'active' : ''} 
                    onClick={() => !loading && setShowLogin(false)}
                >
                    Registrarse
                </span>
            </div>
            <div className="form-toggle">
                <label className="switch">
                    <input 
                        type="checkbox" 
                        checked={!showLogin} 
                        onChange={toggleForm}
                        disabled={loading}
                    />
                    <span className="slider round"></span>
                </label>
            </div>
            <div className="container">
                <div className="form-card">
                    <h2>{showLogin ? 'Iniciar Sesión' : 'Registrarse'}</h2>
                    {error && <p className="error-message">{error}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}
                    
                    <form onSubmit={handleSubmit}>
                        {/* Campo de email siempre visible */}
                        <div className="form-group">
                            <input
                                type="email"
                                placeholder="Correo electrónico"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                required
                            />
                            {emailError && <p className="error-message">{emailError}</p>}
                        </div>
                        
                        {/* Campo de nombre de usuario solo en registro */}
                        {!showLogin && (
                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="Nombre de usuario"
                                    value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                                {usernameError && <p className="error-message">{usernameError}</p>}
                            </div>
                        )}
                        
                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Contraseña"
                                value={contraseña}
                                onChange={handlePasswordChange}
                                disabled={loading}
                                required
                            />
                            {passwordErrors.length > 0 && (
                                <div className="password-errors">
                                    {passwordErrors.map((error, index) => (
                                        <p key={index} className="error-message">{error}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {showLogin && requireCaptcha && (
                            <div className="form-group captcha-container">
                                <ReCAPTCHA
                                    sitekey="6LfK5GcrAAAAAHrXVgit5VHyRpLA8SkkEAAZfn8u"
                                    onChange={(value) => setCaptchaValue(value)}
                                />
                            </div>
                        )}
                        
                        {/* Checkbox de aviso de privacidad (solo en registro) */}
                        {!showLogin && (
                            <div className="form-group privacy-policy-group">
                                <div className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        id="privacyPolicy"
                                        checked={privacyPolicyAccepted}
                                        onChange={(e) => setPrivacyPolicyAccepted(e.target.checked)}
                                        disabled={loading}
                                    />
                                    <label htmlFor="privacyPolicy">
                                        He leído y acepto el <a href="#" onClick={openPrivacyPolicy}>Aviso de Privacidad</a>
                                    </label>
                                </div>
                            </div>
                        )}
                        
                        <button 
                            type="submit" 
                            className="form-button"
                            disabled={loading}
                        >
                            {loading ? 'Procesando...' : (showLogin ? 'Iniciar Sesión' : 'Registrarse')}
                        </button>
                    </form>
                </div>
                <button 
                    className="form-button" 
                    onClick={() => navigate('/')}
                    disabled={loading}
                >
                    Regresar al Inicio
                </button>
            </div>
        </div>
    );
}

export default LoginForm;