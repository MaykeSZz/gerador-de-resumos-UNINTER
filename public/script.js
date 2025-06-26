// script.js (NA PASTA PUBLIC/)

// URL do backend para gerar resumos
const API_URL = '/summarize';

// Referências aos elementos do DOM
const textInput = document.getElementById('textInput');
const summarizeBtn = document.getElementById('summarizeBtn');
const summaryOutput = document.getElementById('summaryOutput');
const copySummaryBtn = document.getElementById('copySummaryBtn');
const downloadTxtBtn = document.getElementById('downloadTxtBtn'); // Botão para baixar resumo em TXT
const historyList = document.getElementById('historyList'); // Área para exibir o histórico
const clearHistoryBtn = document.getElementById('clearHistoryBtn'); // Botão para limpar histórico

// Chave para armazenar o histórico no localStorage
const HISTORY_KEY = 'summaryHistory';

/**
 * Carrega e exibe o histórico de resumos do localStorage.
 */
function loadHistory() {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    historyList.innerHTML = ''; // Limpa a lista atual

    if (history.length === 0) {
        historyList.innerHTML = '<p>Nenhum resumo no histórico ainda.</p>';
        clearHistoryBtn.style.display = 'none'; // Oculta o botão de limpar se o histórico estiver vazio
        return;
    }

    // Exibe o botão de limpar se houver histórico
    clearHistoryBtn.style.display = 'block';

    history.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        historyItem.innerHTML = `
            <h3>Resumo ${history.length - index}</h3>
            <p>${item.summary}</p>
            <small>Original (trecho): ${item.originalText.substring(0, 100)}...</small>
            <small>Gerado em: ${new Date(item.timestamp).toLocaleString()}</small>
        `;
        historyList.appendChild(historyItem);
    });
}

/**
 * Salva um novo resumo no histórico do localStorage.
 * @param {string} originalText - O texto original que foi resumido.
 * @param {string} summary - O resumo gerado.
 */
function saveToHistory(originalText, summary) {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const newItem = {
        originalText: originalText,
        summary: summary,
        timestamp: new Date().toISOString() // Salva o timestamp para ordenação ou exibição
    };
    history.unshift(newItem); // Adiciona o novo item no início do array
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    loadHistory(); // Recarrega o histórico na interface
}

// Carrega o histórico ao carregar a página
document.addEventListener('DOMContentLoaded', loadHistory);

// Adiciona um listener de evento ao botão "Gerar Resumo"
summarizeBtn.addEventListener('click', async () => {
    const text = textInput.value.trim(); // Obtém o texto do input, removendo espaços

    // Validação de input vazio
    if (text.length === 0) {
        summaryOutput.innerHTML = '<p style="color: red;">Por favor, cole algum texto para resumir.</p>';
        copySummaryBtn.style.display = 'none';
        downloadTxtBtn.style.display = 'none';
        return;
    }

    // Exibe mensagem de carregamento e oculta botões de saída
    summaryOutput.innerHTML = '<p>Gerando resumo... Por favor, aguarde.</p>';
    copySummaryBtn.style.display = 'none';
    downloadTxtBtn.style.display = 'none';

    try {
        // Faz a requisição POST para o backend
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text }) // Envia o texto para o backend
        });

        // Trata a resposta do backend
        if (!response.ok) {
            const errorData = await response.json();
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

        const data = await response.json();

        // Exibe o resumo e salva no histórico se a resposta for bem-sucedida
        if (data && data.summary) {
            const summary = data.summary;
            summaryOutput.innerHTML = `<p>${summary}</p>`;
            copySummaryBtn.style.display = 'block';
            downloadTxtBtn.style.display = 'block';
            saveToHistory(text, summary); // Salva o resumo no histórico
        } else {
            summaryOutput.innerHTML = '<p style="color: red;">Não foi possível gerar um resumo. Resposta inesperada do servidor.</p>';
        }

    } catch (error) {
        console.error('Erro ao conectar com o Backend:', error);
        summaryOutput.innerHTML = '<p style="color: red;">Erro de conexão com o servidor. Verifique se o backend está rodando.</p>';
    }
});

// Adiciona listener para o botão "Copiar Resumo"
copySummaryBtn.addEventListener('click', () => {
    const summaryText = summaryOutput.querySelector('p').innerText;
    
    navigator.clipboard.writeText(summaryText)
        .then(() => {
            alert('Resumo copiado para a área de transferência!');
        })
        .catch(err => {
            console.error('Erro ao copiar o texto: ', err);
            alert('Erro ao copiar o resumo. Por favor, copie manualmente.');
        });
});

// Adiciona listener para o botão "Baixar Resumo (.txt)"
downloadTxtBtn.addEventListener('click', () => {
    const summaryText = summaryOutput.querySelector('p').innerText;
    
    // Cria um Blob com o conteúdo do resumo para download
    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    
    // Cria um URL temporário e um link para iniciar o download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resumo_inteligente.txt'; // Nome do arquivo a ser baixado
    document.body.appendChild(a);
    a.click();
    
    // Limpa o URL temporário após o download
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Adiciona listener para o botão "Limpar Histórico"
clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico de resumos?')) {
        localStorage.removeItem(HISTORY_KEY); // Remove o histórico do localStorage
        loadHistory(); // Recarrega o histórico (que agora estará vazio)
    }
});