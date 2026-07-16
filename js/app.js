// ==========================================
// OUTIL DE STOCKAGE WEB (PWA)
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
const fileInput = document.getElementById('note-file-input');
const btnAttachFile = document.getElementById('btn-attach-file');

let currentAttachedFileData = null;
let currentAttachedFileName = null;
let notes = [];
let selectedNoteColor = '#ffffff';

if(btnNewNote) btnNewNote.addEventListener('click', () => { noteForm.style.display = 'block'; });
if(btnCancelNote) btnCancelNote.addEventListener('click', () => { noteForm.style.display = 'none'; resetNoteForm(); });
if(btnAttachFile) btnAttachFile.addEventListener('click', () => { fileInput.click(); });

if(fileInput) {
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert("⚠️ Le fichier est trop lourd (max 2 Mo).");
            fileInput.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            currentAttachedFileData = event.target.result;
            currentAttachedFileName = file.name;
            let shortName = file.name.length > 15 ? file.name.substring(0, 15) + "..." : file.name;
            btnAttachFile.textContent = "📎 " + shortName;
            btnAttachFile.style.background = "var(--msq-mint)";
            btnAttachFile.style.color = "white";
        };
        reader.readAsDataURL(file);
    });
}

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
            attachmentData: currentAttachedFileData,
            attachmentName: currentAttachedFileName,
            createdAt: Date.now()
        });
        storage.set({ msq_notes_v2: notes });
        renderNotes();
        resetNoteForm();
        noteForm.style.display = 'none';
    });
}

function resetNoteForm() {
    if(inputNoteTitle) inputNoteTitle.value = '';
    if(inputNoteContent) inputNoteContent.value = '';
    if(fileInput) fileInput.value = '';
    currentAttachedFileData = null;
    currentAttachedFileName = null;
    if(btnAttachFile) {
        btnAttachFile.textContent = "📎 Fichier";
        btnAttachFile.style.background = "transparent";
        btnAttachFile.style.color = "var(--text-light)";
    }
    colorPickers.forEach(p => p.classList.remove('selected'));
    selectedNoteColor = '#ffffff';
}

function renderNotes() {
    if (!notesList) return;
    notesList.innerHTML = '';
    const sortedNotes = [...notes].sort((a, b) => b.createdAt - a.createdAt);
    sortedNotes.forEach(note => {
        const div = document.createElement('div');
        div.className = 'note-item';
        div.style.background = note.color || '#ffffff';
        let attachmentHtml = '';
        if (note.attachmentData) {
            attachmentHtml = `<a href="${note.attachmentData}" download="${note.attachmentName}" class="note-attachment">📎 ${note.attachmentName}</a>`;
        }
        div.innerHTML = `
            <div class="note-header">
                <div class="note-title">${note.title || 'Sans titre'}</div>
                <button class="note-delete" data-id="${note.id}">✖</button>
            </div>
            <div class="note-content">${note.content}</div>
            ${attachmentHtml}
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
if(btnCancelTask) btnCancelTask.addEventListener('click', () => { 
    taskForm.style.display = 'none'; 
    inputTitle.value = ''; inputDesc.value = ''; inputReminder.value = ''; inputPin.checked = false;
});

if(btnSaveTask) {
    btnSaveTask.addEventListener('click', () => {
        if (inputTitle.value.trim() === '') { alert("Veuillez entrer un titre."); return; }
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

setInterval(() => {
    const now = Date.now();
    let updated = false;
    tasks.forEach(t => {
        if (t.reminder && !t.notified && now >= t.reminder) {
            sendWebNotification("⏰ Rappel : " + t.title, t.desc || "C'est l'heure !");
            t.notified = true;
            updated = true;
        }
    });
    if (updated) storage.set({ msq_tasks_v2: tasks });
}, 1000);

// ==========================================
// 4. MÉTÉO WEB ET DÉTAILS AVANCÉS
// ==========================================
const waCard = document.getElementById('weather-advanced-card');
const btnTopWeather = document.getElementById('top-weather-btn');
const waLocation = document.getElementById('wa-location');
const waIcon = document.getElementById('wa-icon');
const waTemp = document.getElementById('wa-temp');
const waDesc = document.getElementById('wa-desc');
const waHumidity = document.getElementById('wa-humidity');
const waWind = document.getElementById('wa-wind');
const waSunrise = document.getElementById('wa-sunrise');
const waSunset = document.getElementById('wa-sunset');

if (btnTopWeather && waCard) {
    btnTopWeather.addEventListener('click', () => {
        waCard.style.display = waCard.style.display === 'none' ? 'block' : 'none';
    });
}

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
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&daily=sunrise,sunset&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const data = await weatherRes.json();
        const locRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`);
        const locData = await locRes.json();
        
        const info = getWeatherCodeDetails(data.current.weather_code, data.current.is_day);
        const topMain = document.getElementById('top-weather-main');
        const topLoc = document.getElementById('top-weather-loc');
        
        const city = locData.city || locData.locality || "Inconnu";
        
        if (topMain) topMain.textContent = `${Math.round(data.current.temperature_2m)}°C ${info.icon}`;
        if (topLoc) topLoc.textContent = city;

        // Met à jour le grand panneau détaillé
        if(waLocation) waLocation.textContent = city;
        if(waTemp) waTemp.textContent = `${Math.round(data.current.temperature_2m)}°C`;
        if(waIcon) waIcon.textContent = info.icon;
        if(waDesc) waDesc.textContent = info.desc;
        if(waHumidity) waHumidity.textContent = `${data.current.relative_humidity_2m}%`;
        if(waWind) waWind.textContent = `${Math.round(data.current.wind_speed_10m)} km/h`;
        
        const sunriseDate = new Date(data.daily.sunrise[0]);
        const sunsetDate = new Date(data.daily.sunset[0]);
        if(waSunrise) waSunrise.textContent = sunriseDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
        if(waSunset) waSunset.textContent = sunsetDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
        
    } catch (e) {
        console.log("Erreur Météo", e);
    }
}

