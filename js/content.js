let clockElement = null;
let clockInterval = null;
let isDragging = false;
let currentX, currentY, initialMouseX, initialMouseY;

const messages = [
    "🌸 Soyez heureux.", "💪 Courage !", "🌟 Tu as un bel avenir devant toi.",
    "❤️ Force à toi.", "✨ Tu es plus fort que tu ne le penses.",
    "🌈 Chaque jour est une nouvelle opportunité.", "😊 N'oublie pas de sourire aujourd'hui.",
    "🚀 Continue d'avancer, tu es sur la bonne voie.", "💖 Prends soin de toi.",
    "🌻 Tu peux être fier de tes progrès."
];

function getMessageDuJour() {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    return messages[dayOfYear % messages.length];
}

function createClock() {
    if (clockElement) return;
    
    clockElement = document.createElement('div');
    clockElement.id = 'msq-floating-clock';
    clockElement.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
            <span>🕒</span> <span id="msq-time-text">00:00:00</span>
        </div>
        <div id="msq-motivational-msg">${getMessageDuJour()}</div>
    `;
    
    document.body.appendChild(clockElement);

    chrome.storage.local.get(['floating_x', 'floating_y'], (res) => {
        if (res.floating_x && res.floating_y) {
            clockElement.style.left = res.floating_x;
            clockElement.style.top = res.floating_y;
        }
    });

    updateClockAppearance();
    startClock();
    makeDraggable(clockElement);
}

function removeClock() {
    if (clockElement) {
        clockElement.remove();
        clockElement = null;
        clearInterval(clockInterval);
    }
}

function startClock() {
    clearInterval(clockInterval);
    clockInterval = setInterval(() => {
        if (!clockElement) return;
        
        chrome.storage.local.get(['floating_timezone'], (res) => {
            const tz = (res.floating_timezone && res.floating_timezone !== 'local') ? res.floating_timezone : undefined;
            const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: tz };
            document.getElementById('msq-time-text').textContent = new Intl.DateTimeFormat('fr-FR', options).format(new Date());
        });
    }, 1000);
}

function updateClockAppearance() {
    if (!clockElement) return;
    
    chrome.storage.local.get(['floating_theme', 'floating_scale', 'app_theme_color1', 'app_theme_color2'], (res) => {
        clockElement.className = '';
        clockElement.style.background = '';
        clockElement.style.color = '';
        clockElement.style.border = '';

        if (res.floating_theme === 'light') {
            clockElement.classList.add('theme-light');
        } else if (res.floating_theme === 'dark') {
            clockElement.classList.add('theme-dark');
        } else {
            // Thème personnalisé dynamique (Couleurs de l'application)
            const c1 = res.app_theme_color1 || '#2ecc71';
            const c2 = res.app_theme_color2 || '#1abc9c';
            clockElement.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
            clockElement.style.color = 'white';
            clockElement.style.border = 'none';
        }
        
        const scale = res.floating_scale || 1.0;
        clockElement.style.transform = `scale(${scale})`;
        clockElement.style.transformOrigin = 'top left';
    });
}

function makeDraggable(el) {
    el.addEventListener('mousedown', (e) => {
        isDragging = true;
        initialMouseX = e.clientX; 
        initialMouseY = e.clientY;
        const rect = el.getBoundingClientRect();
        currentX = rect.left; 
        currentY = rect.top;
        el.style.transition = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        el.style.left = (currentX + (e.clientX - initialMouseX)) + 'px';
        el.style.top = (currentY + (e.clientY - initialMouseY)) + 'px';
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            el.style.transition = 'transform 0.2s';
            chrome.storage.local.set({ 
                floating_x: el.style.left, 
                floating_y: el.style.top 
            });
        }
    });
}

chrome.storage.onChanged.addListener((changes) => {
    if (changes.floating_active) {
        changes.floating_active.newValue ? createClock() : removeClock();
    }
    if (changes.floating_theme || changes.floating_scale || changes.app_theme_color1) {
        updateClockAppearance();
    }
});

chrome.storage.local.get(['floating_active'], (res) => { 
    if (res.floating_active) createClock(); 
});

// === ÉCOUTER LE SIGNAL POUR JOUER UN SON ===
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "playSound") {
        // Utilise un son de clochette doux et professionnel fourni par Google
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        audio.volume = 0.8;
        audio.play().catch(e => console.log("Son bloqué par le navigateur", e));
        sendResponse({status: "played"});
    }
    return true;
});

// === ÉCOUTER LES SIGNAUX (SON ET NOTIFICATIONS TOAST) ===
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // Jouer le son
    if (request.action === "playSound") {
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        audio.volume = 0.8;
        audio.play().catch(e => console.log("Son bloqué", e));
        sendResponse({status: "played"});
    }
    
    // Afficher une notification directement sur la page
    if (request.action === "showToast") {
        // Crée la bulle de notification
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.background = 'white';
        toast.style.borderLeft = '5px solid #2ecc71';
        toast.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        toast.style.padding = '15px 20px';
        toast.style.borderRadius = '8px';
        toast.style.zIndex = '9999999';
        toast.style.fontFamily = 'sans-serif';
        toast.style.color = '#333';
        toast.style.minWidth = '250px';
        toast.style.animation = 'slideIn 0.3s ease-out';
        
        toast.innerHTML = `
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${request.title}</div>
            <div style="font-size: 14px; color: #555;">${request.message}</div>
        `;
        
        document.body.appendChild(toast);
        
        // Fait disparaître la bulle après 6 secondes
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(() => toast.remove(), 500);
        }, 6000);
        
        sendResponse({status: "toast_shown"});
    }
    
    return true;
});

// Ajoute l'animation CSS pour le toast si elle n'existe pas
if (!document.getElementById('msq-toast-style')) {
    const style = document.createElement('style');
    style.id = 'msq-toast-style';
    style.innerHTML = `@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`;
    document.head.appendChild(style);
}