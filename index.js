const express = require('express');
const app = express();
const port = 3000;

// Rota de Hello World
app.get('/hello', (req, res) => {
    res.json({ message: 'Hello, World!' });
});

// Rota de Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'UP' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
