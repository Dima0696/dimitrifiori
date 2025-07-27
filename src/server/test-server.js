const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  console.log('Health check richiesto');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  console.log('Test endpoint richiesto');
  res.json({ message: 'Test endpoint funziona' });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server avviato sulla porta ${PORT}`);
  console.log(`✅ Test server pronto per ricevere richieste`);
}); 