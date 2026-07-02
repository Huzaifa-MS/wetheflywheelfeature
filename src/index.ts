// ================================================================
// index.ts
//
// Entry point. Wires state management, pipeline logic, and rendering.
// Uses event delegation for clean UI interaction.
// ================================================================

import type { Item } from './pipeline.js';
import type { Event } from './state-machine.js';
import { addItem, applyEvent, removeItem } from './pipeline.js';
import { render } from './render.js';

// --- Mutable shell around immutable core -------------------------

let items: Item[] = [];

// --- Event delegation (single listener, no per-button binding) ---

document.addEventListener('click', (e) => {
  const target = (e.target as HTMLElement).closest('[data-id][data-event]') as HTMLElement | null;
  if (!target) return;

  const id    = target.dataset.id!;
  const event = target.dataset.event!;

  if (event === 'remove') {
    items = removeItem(items, id);
  } else {
    items = applyEvent(items, id, event as Event);
  }

  render(items);
});

// --- Form submission ---------------------------------------------

document.addEventListener('submit', (e) => {
  const form = e.target as HTMLFormElement;
  if (form.id !== 'form-add') return;

  e.preventDefault();
  const input = document.getElementById('input-task') as HTMLInputElement;
  const label = input.value.trim();
  if (!label) return;

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
