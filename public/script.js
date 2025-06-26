// script.js (NA PASTA PUBLIC/)

// A chave da API da OpenAI ou Hugging Face NÃO está mais aqui, ela está segura no backend!

// URL para o seu próprio backend (onde ele está rodando, porta 3000 por padrão)
const API_URL = '/summarize'; // Aponta para a rota '/summarize' que criamos no server.js

// Elementos do DOM (mantêm-se os mesmos do seu HTML)
const textInput = document.getElementById('textInput');
const summarizeBtn = document.getElementById('summarizeBtn');
const summaryOutput = document.getElementById('summaryOutput');
const copySummaryBtn = document.getElementById('copySummaryBtn');

// Adiciona um listener de evento ao botão "Gerar Resumo"
summarizeBtn.addEventListener('click', async () => {
    const text = textInput.value.trim(); // Pega o texto e remove espaços em branco extras

    if (text.length === 0) {
        summaryOutput.innerHTML = '<p style="color: red;">Por favor, cole algum texto para resumir.</p>';
        copySummaryBtn.style.display = 'none'; // Esconde o botão de copiar
        return;
    }

    summaryOutput.innerHTML = '<p>Gerando resumo... Por favor, aguarde.</p>';
    copySummaryBtn.style.display = 'none'; // Esconde o botão de copiar enquanto gera

    try {
        // Faz a requisição para o SEU BACKEND
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text }) // Envia o texto para o seu backend
        });

        // O backend vai nos dizer se a requisição foi bem-sucedida ou não
        if (!response.ok) {
            const errorData = await response.json(); // Pega a mensagem de erro do backend
            console.error('Erro do Backend:', errorData);
            let errorMessage = `Ocorreu um erro ao gerar o resumo. Status: ${response.status}.`;
            if (errorData && errorData.error) {
                errorMessage += ` Detalhe: ${errorData.error}`;
            } else if (response.statusText) {
                errorMessage += ` Resposta: ${response.statusText}`;
            }
            summaryOutput.innerHTML = `<p style="color: red;">${errorMessage}</p>`;
            return;
        }

        const data = await response.json(); // Converte a resposta do backend para JSON

        // O backend deve retornar um objeto JSON com a propriedade 'summary'
        if (data && data.summary) {
            const summary = data.summary;
            summaryOutput.innerHTML = `<p>${summary}</p>`;
            copySummaryBtn.style.display = 'block'; // Mostra o botão de copiar
        } else {
            summaryOutput.innerHTML = '<p style="color: red;">Não foi possível gerar um resumo. Resposta inesperada do servidor.</p>';
        }

    } catch (error) {
        console.error('Erro ao conectar com o Backend:', error);
        summaryOutput.innerHTML = '<p style="color: red;">Erro de conexão com o servidor. Verifique se o backend está rodando.</p>';
    }
});

// Adiciona um listener de evento ao botão "Copiar Resumo" (essa parte não muda)
copySummaryBtn.addEventListener('click', () => {
    const summaryText = summaryOutput.querySelector('p').innerText; // Pega o texto do parágrafo dentro do summaryOutput

    navigator.clipboard.writeText(summaryText)
        .then(() => {
            alert('Resumo copiado para a área de transferência!');
        })
        .catch(err => {
            console.error('Erro ao copiar o texto: ', err);
            alert('Erro ao copiar o resumo. Por favor, copie manualmente.');
        });
});