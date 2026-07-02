// ================================================================
// pipeline.ts
//
// Functional pipeline for managing task items.
// Every function is pure — returns new arrays/records without mutation.
// Demonstrates map, filter, and reduce.
// ================================================================

import type { State, Event } from './state-machine.js';
import { transition } from './state-machine.js';

// --- Types --------------------------------------------------------

interface Item {
  id: string;
  label: string;
  state: State;
  createdAt: number;
}

// --- Constructors --------------------------------------------------

// item — creates a single new item in the pending state.
function item(label: string): Item {
  return {
    id: crypto.randomUUID(),
    label,
    state: 'pending',
    createdAt: Date.now(),
  };
}

// --- Pure functions on Item[] --------------------------------------

// addItem — appends a new pending item. Uses spread for immutability.
function addItem(items: Item[], label: string): Item[] {
  return [...items, item(label)];
}

// applyEvent — transitions one item by id. Uses map for immutability.
function applyEvent(items: Item[], id: string, event: Event): Item[] {
  return items.map(i => i.id === id ? { ...i, state: transition(i.state, event) } : i);
}

// removeItem — removes one item by id. Uses filter for immutability.
function removeItem(items: Item[], id: string): Item[] {
  return items.filter(i => i.id !== id);
}

// countByState — tallies items per state. Uses reduce.
function countByState(items: Item[]): Record<State, number> {
  return items.reduce<Record<State, number>>((acc, i) => {
    acc[i.state] = (acc[i.state] ?? 0) + 1;
    return acc;
  }, {} as Record<State, number>);
}

// itemsByState — groups items by their current state. Uses reduce.
function itemsByState(items: Item[]): Record<State, Item[]> {
  return items.reduce<Record<State, Item[]>>((acc, i) => {
    const group = acc[i.state] ?? [];
    acc[i.state] = [...group, i];
    return acc;
  }, {} as Record<State, Item[]>);
}

export type { Item };
export { addItem, applyEvent, removeItem, countByState, itemsByState };
