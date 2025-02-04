require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.API_PORT;

// Rota de Hello World
app.get('/hello', (req, res) => {
    console.log("GET /hello")
    res.json({ message: 'Hello, World!' });
});

// Rota de Health Check
app.get('/health', (req, res) => {
    console.log("GET /health")
    res.json({ status: 'UP' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
