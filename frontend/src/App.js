import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Motocarros from './pages/Motocarros';

function App() {
  const [authorized, setAuthorized] = useState(() => {
    return localStorage.getItem('authorized') === 'true';
  });
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!authorized) {
      const username = prompt('Ingresa tu usuario:');
      const password = prompt('Ingresa tu contraseña:');

      if (username === 'bello' && password === 'pdf_register98@') {
        setAuthorized(true);
        localStorage.setItem('authorized', 'true');
      } else {
        alert('Usuario o contraseña incorrectos.');
      }
    }

    setChecked(true);
  }, [authorized]);

  if (!checked) {
    return null;
  }

  if (!authorized) {
    return <h2>Usuario o contraseña incorrectos.</h2>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/motocarros" element={<Motocarros />} />
      </Routes>
    </Router>
  );
}

export default App;