"use strict";
// ================================================================
// Self Competitive Coach
//
// Mental model (FSM in mind, procedural in code):
//   empty → (first session) → has_baseline → (each session) → has_data
//   After each session: compare current vs past self → project next goal
//
// Procedural flow with functional data operations.
// map, filter, reduce on immutable data.
// ================================================================
// --- Constants ---
const EXERCISE_OPTIONS = [
    { name: 'Push-ups', unit: 'reps' },
    { name: 'Squats', unit: 'reps' },
    { name: 'Plank', unit: 'sec' },
    { name: 'Running', unit: 'min' },
    { name: 'Bench Press', unit: 'kg' },
    { name: 'Deadlift', unit: 'kg' },
];
// --- State ---
let sessions = [];
let rate = 0.01;
let pendingEntries = [];
let review = null;
// --- Persistence (localStorage) ---
function load() {
    try {
        const raw = localStorage.getItem('self-coach-sessions');
        if (raw)
            sessions = JSON.parse(raw);
        const r = localStorage.getItem('self-coach-rate');
        if (r)
            rate = parseFloat(r);
    }
    catch { /* ignore corrupt data */ }
}
function save() {
    localStorage.setItem('self-coach-sessions', JSON.stringify(sessions));
    localStorage.setItem('self-coach-rate', String(rate));
}
// --- Status labels (procedural, no abstraction) ---
function statusLabel() {
    if (sessions.length === 0)
        return 'No sessions yet';
    if (sessions.length === 1)
        return 'Baseline set';
    return `${sessions.length} sessions logged`;
}
// --- Data operations (functional: map, filter, reduce, immutability) ---
function addSession(sessions, entries) {
    const session = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0],
        entries,
    };
    return [...sessions, session];
}
// latestFor — find the most recent entry for an exercise. Uses filter + reduce.
function latestFor(sessions, exercise) {
    return sessions
        .flatMap(s => s.entries)
        .filter(e => e.exercise === exercise)
        .reduce((latest, e) => {
        if (!latest)
            return e;
        // Items are in chronological order, last one wins
        return e;
    }, null);
}
// bestFor — find the best (highest value) entry for an exercise. Uses filter + reduce.
function bestFor(sessions, exercise) {
    return sessions
        .flatMap(s => s.entries)
        .filter(e => e.exercise === exercise)
        .reduce((best, e) => !best || e.value > best.value ? e : best, null);
}
// exercises — collect all unique exercises. Uses flatMap + Set.
function exercises(sessions) {
    return [...new Set(sessions.flatMap(s => s.entries.map(e => e.exercise)))];
}
// projectGoal — compute the next target for an exercise.
// Uses the best past value multiplied by the improvement rate.
function projectGoal(sessions, exercise, rate) {
    const best = bestFor(sessions, exercise);
    return best ? Math.round(best.value * (1 + rate)) : 0;
}
// compare — compare current entries against past self.
// Uses map to build comparison objects.
function compare(current, sessions, rate) {
    return current.map(entry => {
        const prev = latestFor(sessions, entry.exercise);
        const previous = prev ? prev.value : 0;
        const goal = projectGoal(sessions, entry.exercise, rate);
        const change = previous !== 0
            ? Math.round(((entry.value - previous) / previous) * 10000) / 100
            : 0;
        return {
            exercise: entry.exercise,
            unit: entry.unit,
            current: entry.value,
            previous,
            change,
            goal,
        };
    });
}
// recentSessions — return the last N sessions. Uses slice (immutable).
function recentSessions(sessions, count) {
    return sessions.slice(-count).reverse();
}
// --- Rendering ---
function render() {
    const app = document.getElementById('app');
    if (!app)
        return;
    app.innerHTML = review ? buildReview() : buildDashboard();
}
function buildDashboard() {
    const allExercises = exercises(sessions);
    const goals = allExercises.map(ex => ({
        exercise: ex,
        goal: projectGoal(sessions, ex, rate),
        unit: bestFor(sessions, ex)?.unit ?? '',
    }));
    // Helper: build the pending-entries table rows if any
    const pendingRows = pendingEntries.length === 0 ? ''
        : pendingEntries.map(e => `<tr>
        <td>${e.exercise}</td>
        <td>${e.value}</td>
        <td>${e.unit}</td>
        <td><button class="btn btn--small btn--remove" data-action="remove-entry" data-exercise="${e.exercise}">x</button></td>
      </tr>`).join('');
    // Helper: build a "no entries" or pending table
    const pendingBlock = pendingEntries.length === 0
        ? '<p class="muted">No entries yet. Add one below.</p>'
        : `<table class="data-table"><thead><tr><th>Exercise</th><th>Value</th><th>Unit</th><th></th></tr></thead><tbody>${pendingRows}</tbody></table>`;
    // Helper: history rows
    const historyRows = recentSessions(sessions, 5).map(s => {
        const entryCells = s.entries.map(e => `${e.exercise}: ${e.value} ${e.unit}`).join(', ');
        return `<tr><td>${s.date}</td><td>${entryCells}</td></tr>`;
    }).join('') || '<tr><td colspan="2" class="muted">No sessions</td></tr>';
    // Helper: goals list
    const goalItems = goals.length === 0
        ? '<p class="muted">Complete a baseline session first</p>'
        : goals.map(g => `<div class="goal-chip">${g.exercise}: <strong>${g.goal} ${g.unit}</strong></div>`).join('');
    return [
        '<header class="header">',
        '<h1 class="title">Self Competitive Coach</h1>',
        '<p class="subtitle">Beat your past self. 1% better every session.</p>',
        '</header>',
        '<section class="status-bar">',
        `<span class="status-label">${statusLabel()}</span>`,
        '<span class="rate-display">',
        `Rate: ${(rate * 100).toFixed(0)}% per session`,
        '<button class="btn btn--small btn--action" data-action="change-rate">Change</button>',
        '</span>',
        '</section>',
        '<section class="card-panel">',
        '<h2>Log a New Session</h2>',
        '<div class="session-form">',
        '<select id="exercise-select" class="input">',
        EXERCISE_OPTIONS.map(o => `<option value="${o.name}" data-unit="${o.unit}">${o.name} (${o.unit})</option>`).join(''),
        '</select>',
        '<input id="value-input" class="input input--short" type="number" min="1" placeholder="Value" />',
        '<button class="btn btn--primary" data-action="add-entry">Add to Session</button>',
        '</div>',
        pendingBlock,
        pendingEntries.length > 0
            ? '<button class="btn btn--complete" data-action="complete-session" style="margin-top:0.75rem">Complete Session</button>'
            : '',
        '</section>',
        '<section class="card-panel">',
        '<h2>Next Goals</h2>',
        '<div class="goal-list">',
        goalItems,
        '</div>',
        '</section>',
        '<section class="card-panel">',
        '<h2>Session History</h2>',
        '<table class="data-table">',
        '<thead><tr><th>Date</th><th>Exercises</th></tr></thead>',
        '<tbody>',
        historyRows,
        '</tbody>',
        '</table>',
        sessions.length > 0
            ? `<p style="margin-top:0.75rem"><button class="btn btn--danger" data-action="reset-all">Reset All Data</button></p>`
            : '',
        '</section>',
    ].join('\n');
}
function buildGoalNotifications(review) {
    // Check which exercises hit or are close to their projected goal.
    // 90% of goal = "almost", >= goal = "met".
    const met = review
        .filter(c => c.goal > 0 && c.current >= c.goal)
        .map(c => c.exercise);
    const close = review
        .filter(c => c.goal > 0 && c.current >= c.goal * 0.9 && c.current < c.goal)
        .map(c => c.exercise);
    if (met.length === 0 && close.length === 0)
        return '';
    const metLine = met.length > 0
        ? `<p>Goal met for: <strong>${met.join(', ')}</strong></p>`
        : '';
    const closeLine = close.length > 0
        ? `<p>Almost at your goal for: <strong>${close.join(', ')}</strong></p>`
        : '';
    // Use "met" style if any goals met, otherwise "close"
    const cls = met.length > 0 ? 'goal-met' : 'goal-close';
    return `<div class="goal-notification goal-notification--${cls}">${metLine}${closeLine}</div>`;
}
function buildReview() {
    if (!review)
        return '';
    const notification = buildGoalNotifications(review);
    const rows = review.map(c => {
        const direction = c.change > 0 ? 'up' : c.change < 0 ? 'down' : 'even';
        const symbol = c.change > 0 ? '+' : '';
        // Use toFixed for clean display
        const changeDisplay = c.previous === 0
            ? 'new'
            : `${symbol}${c.change}%`;
        return `<tr class="row--${direction}">
      <td><strong>${c.exercise}</strong></td>
      <td>${c.unit}</td>
      <td>${c.previous || '-'}</td>
      <td><strong>${c.current}</strong></td>
      <td class="cell--${direction}">${changeDisplay}</td>
      <td>${c.goal} ${c.unit}</td>
    </tr>`;
    }).join('');
    return [
        '<header class="header">',
        '<h1 class="title">Session Complete</h1>',
        '<p class="subtitle">Here is how you did against your past self.</p>',
        '</header>',
        notification,
        '<section class="card-panel">',
        '<table class="data-table">',
        '<thead><tr><th>Exercise</th><th>Unit</th><th>Past Self</th><th>You Now</th><th>Change</th><th>Next Goal</th></tr></thead>',
        '<tbody>',
        rows,
        '</tbody>',
        '</table>',
        '</section>',
        '<section style="text-align:center; margin-top:1.5rem">',
        '<button class="btn btn--primary" data-action="back-to-dashboard">Back to Dashboard</button>',
        '</section>',
    ].join('\n');
}
// --- Event handling (event delegation) ---
document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target)
        return;
    const action = target.dataset.action;
    if (action === 'add-entry') {
        const select = document.getElementById('exercise-select');
        const input = document.getElementById('value-input');
        const name = select.value;
        const unit = select.options[select.selectedIndex].dataset.unit;
        const value = parseInt(input.value, 10);
        if (!name || isNaN(value) || value <= 0)
            return;
        pendingEntries = [...pendingEntries, { exercise: name, value, unit }];
        input.value = '';
        render();
    }
    if (action === 'remove-entry') {
        const exercise = target.dataset.exercise;
        // Remove the first matching entry from pendingEntries
        const idx = pendingEntries.findIndex(e => e.exercise === exercise);
        if (idx !== -1) {
            pendingEntries = pendingEntries.filter((_, i) => i !== idx);
        }
        render();
    }
    if (action === 'complete-session') {
        if (pendingEntries.length === 0)
            return;
        sessions = addSession(sessions, pendingEntries);
        review = compare(pendingEntries, sessions.slice(0, -1), rate);
        pendingEntries = [];
        save();
        render();
    }
    if (action === 'back-to-dashboard') {
        review = null;
        render();
    }
    if (action === 'change-rate') {
        const newRate = prompt('Enter new improvement rate (as percentage, e.g. 2 for 2%):', String(rate * 100));
        if (newRate === null)
            return;
        const parsed = parseFloat(newRate);
        if (isNaN(parsed) || parsed <= 0)
            return;
        rate = parsed / 100;
        save();
        render();
    }
    if (action === 'reset-all') {
        if (!confirm('Delete all session data? This cannot be undone.'))
            return;
        sessions = [];
        pendingEntries = [];
        review = null;
        save();
        render();
    }
});
// --- Initialization ---
load();
// Seed one benchmark session if empty (so the demo isn't blank)
if (sessions.length === 0) {
    sessions = [
        {
            id: crypto.randomUUID(),
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            entries: [
                { exercise: 'Push-ups', value: 40, unit: 'reps' },
                { exercise: 'Squats', value: 55, unit: 'reps' },
                { exercise: 'Plank', value: 60, unit: 'sec' },
            ],
        },
    ];
    save();
}
render();
