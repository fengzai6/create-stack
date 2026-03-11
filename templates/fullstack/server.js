const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, 'client')));

app.listen(port, () => {
  console.log(`Fullstack template running at http://localhost:${port}`);
});