function initWeather() {
    storage.get(['weather_fallback_coords'], (res) => {
        let lat = -18.8792, lon = 47.5079;
        if (res.weather_fallback_coords) {
            [lat, lon] = res.weather_fallback_coords.split(',').map(Number);
        }
        fetchWeather(lat, lon);
    });
}
initWeather();
setInterval(initWeather, 5 * 60 * 1000); 

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
// 6. GESTION DU PLANNING AUTOMATIQUE WEB
// ==========================================
const btnOpenSettings = document.getElementById('btn-open-settings');
const btnCancelSettings = document.getElementById('btn-cancel-settings');
const viewTimer = document.getElementById('pomodoro-timer-view');
const viewSettings = document.getElementById('pomodoro-settings-view');
const btnSaveSettings = document.getElementById('btn-save-settings');

const inputStart = document.getElementById('set-day-start');
const inputEnd = document.getElementById('set-day-end');
const inputLunchStart = document.getElementById('set-lunch-start');
const inputLunchEnd = document.getElementById('set-lunch-end');
const inputBreakStart = document.getElementById('set-break-start');
const inputBreakEnd = document.getElementById('set-break-end');

const displayTime = document.getElementById('pomodoro-time');
const currentPhaseLabel = document.getElementById('current-phase-label');
const nextPhaseLabel = document.getElementById('next-phase-label');

if(btnOpenSettings) {
    btnOpenSettings.addEventListener('click', () => {
        viewTimer.style.display = 'none';
        viewSettings.style.display = 'block';
    });
}

if(btnCancelSettings) {
    btnCancelSettings.addEventListener('click', () => {
        viewSettings.style.display = 'none';
        viewTimer.style.display = 'block';
    });
}

if(btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
        storage.set({
            s_start: inputStart.value,
            s_end: inputEnd.value,
            s_lunchStart: inputLunchStart.value,
            s_lunchEnd: inputLunchEnd.value,
            s_breakStart: inputBreakStart.value,
            s_breakEnd: inputBreakEnd.value
        }, () => {
            alert("Planning web sauvegardé !");
            viewSettings.style.display = 'none';
            viewTimer.style.display = 'block';
            updateDashboard();
        });
    });
}

storage.get(['s_start', 's_end', 's_lunchStart', 's_lunchEnd', 's_breakStart', 's_breakEnd'], (res) => {
    if (res.s_start && inputStart) inputStart.value = res.s_start;
    if (res.s_end && inputEnd) inputEnd.value = res.s_end;
    if (res.s_lunchStart && inputLunchStart) inputLunchStart.value = res.s_lunchStart;
    if (res.s_lunchEnd && inputLunchEnd) inputLunchEnd.value = res.s_lunchEnd;
    if (res.s_breakStart && inputBreakStart) inputBreakStart.value = res.s_breakStart;
    if (res.s_breakEnd && inputBreakEnd) inputBreakEnd.value = res.s_breakEnd;
});

function getTimeToday(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.getTime();
}

