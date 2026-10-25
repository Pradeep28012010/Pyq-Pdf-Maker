const app = require('./api/index.js');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Marks Offline server running on http://localhost:${PORT}`);
});
