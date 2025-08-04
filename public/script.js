// File: public/script.js

document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.querySelector('.main-container');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatBox = document.getElementById('chat-box');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const filePreviewContainer = document.getElementById('file-preview');

    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    const closeSidebarBtn = document = document.getElementById('close-sidebar-btn');
    let welcomeMessage = document.getElementById('welcome-message');

    const uploadMenu = document.getElementById('upload-menu');
    const cameraBtn = document.getElementById('camera-btn');
    const galleryBtn = document.getElementById('gallery-btn');
    const fileBtn = document = document.getElementById('file-btn');
    
    const newSessionBtn = document.getElementById('new-session-btn');
    const chatHistoryBtn = document.getElementById('chat-history-btn');
    const sessionsList = document.getElementById('sessions-list');
    const currentChatTitle = document.getElementById('current-chat-title');

    let selectedFile = null;
    let isFirstMessage = true;
    let currentSessionId = null;
    let isSubmitting = false;

    // Perbaikan: Kumpulan fungsi untuk animasi mengetik di welcome message
    let typingTimeout;
    let deletionTimeout;

    const startTypingAnimation = (message) => {
        let i = 0;
        let isTyping = true;
        
        // Hapus kursor yang mungkin ada
        const cursor = welcomeMessage.querySelector('.blinking-cursor');
        if (cursor) cursor.remove();

        // Tambahkan kursor baru
        const newCursor = document.createElement('span');
        newCursor.className = 'blinking-cursor';
        newCursor.textContent = '|';
        welcomeMessage.appendChild(newCursor);
        
        welcomeMessage.textContent = '';
        welcomeMessage.appendChild(newCursor);

        const animateLoop = () => {
            if (isTyping) {
                if (i < message.length) {
                    welcomeMessage.textContent = message.substring(0, i + 1);
                    welcomeMessage.appendChild(newCursor);
                    i++;
                    typingTimeout = setTimeout(animateLoop, 50);
                } else {
                    isTyping = false;
                    deletionTimeout = setTimeout(animateLoop, 7000);
                }
            } else { // Proses menghapus
                if (i >= 0) {
                    welcomeMessage.textContent = message.substring(0, i);
                    welcomeMessage.appendChild(newCursor);
                    i--;
                    deletionTimeout = setTimeout(animateLoop, 25);
                } else {
                    isTyping = true;
                    typingTimeout = setTimeout(animateLoop, 1000);
                }
            }
        };

        animateLoop();
    };

    // Hentikan animasi welcome message
    const stopTypingAnimation = () => {
        clearTimeout(typingTimeout);
        clearTimeout(deletionTimeout);
        const cursor = welcomeMessage.querySelector('.blinking-cursor');
        if (cursor) cursor.remove();
        welcomeMessage.textContent = '';
    };

    // Panggil animasi saat pertama kali halaman dimuat
    const initialMessage = `${getGreeting()}, aku Noa AI`;
    startTypingAnimation(initialMessage);

    // Sidebar functionality
    openSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        loadSessionsList();
    });

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    newSessionBtn.addEventListener('click', () => {
        startNewSession();
        sidebar.classList.remove('open');
    });

    chatHistoryBtn.addEventListener('click', () => {
        sessionsList.classList.toggle('show');
        chatHistoryBtn.classList.toggle('active');
    });

    function startNewSession() {
        currentSessionId = null;
        chatBox.innerHTML = `<div id="welcome-message" class="welcome-message"></div>`;
        isFirstMessage = true;
        welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) {
            const greetingMessage = `${getGreeting()}, aku Noa AI`;
            startTypingAnimation(greetingMessage);
        }
        currentChatTitle.textContent = 'Noa AI';
        chatInput.focus();
    }
    
    async function loadSessionsList() {
        try {
            const response = await fetch('/api/chat', { method: 'GET' });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to load sessions list: ${response.status} - ${errorData.message}`);
            }
            
            const { sessions } = await response.json();
            sessionsList.innerHTML = '';
            if (sessions && sessions.length > 0) {
                sessions.forEach(session => {
                    const li = document.createElement('li');
                    li.classList.add('session-list-item');

                    const titleButton = document.createElement('button');
                    titleButton.textContent = session.title;
                    titleButton.classList.add('session-title-button');
                    titleButton.dataset.sessionId = session.session_id;

                    titleButton.addEventListener('click', () => {
                        loadChatHistory(session.session_id, session.title);
                        sidebar.classList.remove('open');
                    });
                    
                    const sessionActions = document.createElement('div');
                    sessionActions.classList.add('session-actions');

                    const separator = document.createElement('div');
                    separator.classList.add('separator');
                    
                    sessionActions.appendChild(separator);
                    
                    li.appendChild(titleButton);
                    li.appendChild(sessionActions);
                    sessionsList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.innerHTML = '<button style="color:var(--primary-text-color);">Tidak ada riwayat</button>';
                sessionsList.appendChild(li);
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
            sessionsList.innerHTML = `<li><button style="color:var(--error-color);">Error: Gagal memuat sesi.</button></li>`;
        }
    }

    async function loadChatHistory(sessionId, title) {
        try {
            const response = await fetch(`/api/chat?sessionId=${sessionId}`, { method: 'GET' });
            if (!response.ok) throw new Error('Failed to load chat history.');
            
            const { history } = await response.json();
            
            chatBox.innerHTML = '';
            welcomeMessage.classList.add('hide');
            isFirstMessage = false;

            // Hentikan animasi saat memuat riwayat
            stopTypingAnimation();

            if (history && history.length > 0) {
                history.forEach(msg => {
                    appendMessage(msg.role, msg.text);
                });
            } else {
                appendMessage('ai', 'Riwayat chat ini masih kosong.');
            }

            currentSessionId = sessionId;
            
        } catch (error) {
            console.error('Error loading history:', error);
            chatBox.innerHTML = `<div id="welcome-message" class="welcome-message hide"></div>`;
            appendMessage('ai', 'Maaf, terjadi kesalahan saat memuat riwayat chat.');
            currentChatTitle.textContent = 'Noa AI';
            currentSessionId = null;
        }
    }

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 11) return "Selamat Pagi";
        if (hour < 15) return "Selamat Siang";
        if (hour < 18) return "Selamat Sore";
        return "Selamat Malam";
    }

    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = chatInput.scrollHeight + 'px';
    });

    uploadBtn.addEventListener('click', () => {
        uploadMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.upload-area') && uploadMenu.classList.contains('show')) {
            uploadMenu.classList.remove('show');
        }
    });

    cameraBtn.addEventListener('click', () => {
        fileInput.setAttribute('capture', 'camera');
        fileInput.click();
        uploadMenu.classList.remove('show');
    });
    
    galleryBtn.addEventListener('click', () => {
        fileInput.removeAttribute('capture');
        fileInput.setAttribute('accept', 'image/*');
        fileInput.click();
        uploadMenu.classList.remove('show');
    });

    fileBtn.addEventListener('click', () => {
        fileInput.removeAttribute('capture');
        fileInput.removeAttribute('accept');
        fileInput.click();
        uploadMenu.classList.remove('show');
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files.length > 0 ? e.target.files.item(0) : null;
        if (file) {
            selectedFile = file;
            displayFilePreview(file);
        }
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return;

        const userMessage = chatInput.value.trim();
        
        if (userMessage || selectedFile) {
            isSubmitting = true;

            if (isFirstMessage) {
                welcomeMessage.classList.add('hide');
                isFirstMessage = false;
                // Hentikan animasi saat pesan pertama dikirim
                stopTypingAnimation();
            }

            appendMessage('user', userMessage, selectedFile);
            chatInput.value = '';
            chatInput.style.height = 'auto';
            removeFile();
            showTypingIndicator();

            try {
                const formData = new FormData();
                formData.append('message', userMessage);
                if (selectedFile) {
                    formData.append('file', selectedFile);
                }
                if (currentSessionId) {
                    formData.append('sessionId', currentSessionId);
                }
                
                // Tambahkan ini untuk debugging di browser
                console.log('--- Debugging FormData ---');
                for (let pair of formData.entries()) {
                    console.log(pair[0], pair[1]);
                }
                console.log('--------------------------');


                const response = await fetch('/api/chat', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                hideTypingIndicator();
                appendMessage('ai', data.text);
                
                if (data.sessionId && !currentSessionId) {
                    currentSessionId = data.sessionId;
                }
                
                loadSessionsList();

            } catch (error) {
                console.error('Error:', error);
                hideTypingIndicator();
                appendMessage('ai', 'Maaf, terjadi kesalahan saat memproses permintaanmu. Coba lagi nanti ya.');
            } finally {
                isSubmitting = false;
            }
        }
    });

    function appendMessage(sender, message, file = null) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
        
        const content = document.createElement('div');
        content.classList.add('message-content');
        
        if (file) {
            const filePreview = document.createElement('div');
            filePreview.classList.add('message-file-preview');
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                filePreview.appendChild(img);
            } else {
                const fileName = document.createElement('p');
                fileName.textContent = file.name;
                filePreview.appendChild(fileName);
            }
            content.appendChild(filePreview);
        }
        
        const parts = message.split(/`{3}([\w+\-.]+)?\n([\s\S]*?)`{3}/g);
        parts.forEach((part, index) => {
            if (index % 4 === 1 && parts.length > index + 1) {
                const lang = part || 'text';
                const codeContent = parts[(index + 1)];
                const codeBlock = document.createElement('pre');
                const code = document.createElement('code');
                code.classList.add(`language-${lang}`);
                code.textContent = codeContent;
                
                const copyBtn = document.createElement('button');
                copyBtn.textContent = 'Copy';
                copyBtn.classList.add('copy-btn');
                copyBtn.addEventListener('click', () => {
                    navigator.clipboard.writeText(codeContent).then(() => {
                        copyBtn.textContent = 'Copied!';
                        setTimeout(() => {
                            copyBtn.textContent = 'Copy';
                        }, 2000);
                    });
                });
                
                codeBlock.appendChild(code);
                codeBlock.appendChild(copyBtn);
                content.appendChild(codeBlock);
            } else if (part.trim()) {
                const textContent = document.createElement('p');
                textContent.textContent = part;
                content.appendChild(textContent);
            }
        });

        messageElement.appendChild(content);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
        if (typeof Prism !== 'undefined') {
            const codeElements = content.querySelectorAll('pre code');
            codeElements.forEach(Prism.highlightElement);
        }
    }
    
    function showTypingIndicator() {
        if (!document.getElementById('typing-indicator')) {
            const typingIndicator = document.createElement('div');
            typingIndicator.id = 'typing-indicator';
            typingIndicator.classList.add('message', 'ai-message', 'typing-indicator');
            typingIndicator.innerHTML = `
                <div class="message-content">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            `;
            chatBox.appendChild(typingIndicator);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }

    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    function displayFilePreview(file) {
        filePreviewContainer.style.display = 'flex';
        filePreviewContainer.innerHTML = '';
        
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.classList.add('file-preview-image');
            filePreviewContainer.appendChild(img);
        } else {
            const fileInfo = document.createElement('div');
            fileInfo.classList.add('file-preview-info');
            fileInfo.textContent = `File: ${file.name}`;
            filePreviewContainer.appendChild(fileInfo);
        }

        const closeBtn = document.createElement('span');
        closeBtn.classList.add('file-preview-close');
        closeBtn.innerHTML = '&#x2716;';
        closeBtn.onclick = removeFile;
        filePreviewContainer.appendChild(closeBtn);
    }
    
    window.removeFile = function() {
        selectedFile = null;
        fileInput.value = '';
        filePreviewContainer.style.display = 'none';
        filePreviewContainer.innerHTML = '';
    }

    loadSessionsList();
});