function formatTimeHHMMSS(ms) {
    if (ms <= 0) return "00:00:00";
    let totalSeconds = Math.floor(ms / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;
    return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

function updateDashboard() {
    if(!displayTime) return;
    storage.get(['s_start', 's_end', 's_lunchStart', 's_lunchEnd', 's_breakStart', 's_breakEnd'], (res) => {
        if (!res.s_start) {
            currentPhaseLabel.textContent = "Aucun planning";
            displayTime.textContent = "00:00:00";
            nextPhaseLabel.textContent = "Cliquez sur ⚙️ pour configurer";
            return;
        }

        const now = Date.now();
        const events = [
            { time: getTimeToday(res.s_start), title: "🌅 Début de journée", mode: "Travail" },
            { time: getTimeToday(res.s_lunchStart), title: "🍽️ Pause Déjeuner", mode: "Repas" },
            { time: getTimeToday(res.s_lunchEnd), title: "⏰ Reprise", mode: "Travail" },
            { time: getTimeToday(res.s_breakStart), title: "☕ Petite Pause", mode: "Pause" },
            { time: getTimeToday(res.s_breakEnd), title: "⏰ Reprise", mode: "Travail" },
            { time: getTimeToday(res.s_end), title: "🎉 Fin de journée", mode: "Terminé" }
        ].filter(e => e.time > 0).sort((a, b) => a.time - b.time);

        let currentEvent = null;
        let nextEvent = null;

        for (let i = 0; i < events.length; i++) {
            if (now >= events[i].time) {
                currentEvent = events[i];
                nextEvent = events[i + 1] || null;
            } else if (!nextEvent) {
                nextEvent = events[i];
            }
        }

        currentPhaseLabel.textContent = "Mode : " + (currentEvent ? currentEvent.mode : "Attente");
        
        if (nextEvent) {
            displayTime.textContent = formatTimeHHMMSS(nextEvent.time - now);
            nextPhaseLabel.textContent = "Prochain événement : " + nextEvent.title;
        } else {
            displayTime.textContent = "00:00:00";
            nextPhaseLabel.textContent = "Journée terminée";
        }
    });
}
setInterval(updateDashboard, 1000);
updateDashboard();

// ==========================================
// 7. MENUS DÉROULANTS GLOBAUX
// ==========================================
document.querySelectorAll('.custom-select-container').forEach(container => {
    const trigger = container.querySelector('.custom-select-trigger');
    const options = container.querySelectorAll('.custom-option');
    const textDisplay = container.querySelector('.selected-text');

    trigger.addEventListener('click', () => {
        document.querySelectorAll('.custom-select-container').forEach(c => {
            if (c !== container) c.classList.remove('open');
        });
        container.classList.toggle('open');
    });

    options.forEach(option => {
        option.addEventListener('click', () => {
            textDisplay.textContent = option.textContent;
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            container.classList.remove('open');

            const value = option.getAttribute('data-value');
            if (container.id === 'custom-theme-select') {
                storage.set({ floating_theme: value }, updateFloatingClockAppearance);
            } else if (container.id === 'custom-timezone-select') {
                storage.set({ floating_timezone: value });
            } else if (container.id === 'custom-city-select') {
                storage.set({ weather_fallback_coords: value }, () => {
                    initWeather(); 
                });
            }
        });
    });
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select-container')) {
        document.querySelectorAll('.custom-select-container').forEach(c => c.classList.remove('open'));
    }
});

function updateCustomSelect(containerId, value) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const targetOption = container.querySelector(`.custom-option[data-value="${value}"]`);
    if (targetOption) {
        container.querySelector('.selected-text').textContent = targetOption.textContent;
        container.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
        targetOption.classList.add('selected');
    }
}

// ==========================================
// 8. HORLOGE FLOTTANTE (INJECTÉE DANS LA PWA)
// ==========================================
// Ajoute le CSS spécifique pour l'horloge flottante
if (!document.getElementById('floating-clock-style')) {
    const style = document.createElement('style');
    style.id = 'floating-clock-style';
    style.innerHTML = `
        #msq-floating-clock {
            position: fixed; top: 20px; left: 20px; z-index: 999999;
            padding: 12px 25px; border-radius: 20px;
            font-family: 'Poppins', sans-serif;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            display: flex; flex-direction: column; align-items: center; gap: 2px;
            cursor: move; transition: transform 0.2s ease;
        }
        #msq-floating-clock span:first-child { font-size: 28px; }
        #msq-time-text { font-size: 32px; font-weight: bold; letter-spacing: 1.5px; }
        #msq-motivational-msg { font-size: 14.5px; font-weight: 500; opacity: 0.9; text-align: center; margin-top: 4px; }
        #msq-floating-clock.theme-light { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); color: #2c3e50; border: 1px solid rgba(0,0,0,0.1); }
        #msq-floating-clock.theme-dark { background: rgba(30, 30, 30, 0.95); backdrop-filter: blur(10px); color: #ffffff; border: 1px solid rgba(255,255,255,0.1); }
    `;
    document.head.appendChild(style);
}

