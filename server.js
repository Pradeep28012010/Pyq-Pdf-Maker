const express = require('express');
const path = require('path');
const fs = require('fs');
const app = require('./api/index.js');

const PORT = process.env.PORT || 5000;

// Serve static assets from built Vite client if available
const clientDist = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Marks Offline server running on http://localhost:${PORT}`);
});
