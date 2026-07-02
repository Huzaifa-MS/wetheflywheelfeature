// ================================================================
// pipeline.ts
//
// Functional pipeline for managing task items.
// Every function is pure — returns new arrays/records without mutation.
// Demonstrates map, filter, and reduce.
// ================================================================
import { transition } from './state-machine.js';
// --- Constructors --------------------------------------------------
// item — creates a single new item in the pending state.
function item(label) {
    return {
        id: crypto.randomUUID(),
        label,
        state: 'pending',
        createdAt: Date.now(),
    };
}
// --- Pure functions on Item[] --------------------------------------
// addItem — appends a new pending item. Uses spread for immutability.
function addItem(items, label) {
    return [...items, item(label)];
}
// applyEvent — transitions one item by id. Uses map for immutability.
function applyEvent(items, id, event) {
    return items.map(i => i.id === id ? { ...i, state: transition(i.state, event) } : i);
}
// removeItem — removes one item by id. Uses filter for immutability.
function removeItem(items, id) {
    return items.filter(i => i.id !== id);
}
// countByState — tallies items per state. Uses reduce.
function countByState(items) {
    return items.reduce((acc, i) => {
        acc[i.state] = (acc[i.state] ?? 0) + 1;
        return acc;
    }, {});
}
// itemsByState — groups items by their current state. Uses reduce.
function itemsByState(items) {
    return items.reduce((acc, i) => {
        const group = acc[i.state] ?? [];
        acc[i.state] = [...group, i];
        return acc;
    }, {});
}
export { addItem, applyEvent, removeItem, countByState, itemsByState };
