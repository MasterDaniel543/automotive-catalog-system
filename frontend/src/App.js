import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Registro from './components/Auth/auth_regis';
import Catalog from './components/Catalog/Catalog';
import CarDetails from './components/Catalog/CarDetails';
import Opinions from './components/Opinions/Opinions';
import Footer from './components/Footer/Footer';
import AdminPanel from './components/Rol/AdminPanel';
import EditorDashboard from './components/Editor/EditorDashboard';
import UserSettings from './components/UserSettings/UserSettings';
import News from './components/News/News';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<><Header /><Catalog /><Footer /></>} />
        <Route path="/Registro" element={<><Registro /><Footer /></>} />
        <Route path="/car/:brand/:id" element={<><CarDetails /><Footer /></>} />
        <Route path="/opinions" element={<><Opinions /><Footer /></>} />
        <Route path="/news" element={<><News /><Footer /></>} />
        <Route path="/user-settings" element={<><UserSettings /><Footer /></>} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/editor" element={<EditorDashboard />} />
      </Routes>
    </div>
  );
}

export default App;