let floatingClockElement = null;
let floatingClockInterval = null;

const motivationalMessages = [
    "🌸 Soyez heureux.", "💪 Courage !", "🌟 Tu as un bel avenir devant toi.",
    "❤️ Force à toi.", "✨ Tu es plus fort que tu ne le penses.",
    "🌈 Chaque jour est une nouvelle opportunité.", "😊 N'oublie pas de sourire aujourd'hui.",
    "🚀 Continue d'avancer.", "💖 Prends soin de toi.", "🌻 Tu peux être fier de tes progrès."
];

function getMessageDuJour() {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return motivationalMessages[dayOfYear % motivationalMessages.length];
}

function createFloatingClock() {
    if (floatingClockElement) return;
    floatingClockElement = document.createElement('div');
    floatingClockElement.id = 'msq-floating-clock';
    floatingClockElement.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
            <span>🕒</span> <span id="msq-time-text">00:00:00</span>
        </div>
        <div id="msq-motivational-msg">${getMessageDuJour()}</div>
    `;
    document.body.appendChild(floatingClockElement);

    storage.get(['floating_x', 'floating_y'], (res) => {
        if (res.floating_x && res.floating_y) {
            floatingClockElement.style.left = res.floating_x;
            floatingClockElement.style.top = res.floating_y;
        }
    });

    updateFloatingClockAppearance();
    startFloatingClock();
    makeDraggable(floatingClockElement);
}

function removeFloatingClock() {
    if (floatingClockElement) {
        floatingClockElement.remove();
        floatingClockElement = null;
        clearInterval(floatingClockInterval);
    }
}

function startFloatingClock() {
    clearInterval(floatingClockInterval);
    floatingClockInterval = setInterval(() => {
        if (!floatingClockElement) return;
        storage.get(['floating_timezone'], (res) => {
            const tz = (res.floating_timezone && res.floating_timezone !== 'local') ? res.floating_timezone : undefined;
            const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: tz };
            document.getElementById('msq-time-text').textContent = new Intl.DateTimeFormat('fr-FR', options).format(new Date());
        });
    }, 1000);
}

function updateFloatingClockAppearance() {
    if (!floatingClockElement) return;
    storage.get(['floating_theme', 'floating_scale', 'app_theme_color1', 'app_theme_color2'], (res) => {
        floatingClockElement.className = '';
        floatingClockElement.style.background = '';
        floatingClockElement.style.color = '';
        floatingClockElement.style.border = '';

        if (res.floating_theme === 'light') {
            floatingClockElement.classList.add('theme-light');
        } else if (res.floating_theme === 'dark') {
            floatingClockElement.classList.add('theme-dark');
        } else {
            const c1 = res.app_theme_color1 || '#2ecc71';
            const c2 = res.app_theme_color2 || '#1abc9c';
            floatingClockElement.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
            floatingClockElement.style.color = 'white';
            floatingClockElement.style.border = 'none';
        }
        
        const scale = res.floating_scale || 1.0;
        floatingClockElement.style.transform = `scale(${scale})`;
        floatingClockElement.style.transformOrigin = 'top left';
    });
}

function makeDraggable(el) {
    let isDragging = false;
    let currentX, currentY, initialMouseX, initialMouseY;

    const dragStart = (e) => {
        isDragging = true;
        initialMouseX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        initialMouseY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        const rect = el.getBoundingClientRect();
        currentX = rect.left; currentY = rect.top;
        el.style.transition = 'none';
    };

    const dragAction = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        el.style.left = (currentX + (clientX - initialMouseX)) + 'px';
        el.style.top = (currentY + (clientY - initialMouseY)) + 'px';
    };

    const dragEnd = () => {
        if (isDragging) {
            isDragging = false;
            el.style.transition = 'transform 0.2s ease';
            storage.set({ floating_x: el.style.left, floating_y: el.style.top });
        }
    };

    el.addEventListener('mousedown', dragStart);
    el.addEventListener('touchstart', dragStart, {passive: false});
    document.addEventListener('mousemove', dragAction);
    document.addEventListener('touchmove', dragAction, {passive: false});
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
}

const btnToggleFloating = document.getElementById('toggle-floating');
const btnSizeMinus = document.getElementById('size-minus');
const btnSizePlus = document.getElementById('size-plus');
const btnSizeReset = document.getElementById('size-reset');

storage.get(['floating_active', 'floating_theme', 'floating_timezone'], (res) => {
    if (res.floating_active && btnToggleFloating) {
        btnToggleFloating.textContent = "Masquer l'horloge";
        btnToggleFloating.className = 'btn-cancel';
        btnToggleFloating.style.width = '100%';
        btnToggleFloating.style.marginBottom = '15px';
        createFloatingClock(); // Affiche l'horloge au démarrage
    }
    if (res.floating_theme) updateCustomSelect('custom-theme-select', res.floating_theme);
    if (res.floating_timezone) updateCustomSelect('custom-timezone-select', res.floating_timezone);
});

if(btnToggleFloating) {
    btnToggleFloating.addEventListener('click', () => {
        storage.get(['floating_active'], (res) => {
            const newState = !res.floating_active;
            storage.set({ floating_active: newState });
            
            if (newState) {
                btnToggleFloating.textContent = "Masquer l'horloge";
                btnToggleFloating.className = 'btn-cancel';
                createFloatingClock();
            } else {
                btnToggleFloating.textContent = "Afficher l'horloge";
                btnToggleFloating.className = 'btn-outline';
                removeFloatingClock();
            }
        });
    });
}

function changeScale(amount) {
    storage.get(['floating_scale'], (res) => {
        let currentScale = res.floating_scale || 1.0;
        currentScale = amount === 0 ? 1.0 : currentScale + amount;
        if (currentScale < 0.5) currentScale = 0.5;
        if (currentScale > 2.5) currentScale = 2.5;
        storage.set({ floating_scale: currentScale }, updateFloatingClockAppearance);
    });
}

if(btnSizeMinus) btnSizeMinus.addEventListener('click', () => changeScale(-0.1));
if(btnSizePlus) btnSizePlus.addEventListener('click', () => changeScale(0.1));
if(btnSizeReset) btnSizeReset.addEventListener('click', () => changeScale(0));


// ==========================================
// 9. THÈMES WEB
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
                updateFloatingClockAppearance();
                window.location.reload(); 
            });
            themePalette.appendChild(swatch);
        });
    });
}

storage.get(['app_theme_color1', 'app_theme_color2'], (res) => {
    if (res.app_theme_color1 && res.app_theme_color2) applyThemeColors(res.app_theme_color1, res.app_theme_color2);
});

// ==========================================
// 10. FOND D'ÉCRAN DYNAMIQUE
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

// ==========================================
// 11. CONVERTISSEUR DE TEXTE
// ==========================================
const textConverterInput = document.getElementById('text-converter-input');
const textWordCount = document.getElementById('text-word-count');
const btnTextLower = document.getElementById('btn-text-lower');
const btnTextUpper = document.getElementById('btn-text-upper');
const btnCopyText = document.getElementById('btn-copy-text');

if (textConverterInput) {
    textConverterInput.addEventListener('input', () => {
        let text = textConverterInput.value;
        let words = text.trim().split(/\s+/).filter(word => word.length > 0);
        if (words.length > 200) {
            words = words.slice(0, 200);
            textConverterInput.value = words.join(" ");
        }
        textWordCount.textContent = `Mots : ${words.length} / 200`;
        textWordCount.style.color = words.length >= 200 ? '#e74c3c' : 'var(--text-light)';
    });
    btnTextLower.addEventListener('click', () => { textConverterInput.value = textConverterInput.value.toLowerCase(); });
    btnTextUpper.addEventListener('click', () => { textConverterInput.value = textConverterInput.value.toUpperCase(); });
    btnCopyText.addEventListener('click', () => {
        if (!textConverterInput.value) return;
        navigator.clipboard.writeText(textConverterInput.value).then(() => {
            const originalText = btnCopyText.innerHTML;
            btnCopyText.innerHTML = "✅ Copié !";
            setTimeout(() => { btnCopyText.innerHTML = originalText; }, 2000);
        });
    });
}

// ==========================================
// 12. GESTION DE L'INSTALLATION PWA
// ==========================================
let deferredPrompt;
const installBanner = document.getElementById('pwa-install-banner');
const btnInstall = document.getElementById('btn-pwa-install');
const btnDismiss = document.getElementById('btn-pwa-dismiss');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBanner) installBanner.style.display = 'block';
});

if (btnInstall) {
    btnInstall.addEventListener('click', () => {
        installBanner.style.display = 'none';
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            deferredPrompt = null;
        });
    });
}

if (btnDismiss) {
    btnDismiss.addEventListener('click', () => {
        installBanner.style.display = 'none';
    });
}

window.addEventListener('appinstalled', () => {
    if (installBanner) installBanner.style.display = 'none';
});
