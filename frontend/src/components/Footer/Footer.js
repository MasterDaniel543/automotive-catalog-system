import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p>© {currentYear}-{currentYear + 2} Car Information. Todos los derechos reservados.</p>
        <p>Creado por <span className="creator">El Daniel</span></p>
        <p>GitHub: <a 
          href="https://github.com/MasterDaniel543" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="creator"
        >
          MasterDaniel
        </a></p>
      </div>
    </footer>
  );
};

export default Footer;