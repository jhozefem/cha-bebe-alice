const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

let sheet;
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID, serviceAccountAuth);

app.get('/api/check/:phone', async (req, res) => {
  await doc.loadInfo();
  sheet = doc.sheetsByIndex[0];

  const phone = req.params.phone;
  await sheet.loadCells();
  const rows = await sheet.getRows();
  const row = rows.find(r => r._rawData[2] === phone);

  if (!row) return res.json({ status: 'not_found' });
  if (row._rawData[4]) return res.json({ status: 'already_answered' });
  return res.json({ status: 'ok' });
});

app.post('/api/respond', async (req, res) => {
  await doc.loadInfo();
  sheet = doc.sheetsByIndex[0];

  const { phone, answer, qty } = req.body;
  const rows = await sheet.getRows();
  const row = rows.find(r => r._rawData[2] === phone);
  let message = '';

  if (!row) return res.json({ message: 'Parece que seu número não consta na lista de convidados 🤔🤔' });
  row._rawData[4] = answer;

  if (answer === 'Sim') {
    row._rawData[5] = qty.adults;
    row._rawData[6] = qty.children;
    message = 'Obrigado pela confirmação, mal podemos esperar para celebrar a chegada da Alice com você 🎉👶';
  } else if (answer === 'Não') {
    message = 'Sem problemas, esperamos nos encontrar em outra ocasião. Se ainda assim quiser presentear a Alice, as instruções estão abaixo.';
  }

  console.log(row);

  await row.save();
  return res.json({ message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));