'use strict';

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Serve public/ with light caching
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: '1h',
    etag: true,
  })
);

// Fallback — always send index.html (single-page site)
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  ▸ LSI site running →  http://localhost:${PORT}\n`);
});
