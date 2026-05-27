let sendMessageModal, sendFileModal;

document.addEventListener('DOMContentLoaded', function() {
    sendMessageModal = new bootstrap.Modal(document.getElementById('sendMessageModal'));
    sendFileModal = new bootstrap.Modal(document.getElementById('sendFileModal'));
    
    const toggleTokenBtn = document.getElementById('toggleToken');
    if (toggleTokenBtn) {
        toggleTokenBtn.addEventListener('click', function() {
            const tokenInput = document.getElementById('apiToken');
            const type = tokenInput.getAttribute('type') === 'password' ? 'text' : 'password';
            tokenInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
    
    let typingTimer;
    const idInstanceInput = document.getElementById('idInstance');
    const apiTokenInput = document.getElementById('apiToken');
    
    if (idInstanceInput) {
        idInstanceInput.addEventListener('input', () => {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(checkConnectionStatus, 1000);
        });
    }
    
    if (apiTokenInput) {
        apiTokenInput.addEventListener('input', () => {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(checkConnectionStatus, 1000);
        });
    }
});

async function callApi(method, body = null, isPost = false) {
    const idInstance = document.getElementById('idInstance').value.trim();
    const apiToken = document.getElementById('apiToken').value.trim();
    
    if (!idInstance || !apiToken) {
        showError('Пожалуйста, заполните idInstance и ApiTokenInstance');
        return null;
    }
    
    const url = `https://api.green-api.com/waInstance${idInstance}/${method}/${apiToken}`;
    
    try {
        const options = {
            method: isPost ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (isPost && body) {
            options.body = JSON.stringify(body);
        }
        
        showOutput(`🔄 Выполняется запрос: ${method}\nURL: ${url}\n\n`);
        
        const response = await fetch(url, options);
        const data = await response.json();
        
        showOutput(`✅ Ответ метода ${method}:\n\n${JSON.stringify(data, null, 2)}`);
        return data;
    } catch (error) {
        showError(`Ошибка при вызове ${method}: ${error.message}`);
        return null;
    }
}

function showOutput(text) {
    const outputDiv = document.getElementById('output');
    if (outputDiv) {
        outputDiv.textContent = text;
    }
}

function showError(errorText) {
    const outputDiv = document.getElementById('output');
    if (outputDiv) {
        outputDiv.textContent = `❌ Ошибка: ${errorText}`;
    }
}

async function checkConnectionStatus() {
    const idInstance = document.getElementById('idInstance').value.trim();
    const apiToken = document.getElementById('apiToken').value.trim();
    const statusDiv = document.getElementById('connectionStatus');
    
    if (!statusDiv) return;
    
    if (!idInstance || !apiToken) {
        statusDiv.className = 'status-badge status-checking';
        statusDiv.innerHTML = '<i class="fas fa-info-circle me-2"></i>Ожидание ввода данных';
        return;
    }
    
    statusDiv.className = 'status-badge status-checking';
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Проверка подключения...';
    
    try {
        const result = await callApi('getStateInstance');
        if (result && result.stateInstance) {
            if (result.stateInstance === 'authorized') {
                statusDiv.className = 'status-badge status-online';
                statusDiv.innerHTML = '<i class="fas fa-check-circle me-2"></i>✅ Инстанс авторизован и готов к работе';
            } else if (result.stateInstance === 'notAuthorized') {
                statusDiv.className = 'status-badge status-offline';
                statusDiv.innerHTML = '<i class="fas fa-times-circle me-2"></i>❌ Инстанс не авторизован. Отсканируйте QR-код в личном кабинете GREEN-API';
            } else {
                statusDiv.className = 'status-badge status-offline';
                statusDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>Статус: ${result.stateInstance}`;
            }
        } else if (result && result.message) {
            statusDiv.className = 'status-badge status-offline';
            statusDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>Ошибка: ${result.message}`;
        }
    } catch (error) {
        statusDiv.className = 'status-badge status-offline';
        statusDiv.innerHTML = '<i class="fas fa-plug me-2"></i>⚠️ Не удалось подключиться к API';
    }
}

window.callGetSettings = async function() {
    await callApi('getSettings');
}

window.callGetStateInstance = async function() {
    await callApi('getStateInstance');
}

window.callSendMessage = async function() {
    const chatId = document.getElementById('chatId').value.trim();
    const message = document.getElementById('messageText').value.trim();
    
    if (!chatId) {
        showError('Пожалуйста, укажите номер телефона (chatId)');
        return;
    }
    
    if (!message) {
        showError('Пожалуйста, введите текст сообщения');
        return;
    }
    
    let formattedChatId = chatId;
    if (!chatId.includes('@c.us') && !chatId.includes('@g.us')) {
        formattedChatId = chatId + '@c.us';
    }
    
    const body = {
        chatId: formattedChatId,
        message: message
    };
    
    await callApi('sendMessage', body, true);
    if (sendMessageModal) {
        sendMessageModal.hide();
    }
    
    const chatIdInput = document.getElementById('chatId');
    const messageTextarea = document.getElementById('messageText');
    if (chatIdInput) chatIdInput.value = '';
    if (messageTextarea) messageTextarea.value = 'Тестовое сообщение от GREEN-API';
}

window.callSendFileByUrl = async function() {
    const chatId = document.getElementById('fileChatId').value.trim();
    const urlFile = document.getElementById('fileUrl').value.trim();
    const fileName = document.getElementById('fileName').value.trim();
    
    if (!chatId) {
        showError('Пожалуйста, укажите номер телефона (chatId)');
        return;
    }
    
    if (!urlFile) {
        showError('Пожалуйста, укажите URL файла');
        return;
    }
    
    let formattedChatId = chatId;
    if (!chatId.includes('@c.us') && !chatId.includes('@g.us')) {
        formattedChatId = chatId + '@c.us';
    }
    
    const body = {
        chatId: formattedChatId,
        urlFile: urlFile,
        fileName: fileName || undefined
    };
    
    await callApi('sendFileByUrl', body, true);
    if (sendFileModal) {
        sendFileModal.hide();
    }
}

window.showSendMessageModal = function() {
    const idInstance = document.getElementById('idInstance').value.trim();
    const apiToken = document.getElementById('apiToken').value.trim();
    
    if (!idInstance || !apiToken) {
        showError('Сначала заполните параметры подключения (idInstance и ApiTokenInstance)');
        return;
    }
    
    if (sendMessageModal) {
        sendMessageModal.show();
    }
}

window.showSendFileModal = function() {
    const idInstance = document.getElementById('idInstance').value.trim();
    const apiToken = document.getElementById('apiToken').value.trim();
    
    if (!idInstance || !apiToken) {
        showError('Сначала заполните параметры подключения (idInstance и ApiTokenInstance)');
        return;
    }
    
    if (sendFileModal) {
        sendFileModal.show();
    }
}
