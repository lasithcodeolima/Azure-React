require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const cors = require('cors');
const userRoutes = require('./routes/user');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
