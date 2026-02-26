async function initChat() {
            if (typeof puter === "undefined") {
                document.body.innerHTML = '<h1 style="color:white;text-align:center;padding:40px;">Puter.js failed to load. Check your internet or try https://js.puter.com/v2/</h1>';
                return;
            }

            // ────────────────────────────────────────────────
            // Storage detection
            // ────────────────────────────────────────────────
            function canUseStorage() {
                try {
                    const test = '__storage_test__';
                    localStorage.setItem(test, test);
                    localStorage.removeItem(test);
                    return true;
                } catch (e) {
                    return false;
                }
            }
            const storageAvailable = canUseStorage();

            // ────────────────────────────────────────────────
            // State
            // ────────────────────────────────────────────────
            let currentModel = storageAvailable 
                ? (localStorage.getItem('currentModel') || "gpt-4o-mini") 
                : "gpt-4o-mini";

            let chats = storageAvailable 
                ? (JSON.parse(localStorage.getItem('chats')) || []) 
                : [];

            let currentChatId = storageAvailable 
                ? localStorage.getItem('currentChatId') || null 
                : null;

            // ────────────────────────────────────────────────
            // DOM elements
            // ────────────────────────────────────────────────
            const msgs = document.getElementById("ai-chat-messages");
            const input = document.getElementById("input-field");
            const btn = document.getElementById("send-btn");
            const thinking = document.getElementById("ai-thinking");
            const chatList = document.getElementById("chat-list");
            const reasoningCheckbox = document.getElementById("reasoning-mode");
            const websearchCheckbox = document.getElementById("websearch-mode");
            const modelOverlay = document.getElementById("model-modal-overlay");
            const modelSelect = document.getElementById("model-select");
            const modelInput = document.getElementById("model-input");
            const okBtn = document.getElementById("ok-btn");
            const cancelBtn = document.getElementById("cancel-btn");

            // ────────────────────────────────────────────────
            // Helpers
            // ────────────────────────────────────────────────
            function saveState() {
                if (!storageAvailable) return;
                localStorage.setItem('chats', JSON.stringify(chats));
                localStorage.setItem('currentChatId', currentChatId);
                localStorage.setItem('currentModel', currentModel);
            }

            function addMessage(text, cls = "bot") {
                const d = document.createElement("div");
                d.className = `ai-msg ${cls}`;
                d.innerHTML = text.replace(/\n/g, "<br>");
                msgs.appendChild(d);
                setTimeout(() => d.classList.add("visible"), 10);
                msgs.scrollTop = msgs.scrollHeight;
                return d;
            }

            function getCurrentChat() {
                return chats.find(c => c.id === currentChatId) || { messages: [] };
            }

            function updateChatList() {
                chatList.innerHTML = '';
                chats.forEach(chat => {
                    const li = document.createElement('li');
                    li.textContent = chat.title || 'New Chat';
                    li.dataset.id = chat.id;
                    if (chat.id === currentChatId) li.classList.add('active');
                    li.onclick = () => switchChat(chat.id);
                    chatList.appendChild(li);
                });
            }

            function switchChat(id) {
                currentChatId = id;
                saveState();
                loadMessages();
                updateChatList();
            }

            function loadMessages() {
                msgs.innerHTML = '';
                getCurrentChat().messages.forEach(msg => {
                    addMessage(`<b>${msg.role === 'user' ? 'You' : 'AI'}:</b> ${msg.content}`, msg.role === 'user' ? 'user' : 'bot');
                });
            }

            function newChat() {
                const id = Date.now().toString();
                chats.push({ id, title: '', messages: [] });
                switchChat(id);
            }

            async function ensureSignedIn() {
                if (puter.auth.isSignedIn()) return true;
                try {
                    addMessage("<i>Opening sign-in window… Please log in to Puter.com</i>", "bot");
                    await puter.auth.signIn();
                    addMessage("<i>Successfully signed in! You can now use AI features.</i>", "bot");
                    return true;
                } catch (err) {
                    addMessage(`<i>Sign-in failed: ${err.message || 'Popup blocked or cancelled'}</i>`, "bot");
                    console.error(err);
                    return false;
                }
            }

            async function generateTitle(query) {
                try {
                    const resp = await puter.ai.chat(`Summarize this user query in 4-6 words: ${query}`, { model: currentModel });
                    return resp.trim();
                } catch {
                    return "New Chat";
                }
            }

            async function performWebSearch(query) {
                try {
                    const resp = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1`);
                    const data = await resp.json();
                    let result = data.Abstract || '';
                    if (!result && data.RelatedTopics?.length) {
                        result = data.RelatedTopics.map(t => t.Text).join('\n');
                    }
                    return result || 'No useful web results found.';
                } catch (e) {
                    return `Web search error: ${e.message}`;
                }
            }

            async function send() {
                const t = input.value.trim();
                if (!t) return;

                input.value = "";
                btn.disabled = true;

                if (!(await ensureSignedIn())) {
                    btn.disabled = false;
                    return;
                }

                let currentChat = getCurrentChat();
                currentChat.messages.push({ role: 'user', content: t });
                addMessage(`<b>You:</b> ${t}`, 'user');

                if (!currentChat.title) {
                    currentChat.title = await generateTitle(t);
                    updateChatList();
                }

                thinking.style.display = "block";

                let systemPrompt = reasoningCheckbox.checked 
                    ? "Think step by step. Explain your reasoning clearly before giving the final answer.\n" 
                    : "";

                let searchResult = "";
                if (websearchCheckbox.checked) {
                    searchResult = await performWebSearch(t);
                    systemPrompt += `Relevant web information:\n${searchResult}\n\n`;
                }

                const history = currentChat.messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
                const fullPrompt = systemPrompt + history + '\n\nassistant:';

                try {
                    const options = { model: currentModel, stream: true };
                    const stream = await puter.ai.chat(fullPrompt, options);

                    let botMsg = { role: 'assistant', content: '' };
                    currentChat.messages.push(botMsg);
                    let botDiv = addMessage(`<b>AI:</b> `, 'bot');

                    for await (const chunk of stream) {
                        if (chunk.text) {
                            botMsg.content += chunk.text;
                            botDiv.innerHTML = `<b>AI:</b> ${botMsg.content.replace(/\n/g, "<br>")}`;
                            msgs.scrollTop = msgs.scrollHeight;
                        }
                    }
                } catch (e) {
                    addMessage(`<b>Error:</b> ${e.message || 'Failed to get response'}`, 'bot');
                }

                thinking.style.display = "none";
                btn.disabled = false;
                saveState();
            }

            function clearChat() {
                let currentChat = getCurrentChat();
                currentChat.messages = [];
                loadMessages();
                saveState();
            }

            async function showModelModal() {
                modelInput.value = currentModel;
                modelSelect.value = currentModel in ["gpt-4o-mini","gpt-4o","gemini-1.5-flash","gemini-1.5-pro"] 
                    ? currentModel : "";
                modelOverlay.style.display = 'flex';
                modelInput.focus();
            }

            // ────────────────────────────────────────────────
            // Event listeners
            // ────────────────────────────────────────────────
            document.getElementById("new-chat").onclick = newChat;
            document.getElementById("clear-btn").onclick = clearChat;
            document.getElementById("ai-chat-title").onclick = showModelModal;

            modelSelect.onchange = () => {
                if (modelSelect.value) modelInput.value = modelSelect.value;
            };

            okBtn.onclick = () => {
                const val = modelInput.value.trim() || "gpt-4o-mini";
                currentModel = val;
                modelOverlay.style.display = 'none';
                saveState();
                addMessage(`<i>Model changed to <b>${currentModel}</b></i>`, "bot");
            };

            cancelBtn.onclick = () => modelOverlay.style.display = 'none';
            modelOverlay.onclick = e => { if (e.target === modelOverlay) modelOverlay.style.display = 'none'; };

            btn.onclick = send;
            input.onkeydown = e => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                }
            };

            // ────────────────────────────────────────────────
            // Startup
            // ────────────────────────────────────────────────
            if (!storageAvailable) {
                addMessage(`<i><b>Warning:</b> Browser storage is blocked (likely sandbox/iframe). Chats and model choice reset on refresh.</i>`, "bot");
            }

            if (chats.length === 0) newChat();
            else if (!currentChatId || !chats.find(c => c.id === currentChatId)) newChat();
            else loadMessages();

            updateChatList();

            addMessage(
                `<i>Using model: <b>${currentModel}</b><br>` +
                `Click title to change model • Enable features below as needed.<br>` +
                `${storageAvailable ? '' : 'Persistence disabled in this environment.'}</i>`, 
                "bot"
            );
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initChat);
        } else {
            initChat();
        }