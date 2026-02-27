// Updated script.js

const chatNames = [
    'ChatGPT',
    'AI Assistant',
    'Virtual Buddy',
    'Smart Helper',
    'Chatbot',
    'Friendly AI'
];

// Right-click context menu options
const contextMenuOptions = [
    'Rename Chat',
    'Close Chat'
];

// Function to display the context menu
function showContextMenu(event) {
    event.preventDefault();
    const menu = document.createElement('div');
    menu.classList.add('context-menu');

    contextMenuOptions.forEach(option => {
        const item = document.createElement('div');
        item.textContent = option;
        item.addEventListener('click', () => {
            handleContextMenuOption(option);
            menu.remove(); // Close menu after selection
        });
        menu.appendChild(item);
    });

    document.body.appendChild(menu);
    menu.style.top = `${event.clientY}px`;
    menu.style.left = `${event.clientX}px`;
}

function handleContextMenuOption(option) {
    if (option === 'Rename Chat') {
        // Logic for renaming a chat
        alert('Renaming chat...');
    } else if (option === 'Close Chat') {
        // Logic for closing a chat
        alert('Closing chat...');
    }
}

// Event listener to show the context menu
document.addEventListener('contextmenu', showContextMenu);

