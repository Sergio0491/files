import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

function HomePage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const token = localStorage.getItem('token');

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/recyclers/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Error al obtener usuarios');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError(error.message);
    }
  };

  const downloadPDF = (id) => {
    fetch(`${API_BASE_URL}/users/recyclers/${id}/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al descargar PDF');
        }
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'usuario.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  // Verificar si hubo error
  if (error) {
    return <div style={{ margin: '20px' }}>Error: {error}</div>;
  }

  // Filtrar usuarios según el término de búsqueda
  const filteredUsers = users.filter((user) => {
    // Desestructuramos los campos de user para que no sean undefined.
    // Así, si algo no existe, al menos será un string vacío.
    const { name = '', last_name = '', id_number = '' } = user;

    // Convertimos todo a string para evitar errores si id_number no es un string
    // y a minúsculas para coincidencias que no dependan de mayúsculas/minúsculas.
    const lowerSearchTerm = searchTerm.toLowerCase();

    return (
      name.toLowerCase().includes(lowerSearchTerm) ||
      last_name.toLowerCase().includes(lowerSearchTerm) ||
      String(id_number).toLowerCase().includes(lowerSearchTerm)
    );
  });

  const containerStyle = {
    margin: '20px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 0 8px rgba(0, 0, 0, 0.1)',
    maxWidth: '900px',
  };

  const tableStyle = {
    borderCollapse: 'collapse',
    width: '100%',
    marginBottom: '20px',
  };

  const cellStyle = {
    border: '1px solid #ddd',
    padding: '8px',
  };

  const headerCellStyle = {
    ...cellStyle,
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
    textAlign: 'left',
  };

  const searchInputStyle = {
    marginBottom: '10px',
    padding: '8px',
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '4px',
    border: '1px solid #ccc',
  };

  const buttonStyle = {
    marginTop: '5px',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ marginTop: 0 }}>Tabla de Usuarios</h2>

      <input
        type="text"
        placeholder="Buscar por nombre, apellido o documento..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={searchInputStyle}
      />

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={headerCellStyle}>Nombre</th>
            <th style={headerCellStyle}>Apellido</th>
            <th style={headerCellStyle}>Documento</th>
            <th style={headerCellStyle}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((u, index) => {
            const rowStyle = {
              backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff',
            };

            return (
              <tr key={u.id} style={rowStyle}>
                <td style={cellStyle}>{u.name}</td>
                <td style={cellStyle}>{u.last_name}</td>
                <td style={cellStyle}>{u.id_number}</td>
                <td style={cellStyle}>
                  <button onClick={() => downloadPDF(u.id)} style={buttonStyle}>
                    Descargar PDF
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default HomePage;