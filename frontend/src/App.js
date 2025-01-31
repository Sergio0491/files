import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Motocarros from './pages/Motocarros';

function App() {
  // Iniciamos el estado leyendo de localStorage
  const [authorized, setAuthorized] = useState(() => {
    return localStorage.getItem('authorized') === 'true';
  });
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Solo pedimos usuario/contraseña si NO está autorizado
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

    // Marcamos que ya hicimos la verificación.
    setChecked(true);
  }, [authorized]);

  if (!checked) {
    // Mientras no terminemos la comprobación, podemos mostrar un loader o null
    return null;
  }

  if (!authorized) {
    // Si, luego del prompt, no está autorizado, mostramos algo
    return <h2>Usuario o contraseña incorrectos.</h2>;
  }

  // Si está autorizado, renderizamos normalmente
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