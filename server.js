// server.js
require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env
const express = require('express');
const path = require('path');
const fetch = require('node-fetch'); // Módulo para fazer requisições HTTP (fetch API)

const app = express(); // Inicializa a aplicação Express
const PORT = process.env.PORT || 3000; // Define a porta do servidor

// Configura o Express para servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Configura o Express para parsear corpos de requisição JSON
app.use(express.json());

// Rota POST para a sumarização de texto
app.post('/summarize', async (req, res) => {
    const text = req.body.text; // Extrai o texto a ser resumido do corpo da requisição

    // Validação: verifica se o texto foi fornecido e se possui um comprimento mínimo
    if (!text || text.length < 50) {
        return res.status(400).json({ error: 'Por favor, cole um texto mais longo (mínimo de 50 caracteres) para resumir.' });
    }

    // Obtém o token da API do Hugging Face das variáveis de ambiente
    const HUGGING_FACE_API_TOKEN = process.env.HUGGING_FACE_API_TOKEN; 
    // Define a URL da API do modelo de sumarização do Hugging Face
    const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-12-6";

    // Validação: verifica se o token da API está configurado
    if (!HUGGING_FACE_API_TOKEN) {
        console.error('Erro: HUGGING_FACE_API_TOKEN não configurado no .env');
        return res.status(500).json({ error: 'Token da API do Hugging Face não configurado no servidor.' });
    }

    try {
        // Faz a requisição para a API de inferência do Hugging Face
        const response = await fetch(HUGGING_FACE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${HUGGING_FACE_API_TOKEN}` // Token de autenticação
            },
            body: JSON.stringify({ inputs: text }), // Envia o texto como input JSON
            options: {
                wait_for_model: true // Opção para esperar o modelo carregar, se necessário
            }
        });

        // Tratamento de erro para respostas não-OK da API (ex: 4xx, 5xx)
        if (!response.ok) {
            let errorDetails = '';
            try {
                // Tenta ler o corpo da resposta como JSON
                const errorData = await response.json();
                errorDetails = errorData.error ? errorData.error : JSON.stringify(errorData);
            } catch (e) {
                // Se não for JSON válido, lê o corpo da resposta como texto
                errorDetails = await response.text();
            }
            console.error('Erro na API Hugging Face (backend):', response.status, errorDetails);
            return res.status(response.status).json({ error: `Erro na API Hugging Face. Status: ${response.status}. Detalhe: ${errorDetails}` });
        }

        const data = await response.json(); // Converte a resposta bem-sucedida para JSON

        // Verifica se o resumo foi retornado no formato esperado pelo modelo
        if (data && data.length > 0 && data[0].summary_text) {
            const summary = data[0].summary_text.trim(); // Extrai e limpa o resumo
            res.json({ summary: summary }); // Envia o resumo de volta para o frontend
        } else {
            // Caso o formato da resposta da API seja inesperado
            res.status(500).json({ error: 'Resposta inesperada da API do Hugging Face. Formato de resumo não encontrado.' });
        }

    } catch (error) {
        // Captura erros de rede ou outros erros durante a comunicação com a API
        console.error('Erro ao conectar com a API de IA do backend:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao processar o resumo (verifique conexão, URL da API ou token HF).' });
    }
}); 

// Inicia o servidor Express
app.listen(PORT, () => { 
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});