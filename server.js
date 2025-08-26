require('dotenv').config();
const express    = require('express');
const bodyParser = require('body-parser');
const SibApiV3   = require('sib-api-v3-sdk');

const app = express();
const port = process.env.PORT || 5000;

// configura parser para form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// configura client do Brevo
const defaultClient = SibApiV3.ApiClient.instance;
defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
const contactsApi = new SibApiV3.ContactsApi();

// rota para receber o webhook
app.post('/webhook', async (req, res) => {
  try {
    const { Nome, 'E-mail': Email, Mensagem } = req.body;

    if (!Nome || !Email) {
      return res.status(400).send('Faltam campos obrigatórios');
    }

    // monta payload para Brevo
    const createContact = new SibApiV3.CreateContact();
    createContact.email = Email;
    createContact.attributes = {
      FIRSTNAME: Nome,
      MENSAGEM: Mensagem || ''
    };
    createContact.listIds = [ parseInt(process.env.BREVO_LIST_ID) ];
    createContact.updateEnabled = true; // se já existir, atualiza

    // chama a API
    await contactsApi.createContact(createContact);

    return res.status(200).send('Contato enviado para Brevo');
  }
  catch (err) {
    console.error('Erro no webhook:', err);
    // Brevo retorna 400 se e-mail inválido ou 409 se já existir sem updateEnabled
    return res.status(500).send('Erro interno');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
