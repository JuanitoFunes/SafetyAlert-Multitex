require('dotenv').config(); // Importa dotenv
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware para permitir requisições de outros domínios (CORS)
app.use(cors());
app.use(express.json());

// Configuração do Nodemailer usando variáveis de ambiente
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Rota para enviar e-mail de alerta
app.post('/send-email', (req, res) => {
    const { description, location, date, time, type, actions } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER, // Remetente
        to: 'falecomjuanfelipe@gmail.com', // Destinatário
        subject: 'Nova Ocorrência Registrada - SafeAlert Multitex',
        text: `Uma nova ocorrência foi registrada:\n\n
               📌 Descrição: ${description}\n
               📍 Local: ${location}\n
               📅 Data: ${date}\n
               ⏰ Hora: ${time}\n
               🏷️ Tipo: ${type}\n
               ✅ Ações Tomadas: ${actions || 'Não informado'}\n`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erro ao enviar e-mail:', error);
            res.status(500).json({ message: 'Erro ao enviar e-mail', error });
        } else {
            console.log('E-mail enviado:', info.response);
            res.status(200).json({ message: 'E-mail enviado com sucesso' });
        }
    });
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
