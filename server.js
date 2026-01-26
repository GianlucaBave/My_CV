const app = require('./api/index.js');
const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Serve static files locally (this is handled by Vercel's static system in prod)
// We add this middleware here so 'node server.js' still works for the frontend.
app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
