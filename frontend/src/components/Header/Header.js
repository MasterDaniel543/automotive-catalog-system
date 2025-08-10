import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import HeaderBlock from './HeaderBlock';
// Eliminamos la importación de useTheme
import './Header.css';

function Header() {
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  // Eliminamos la constante theme y toggleTheme

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    if (token && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    }

    // Scroll effect
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const maxScroll = 500;
      const opacity = Math.max(1 - (scrollPosition / maxScroll), 0.2);
      setScrollOpacity(opacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
    window.location.href = '/';
  };

  return (
    <header style={{ opacity: scrollOpacity, transition: 'opacity 0.3s ease' }}>
      <div className="content">
        <Navbar />
        {isLoggedIn && (
          <div className="user-menu">
            <span>Bienvenido, {username}</span>
            <Link to="/opinions" className="nav-link">Opiniones</Link>
            <Link to="/user-settings" className="nav-link">Ajustes</Link>
            <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
          </div>
        )}
        <HeaderBlock />
      </div>
    </header>
  );
}

export default Header;