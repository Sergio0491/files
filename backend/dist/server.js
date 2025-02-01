require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 4000;
const corsOptions = {
  origin: '*',
  methods: 'GET,POST,PUT,DELETE', 
  allowedHeaders: 'Content-Type,Authorization', 
  credentials: true
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});