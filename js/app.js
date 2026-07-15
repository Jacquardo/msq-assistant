// ==========================================
// OUTIL DE STOCKAGE WEB (Remplace Chrome Storage)
// ==========================================
const storage = {
    get: (keys, callback) => {
        let result = {};
        keys.forEach(k => {
            const val = localStorage.getItem(k);
            if (val) result[k] = JSON.parse(val);
        });
        callback(result);
    },
    set: (obj, callback) => {
        for (let k in obj) {
            localStorage.setItem(k, JSON.stringify(obj[k]));
        }
        if (callback) callback();
    }
};

// Demande d'autorisation pour les notifications Web au démarrage
if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
}

function sendWebNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body: body, icon: 'assets/icons/icon-128.png' });
    }
}

// ==========================================
// 1. GESTION DE L'HORLOGE
// ==========================================
function updateClock() {
    const now = new Date();
    const timeElement = document.getElementById('clock-time');
    const dateElement = document.getElementById('clock-date');
    if(timeElement) timeElement.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    if(dateElement) dateElement.textContent = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

// ==========================================
// 2. NOTES AVANCÉES
// ==========================================
const btnNewNote = document.getElementById('btn-new-note');
const noteForm = document.getElementById('new-note-form');
const btnSaveNote = document.getElementById('btn-save-note');
const btnCancelNote = document.getElementById('btn-cancel-note');
const notesList = document.getElementById('notes-list');
const inputNoteTitle = document.getElementById('note-title');
const inputNoteContent = document.getElementById('note-content');
const colorPickers = document.querySelectorAll('.note-color-picker');

let notes = [];
let selectedNoteColor = '#ffffff';

if(btnNewNote) btnNewNote.addEventListener('click', () => { noteForm.style.display = 'block'; });
if(btnCancelNote) btnCancelNote.addEventListener('click', () => { noteForm.style.display = 'none'; });

colorPickers.forEach(picker => {
    picker.addEventListener('click', () => {
        colorPickers.forEach(p => p.classList.remove('selected'));
        picker.classList.add('selected');
        selectedNoteColor = picker.getAttribute('data-color');
    });
});

if(btnSaveNote) {
    btnSaveNote.addEventListener('click', () => {
        if (inputNoteTitle.value.trim() === '' && inputNoteContent.value.trim() === '') return;
        notes.push({
            id: Date.now().toString(),
            title: inputNoteTitle.value.trim(),
            content: inputNoteContent.value.trim(),
            color: selectedNoteColor,
            createdAt: Date.now()
        });
        storage.set({ msq_notes_v2: notes });
        renderNotes();
        inputNoteTitle.value = '';
        inputNoteContent.value = '';
        noteForm.style.display = 'none';
    });
}

function renderNotes() {
    if (!notesList) return;
    notesList.innerHTML = '';
    const sortedNotes = [...notes].sort((a, b) => b.createdAt - a.createdAt);
    sortedNotes.forEach(note => {
        const div = document.createElement('div');
        div.className = 'note-item';
        div.style.background = note.color || '#ffffff';
        div.innerHTML = `
            <div class="note-header">
                <div class="note-title">${note.title || 'Sans titre'}</div>
                <button class="note-delete" data-id="${note.id}">✖</button>
            </div>
            <div class="note-content">${note.content}</div>
        `;
        div.querySelector('.note-delete').addEventListener('click', (e) => {
            notes = notes.filter(n => n.id !== e.target.getAttribute('data-id'));
            storage.set({ msq_notes_v2: notes });
            renderNotes();
        });
        notesList.appendChild(div);
    });
}

storage.get(['msq_notes_v2'], (res) => {
    if (res.msq_notes_v2) { notes = res.msq_notes_v2; renderNotes(); }
});

// ==========================================
// 3. TÂCHES AVANCÉES
// ==========================================
const btnNewTask = document.getElementById('btn-new-task');
const taskForm = document.getElementById('new-task-form');
const btnSaveTask = document.getElementById('btn-save-task');
const btnCancelTask = document.getElementById('btn-cancel-task');
const todoList = document.getElementById('todo-list');
const inputTitle = document.getElementById('task-title');
const inputDesc = document.getElementById('task-desc');
const inputReminder = document.getElementById('task-reminder');
const inputPin = document.getElementById('task-pin');

let tasks = [];

if(btnNewTask) btnNewTask.addEventListener('click', () => { taskForm.style.display = 'block'; });
if(btnCancelTask) btnCancelTask.addEventListener('click', () => { taskForm.style.display = 'none'; });

if(btnSaveTask) {
    btnSaveTask.addEventListener('click', () => {
        if (inputTitle.value.trim() === '') return;
        tasks.push({
            id: Date.now().toString(),
            title: inputTitle.value.trim(),
            desc: inputDesc.value.trim(),
            reminder: inputReminder.value ? new Date(inputReminder.value).getTime() : null,
            pinned: inputPin.checked,
            createdAt: Date.now()
        });
        storage.set({ msq_tasks_v2: tasks });
        renderTasks();
        inputTitle.value = ''; inputDesc.value = ''; inputReminder.value = ''; inputPin.checked = false;
        taskForm.style.display = 'none';
    });
}

function renderTasks() {
    if (!todoList) return;
    todoList.innerHTML = '';
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt - a.createdAt;
    });

    sortedTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.pinned ? 'pinned' : ''}`;
        let reminderText = task.reminder ? `⏰ ${new Date(task.reminder).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}` : '';
        li.innerHTML = `
            <div class="task-header">
                <div class="task-title">${task.pinned ? '📌 ' : ''}${task.title}</div>
                <button class="task-delete" data-id="${task.id}">✖</button>
            </div>
            ${task.desc ? `<div class="task-desc">${task.desc}</div>` : ''}
            <div class="task-footer"><span>${reminderText}</span></div>
        `;
        li.querySelector('.task-delete').addEventListener('click', (e) => {
            tasks = tasks.filter(t => t.id !== e.target.getAttribute('data-id'));
            storage.set({ msq_tasks_v2: tasks });
            renderTasks();
        });
        todoList.appendChild(li);
    });
}

storage.get(['msq_tasks_v2'], (res) => {
    if (res.msq_tasks_v2) { tasks = res.msq_tasks_v2; renderTasks(); }
});

// Vérificateur de rappels de tâches (Chaque seconde)
setInterval(() => {
    const now = Date.now();
    tasks.forEach(t => {
        if (t.reminder && !t.notified && now >= t.reminder) {
            sendWebNotification("⏰ Rappel : " + t.title, t.desc || "C'est l'heure !");
            t.notified = true; // Empêche de spammer
            storage.set({ msq_tasks_v2: tasks });
        }
    });
}, 1000);

// ==========================================
// 4. MÉTÉO WEB
// ==========================================
function getWeatherCodeDetails(code, isDay) {
    const codes = {
        0: { desc: 'Ensoleillé', icon: isDay ? '☀️' : '🌙' },
        1: { desc: 'Clair', icon: isDay ? '🌤️' : '☁️' },
        2: { desc: 'Partiellement nuageux', icon: '⛅' },
        3: { desc: 'Nuageux', icon: '☁️' },
        61: { desc: 'Pluie légère', icon: '🌧️' },
        63: { desc: 'Pluie', icon: '🌧️' },
        65: { desc: 'Pluie forte', icon: '🌧️' },
        95: { desc: 'Orage', icon: '⛈️' }
    };
    return codes[code] || { desc: 'Météo', icon: '🌡️' };
}

async function fetchWeather(lat, lon) {
    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,weather_code&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const data = await weatherRes.json();
        
        const locRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`);
        const locData = await locRes.json();
        
        const info = getWeatherCodeDetails(data.current.weather_code, data.current.is_day);
        const topMain = document.getElementById('top-weather-main');
        const topLoc = document.getElementById('top-weather-loc');
        
        if (topMain) topMain.textContent = `${Math.round(data.current.temperature_2m)}°C ${info.icon}`;
        if (topLoc) topLoc.textContent = locData.city || locData.locality || "Inconnu";
    } catch (e) {
        console.log("Erreur Météo", e);
    }
}

