// Updated script.js

// Complete AI-generated chat names. Here are some examples:
const chatNames = [
    'Galactic Chat',
    'Mystery Room',
    'The Think Tank',
    'Innovation Hub',
    'Tech Talk',
    'Creative Corner',
    'Future Discussions',
    'Data Dive',
    'AI Insights',
    'Intellect Exchange'
];

// Function to create context menu for renaming and closing chats
const createContextMenu = (chatId) => {
    const menu = document.createElement('div');
    menu.className = 'context-menu';

    const renameOption = document.createElement('div');
    renameOption.innerText = 'Rename Chat';
    renameOption.onclick = () => renameChat(chatId);
    menu.appendChild(renameOption);

    const closeOption = document.createElement('div');
    closeOption.innerText = 'Close Chat';
    closeOption.onclick = () => closeChat(chatId);
    menu.appendChild(closeOption);

    document.body.appendChild(menu);
};

// Hook up the right-click context menu to the chat items
const chatItems = document.querySelectorAll('.chat-item');
chatItems.forEach((item) => {
    item.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        createContextMenu(item.id);
    });
});

function renameChat(chatId) {
    // Logic to rename the chat
    const newName = prompt('Enter new chat name:');
    if (newName) {
        document.getElementById(chatId).innerText = newName;
    }
}

function closeChat(chatId) {
    // Logic to close the chat
    document.getElementById(chatId).remove();
}

