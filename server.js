// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/summarize', async (req, res) => {
    const text = req.body.text;

    if (!text) {
        return res.status(400).json({ error: 'Texto não fornecido para sumarização.' });
    }

    const HUGGING_FACE_API_TOKEN = process.env.HUGGING_FACE_API_TOKEN; 
    
    const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-12-6";


    if (!HUGGING_FACE_API_TOKEN) {
        console.error('Erro: HUGGING_FACE_API_TOKEN não configurado no .env');
        return res.status(500).json({ error: 'Token da API não configurado no servidor.' });
    }

    try {
        const response = await fetch(HUGGING_FACE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${HUGGING_FACE_API_TOKEN}`
            },
            body: JSON.stringify({ inputs: text }),
            options: {
                wait_for_model: true 
            }
        });

        // TRATAMENTO DE ERRO: Simplificado para evitar SyntaxError
        if (!response.ok) {
            let errorDetails = '';
            try {
                const errorData = await response.json();
                errorDetails = errorData.error ? errorData.error : JSON.stringify(errorData);
            } catch (e) {
                // Se não for JSON, apenas pegue o texto da resposta
                errorDetails = await response.text();
            }
            console.error('Erro na API Hugging Face (backend):', response.status, errorDetails);
            return res.status(response.status).json({ error: `Erro na API Hugging Face. Status: ${response.status}. Detalhe: ${errorDetails}` });
        }

        const data = await response.json(); 

        if (data && data.length > 0 && data[0].summary_text) {
            let summary = data[0].summary_text.trim();
            res.json({ summary: summary });
        } else {
            res.status(500).json({ error: 'Resposta inesperada da API do Hugging Face. Formato de resumo não encontrado.' });
        }

    } catch (error) {
        console.error('Erro ao conectar com a API de IA do backend:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao processar o resumo (verifique conexão, URL da API ou token HF).' });
    }
}); 

app.listen(PORT, () => { 
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});