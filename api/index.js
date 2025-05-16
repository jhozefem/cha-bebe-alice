const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = require('../credentials.json');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
let sheet;

(async () => {
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  sheet = doc.sheetsByIndex[0];
})();

app.get('/api/check/:phone', async (req, res) => {
  const phone = req.params.phone;
  await sheet.loadCells();
  const rows = await sheet.getRows();
  const row = rows.find(r => r.Telefone === phone);

  if (!row) return res.json({ status: 'not_found' });
  if (row.Resposta) return res.json({ status: 'already_answered' });
  return res.json({ status: 'ok' });
});

app.post('/api/respond', async (req, res) => {
  const { phone, answer } = req.body;
  const rows = await sheet.getRows();
  const row = rows.find(r => r.Telefone === phone);
  if (!row) return res.json({ message: 'Erro: telefone não encontrado.' });
  row.Resposta = answer;
  await row.save();
  return res.json({ message: 'Resposta registrada com sucesso!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));