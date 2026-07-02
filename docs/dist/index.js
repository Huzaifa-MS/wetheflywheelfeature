// ================================================================
// index.ts
//
// Entry point. Wires state management, pipeline logic, and rendering.
// Uses event delegation for clean UI interaction.
// ================================================================
import { addItem, applyEvent, removeItem } from './pipeline.js';
import { render } from './render.js';
// --- Mutable shell around immutable core -------------------------
let items = [];
// --- Event delegation (single listener, no per-button binding) ---
document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-id][data-event]');
    if (!target)
        return;
    const id = target.dataset.id;
    const event = target.dataset.event;
    if (event === 'remove') {
        items = removeItem(items, id);
    }
    else {
        items = applyEvent(items, id, event);
    }
    render(items);
});
// --- Form submission ---------------------------------------------
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
// --- Seed data (for a non-empty first render) --------------------
const seedLabels = [
    'Design the UI layout',
    'Implement state machine',
    'Write pipeline functions (map, filter, reduce)',
    'Add error handling and edge cases',
    'Deploy to production',
];
items = seedLabels.reduce(addItem, items);
// --- Initial render ----------------------------------------------
render(items);
