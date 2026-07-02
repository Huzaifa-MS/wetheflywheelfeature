// ================================================================
// render.ts
//
// Procedural DOM rendering. Side-effectful by nature.
// Separated from state logic to keep concerns clearly divided.
// ================================================================

import type { Item } from './pipeline.js';
import type { State, Event } from './state-machine.js';
import { allowedEvents } from './state-machine.js';
import { countByState, itemsByState } from './pipeline.js';

// --- Constants ----------------------------------------------------

const STATE_LABEL: Record<State, string> = {
  pending:    'Pending',
  processing: 'Processing',
  completed:  'Completed',
  failed:     'Failed',
  cancelled:  'Cancelled',
};

const STATE_ORDER: State[] = [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
];

// --- Render (entry point, procedural) -----------------------------

function render(items: Item[]): void {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = buildPage(items);
}

// --- HTML builders (pure functions returning strings) -------------

function buildPage(items: Item[]): string {
  const grouped = itemsByState(items);
  const counts  = countByState(items);

  return `
    <header class="header">
      <h1 class="title">Task Pipeline Demo</h1>
      <p class="subtitle">Finite State Machine + Functional Programming (map / filter / reduce / immutability)</p>
    </header>

    <section class="controls">
      <form id="form-add">
        <input id="input-task" class="input" type="text" placeholder="Enter task name..." required autofocus />
        <button class="btn btn--primary" type="submit">Add Task</button>
      </form>
    </section>

    <section class="stats-bar">
      ${buildStats(counts, items.length)}
    </section>

    <section class="pipeline">
      ${STATE_ORDER.map(s => buildColumn(s, grouped[s] ?? [])).join('')}
    </section>
  `;
}

function buildStats(counts: Record<State, number>, total: number): string {
  const stateStats = STATE_ORDER.map(s =>
    `<span class="stat stat--${s}">${STATE_LABEL[s]}: ${counts[s] ?? 0}</span>`
  ).join('');

  return `${stateStats}<span class="stat stat--total">Total: ${total}</span>`;
}

function buildColumn(state: State, items: Item[]): string {
  const events = allowedEvents(state);

  return `
    <div class="column column--${state}">
      <h2 class="column-heading">${STATE_LABEL[state]}</h2>
      <div class="card-list">
        ${items.length === 0
          ? '<p class="empty">No tasks</p>'
          : items.map(i => buildCard(i, events)).join('')
        }
      </div>
    </div>
  `;
}

function buildCard(item: Item, events: Event[]): string {
  const actionButtons = events.map(e =>
    `<button class="btn btn--action btn--${e}" data-id="${item.id}" data-event="${e}">${e}</button>`
  ).join('');

  return `
    <div class="card">
      <span class="card-label">${escapeHTML(item.label)}</span>
      <div class="card-actions">
        ${actionButtons}
        <button class="btn btn--remove" data-id="${item.id}" data-event="remove">Remove</button>
      </div>
    </div>
  `;
}

// --- Utility -------------------------------------------------------

function escapeHTML(text: string): string {
  const el = document.createElement('div');
  el.textContent = text;
  return el.innerHTML;
}

export { render };
