require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.API_PORT;

// Rota de Hello World
app.get('/hello', (req, res) => {
    res.json({ message: 'Hello, Hockpond' });
});

// Rota de Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'UP' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