storage.get(['weather_fallback_coords'], (res) => {
    let lat = -18.8792, lon = 47.5079;
    if (res.weather_fallback_coords) {
        [lat, lon] = res.weather_fallback_coords.split(',').map(Number);
    }
    fetchWeather(lat, lon);
});

// ==========================================
// 5. NAVIGATION WEB
// ==========================================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.page-section').forEach(page => page.style.display = 'none');
        document.getElementById(btn.getAttribute('data-target')).style.display = 'block';
    });
});

// ==========================================
// 6. THÈMES WEB
// ==========================================
const appThemes = [
    { name: 'Vert MSQ', c1: '#2ecc71', c2: '#1abc9c' },
    { name: 'Bleu', c1: '#3498db', c2: '#2980b9' },
    { name: 'Rose', c1: '#fd79a8', c2: '#e84393' },
    { name: 'Violet', c1: '#9b59b6', c2: '#8e44ad' },
    { name: 'Jaune', c1: '#f1c40f', c2: '#f39c12' },
    { name: 'Orange', c1: '#e67e22', c2: '#d35400' },
    { name: 'Rouge', c1: '#ff7675', c2: '#d63031' },
    { name: 'Cyan', c1: '#00cec9', c2: '#00b894' },
    { name: 'Gris', c1: '#b2bec3', c2: '#636e72' }
];

function applyThemeColors(c1, c2) {
    document.documentElement.style.setProperty('--msq-green', c1);
    document.documentElement.style.setProperty('--msq-mint', c2);
}

const themePalette = document.getElementById('theme-palette');
if(themePalette) {
    storage.get(['app_theme_color1'], (res) => {
        const activeColor = res.app_theme_color1 || '#2ecc71';
        appThemes.forEach(theme => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.background = `linear-gradient(135deg, ${theme.c1}, ${theme.c2})`;
            if (theme.c1 === activeColor) swatch.classList.add('active');
            swatch.addEventListener('click', () => {
                storage.set({ app_theme_color1: theme.c1, app_theme_color2: theme.c2 });
                applyThemeColors(theme.c1, theme.c2);
                window.location.reload(); // Rafraichit pour appliquer visuellement la sélection
            });
            themePalette.appendChild(swatch);
        });
    });
}

storage.get(['app_theme_color1', 'app_theme_color2'], (res) => {
    if (res.app_theme_color1 && res.app_theme_color2) applyThemeColors(res.app_theme_color1, res.app_theme_color2);
});

// ==========================================
// 7. FOND D'ÉCRAN DYNAMIQUE
// ==========================================
function setDailyBackground() {
    const bg = document.querySelector('.background-image');
    if (!bg) return;
    const day = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    bg.style.position = 'absolute'; bg.style.top = '0'; bg.style.left = '0'; bg.style.width = '100%'; bg.style.height = '100%';
    bg.style.zIndex = '-1'; bg.style.backgroundSize = 'cover'; bg.style.backgroundPosition = 'center'; bg.style.opacity = '0.4';
    bg.style.backgroundImage = `url('https://picsum.photos/seed/msq${day}/400/600')`;
}
setDailyBackground();
