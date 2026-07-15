// ==========================================
// MOTEUR DU PLANNING INTELLIGENT
// ==========================================

// Vérifie le planning chaque minute pour déclencher les événements
chrome.alarms.create("scheduleChecker", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "scheduleChecker") checkSchedule();
});

// Convertit une heure "HH:MM" en Timestamp (millisecondes) pour aujourd'hui
function getTimeToday(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.getTime();
}

function checkSchedule() {
    chrome.storage.local.get(['s_start', 's_end', 's_lunchStart', 's_lunchEnd', 's_breakStart', 's_breakEnd', 'last_event_triggered'], (res) => {
        if (!res.s_start) return; // Planning non configuré

        const now = Date.now();
        const lastTriggered = res.last_event_triggered || "";

        // On crée la liste de tous les événements de la journée
        const events = [
            { id: "start", time: getTimeToday(res.s_start), title: "🌅 Début de journée", msg: "Au travail, passe une excellente journée !", mode: "Travail" },
            { id: "lunch_start", time: getTimeToday(res.s_lunchStart), title: "🍽️ Pause Déjeuner", msg: "Bon appétit ! Déconnecte-toi un peu.", mode: "Repas" },
            { id: "lunch_end", time: getTimeToday(res.s_lunchEnd), title: "⏰ Reprise", msg: "Le déjeuner est terminé. C'est reparti !", mode: "Travail" },
            { id: "break_start", time: getTimeToday(res.s_breakStart), title: "☕ Petite Pause", msg: "Prends un café et étire-toi.", mode: "Pause" },
            { id: "break_end", time: getTimeToday(res.s_breakEnd), title: "⏰ Reprise", msg: "La pause est finie, dernière ligne droite !", mode: "Travail" },
            { id: "end", time: getTimeToday(res.s_end), title: "🎉 Fin de journée", msg: "Félicitations, tu as terminé ! Repose-toi bien.", mode: "Terminé" }
        ];

        // Trie les événements dans l'ordre chronologique
        events.sort((a, b) => a.time - b.time);

        // Trouve quel est l'événement actuel
        let currentEvent = null;
        let nextEvent = null;

        for (let i = 0; i < events.length; i++) {
            if (now >= events[i].time) {
                currentEvent = events[i];
                nextEvent = events[i + 1] || null; // Le suivant
            } else if (!nextEvent) {
                nextEvent = events[i];
            }
        }

        // Si un nouvel événement vient de se déclencher et qu'on ne l'a pas encore notifié
        if (currentEvent && currentEvent.id !== lastTriggered) {
            sendNotification(currentEvent.title, currentEvent.msg);
            playSoundInActiveTab();
            chrome.storage.local.set({ last_event_triggered: currentEvent.id });
        }

        // Sauvegarde l'état actuel pour que le popup l'affiche (HH:MM:SS)
        chrome.storage.local.set({ 
            current_phase: currentEvent ? currentEvent.mode : "Hors planning",
            next_target_time: nextEvent ? nextEvent.time : 0,
            next_phase_name: nextEvent ? nextEvent.title : "Demain"
        });
    });
}

// Fonction utilitaire pour envoyer une notification
function sendNotification(title, message) {
    const absoluteIconUrl = chrome.runtime.getURL('assets/icons/icon-128.png');
    chrome.notifications.create({
        type: 'basic', iconUrl: absoluteIconUrl, title: title, message: message, priority: 2
    });
    // Et le Toast
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        if (tabs.length > 0) chrome.tabs.sendMessage(tabs[0].id, {action: "showToast", title: title, message: message}).catch(()=>{});
    });
}

// Jouer un son (en demandant à la page web active)
function playSoundInActiveTab() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        if (tabs.length > 0) chrome.tabs.sendMessage(tabs[0].id, {action: "playSound"}).catch(()=>{});
    });
}

// Rafraîchir manuellement si le popup demande
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === "refreshSchedule") checkSchedule();
    return true; // Important pour indiquer une réponse asynchrone si besoin plus tard
});

// === 4. GESTION DES ALARMES DE TÂCHES ===
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Si on demande de programmer un rappel
    if (request.action === "setTaskAlarm") {
        const t = request.task;
        chrome.alarms.create(`task_${t.id}`, { when: t.reminder });
    }
    // Si on supprime une tâche, on annule l'alarme
    if (request.action === "cancelTaskAlarm") {
        chrome.alarms.clear(`task_${request.taskId}`);
    }
    return true;
});

// Écouter quand une alarme de tâche sonne
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name.startsWith("task_")) {
        const taskId = alarm.name.split('_')[1];
        
        // On récupère les détails de la tâche pour afficher son nom
        chrome.storage.local.get(['msq_tasks_v2'], (res) => {
            const tasks = res.msq_tasks_v2 || [];
            const task = tasks.find(t => t.id === taskId);
            
            if (task) {
                sendNotification("⏰ Rappel de tâche !", task.title + (task.desc ? `\n${task.desc}` : ""));
                playSoundInActiveTab();
            }
        });
    }
});