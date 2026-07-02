"use strict";
// ================================================================
// Task Pipeline Demo
//
// Procedural flow with functional data operations.
//
// Mental model — tasks flow through statuses via actions:
//   pending → start → processing → complete → completed
//   pending → cancel → cancelled
//   processing → fail → failed → retry → pending
//
// Functional style: map, filter, reduce on immutable data
// Procedural style: clear top-to-bottom flow
// Event delegation: single listener for all UI interactions
// ================================================================
// --- Status transitions (procedural, no abstraction) ---
const STATUS_ORDER = [
    'pending', 'processing', 'completed', 'failed', 'cancelled',
];
const STATUS_LABEL = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
};
function nextStatus(current, action) {
    if (current === 'pending') {
        if (action === 'start')
            return 'processing';
        if (action === 'cancel')
            return 'cancelled';
    }
    if (current === 'processing') {
        if (action === 'complete')
            return 'completed';
        if (action === 'fail')
            return 'failed';
        if (action === 'cancel')
            return 'cancelled';
    }
    if (current === 'failed') {
        if (action === 'retry')
            return 'pending';
        if (action === 'cancel')
            return 'cancelled';
    }
    return current;
}
function actionsFor(status) {
    if (status === 'pending')
        return ['start', 'cancel'];
    if (status === 'processing')
        return ['complete', 'fail', 'cancel'];
    if (status === 'failed')
        return ['retry', 'cancel'];
    return [];
}
// --- Data operations (functional: map, filter, reduce, immutability) ---
function addItem(items, label) {
    const item = {
        id: crypto.randomUUID(),
        label,
        status: 'pending',
        createdAt: Date.now(),
    };
    return [...items, item];
}
function applyAction(items, id, action) {
    return items.map(item => item.id === id
        ? { ...item, status: nextStatus(item.status, action) }
        : item);
}
function removeItem(items, id) {
    return items.filter(item => item.id !== id);
}
function countByStatus(items) {
    return items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1;
        return acc;
    }, {});
}
function groupByStatus(items) {
    return items.reduce((acc, item) => {
        const group = acc[item.status] ?? [];
        acc[item.status] = [...group, item];
        return acc;
    }, {});
}
// --- Rendering ---
function render(items) {
    const app = document.getElementById('app');
    if (!app)
        return;
    app.innerHTML = buildPage(items);
}
function buildPage(items) {
    const grouped = groupByStatus(items);
    const counts = countByStatus(items);
    return [
        '<header class="header">',
        '<h1 class="title">Task Pipeline Demo</h1>',
        '<p class="subtitle">Procedural + Functional Programming (map / filter / reduce / immutability)</p>',
        '</header>',
        '<section class="controls">',
        '<form id="form-add">',
        '<input id="input-task" class="input" type="text" placeholder="Enter task name..." required autofocus />',
        '<button class="btn btn--primary" type="submit">Add Task</button>',
        '</form>',
        '</section>',
        '<section class="stats-bar">',
        buildStats(counts, items.length),
        '</section>',
        '<section class="pipeline">',
        STATUS_ORDER.map(s => buildColumn(s, grouped[s] ?? [])).join(''),
        '</section>',
    ].join('\n');
}
function buildStats(counts, total) {
    const parts = STATUS_ORDER.map(s => `<span class="stat stat--${s}">${STATUS_LABEL[s]}: ${counts[s] ?? 0}</span>`);
    parts.push(`<span class="stat stat--total">Total: ${total}</span>`);
    return parts.join('');
}
function buildColumn(status, items) {
    const actions = actionsFor(status);
    const cards = items.length === 0
        ? '<p class="empty">No tasks</p>'
        : items.map(i => buildCard(i, actions)).join('');
    return [
        `<div class="column column--${status}">`,
        `<h2 class="column-heading">${STATUS_LABEL[status]}</h2>`,
        '<div class="card-list">',
        cards,
        '</div>',
        '</div>',
    ].join('');
}
function buildCard(item, actions) {
    const buttons = actions.map(a => `<button class="btn btn--action btn--${a}" data-id="${item.id}" data-action="${a}">${a}</button>`).join('');
    return [
        '<div class="card">',
        `<span class="card-label">${escapeHTML(item.label)}</span>`,
        '<div class="card-actions">',
        buttons,
        `<button class="btn btn--remove" data-id="${item.id}" data-action="remove">Remove</button>`,
        '</div>',
        '</div>',
    ].join('');
}
function escapeHTML(text) {
    const el = document.createElement('div');
    el.textContent = text;
    return el.innerHTML;
}
// --- Event handling (event delegation) ---
let items = [];
document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-id][data-action]');
    if (!target)
        return;
    const id = target.dataset.id;
    const action = target.dataset.action;
    if (action === 'remove') {
        items = removeItem(items, id);
    }
    else {
        items = applyAction(items, id, action);
    }
    render(items);
});
document.addEventListener('submit', (e) => {
    const form = e.target;
    if (form.id !== 'form-add')
        return;
    e.preventDefault();
    const input = document.getElementById('input-task');
    const label = input.value.trim();
    if (!label)
        return;
    items = addItem(items, label);
    input.value = '';
    render(items);
});
// --- Seed data ---
const seedLabels = [
    'Design the UI layout',
    'Write data operations (map, filter, reduce)',
    'Add event delegation',
    'Style the pipeline columns',
    'Deploy to Cloudflare Pages',
];
items = seedLabels.reduce(addItem, items);
render(items);
