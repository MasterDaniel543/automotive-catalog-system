import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './News.css';

const News = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3001/api/news?limit=15');
            const data = await response.json();
            
            if (data.success) {
                setNews(data.news);
            } else {
                setError('Error al cargar las noticias');
            }
        } catch (err) {
            setError('Error de conexión al servidor');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchKeyword.trim()) return;
        
        try {
            setSearching(true);
            const response = await fetch(`http://localhost:3001/api/news/search?keyword=${encodeURIComponent(searchKeyword)}&limit=10`);
            const data = await response.json();
            
            if (data.success) {
                setSearchResults(data.news);
            } else {
                setError('Error en la búsqueda');
            }
        } catch (err) {
            setError('Error al buscar noticias');
            console.error('Error:', err);
        } finally {
            setSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchKeyword('');
        setSearchResults([]);
    };

    const handleGoBack = () => {
        navigate(-1); // Regresa a la página anterior
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const displayNews = searchResults.length > 0 ? searchResults : news;

    if (loading) {
        return (
            <div className="news-container">
                <div className="loading">Cargando noticias...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="news-container">
                <button onClick={handleGoBack} className="back-button">
                    ← Regresar
                </button>
                <div className="error">{error}</div>
                <button onClick={fetchNews} className="retry-button">
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="news-container">
            <button onClick={handleGoBack} className="back-button">
                ← Regresar
            </button>
            
            <div className="news-header">
                <h1>Noticias Automotrices</h1>
                <p>Mantente al día con las últimas noticias del mundo automotriz</p>
            </div>

            <div className="search-section">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="Buscar noticias específicas..."
                        className="search-input"
                    />
                    <button type="submit" disabled={searching} className="search-button">
                        {searching ? 'Buscando...' : 'Buscar'}
                    </button>
                    {searchResults.length > 0 && (
                        <button type="button" onClick={clearSearch} className="clear-button">
                            Limpiar
                        </button>
                    )}
                </form>
            </div>

            <div className="news-grid">
                {displayNews.map((article, index) => (
                    <article key={index} className="news-card">
                        {article.image && (
                            <div className="news-image">
                                <img src={article.image} alt={article.title} />
                            </div>
                        )}
                        <div className="news-content">
                            <h3 className="news-title">
                                <a href={article.link} target="_blank" rel="noopener noreferrer">
                                    {article.title}
                                </a>
                            </h3>
                            <p className="news-description">{article.description}</p>
                            <div className="news-meta">
                                <span className="news-source">{article.source}</span>
                                <span className="news-date">{formatDate(article.pubDate)}</span>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {displayNews.length === 0 && (
                <div className="no-news">
                    <p>No se encontraron noticias.</p>
                </div>
            )}
        </div>
    );
};

export default News;