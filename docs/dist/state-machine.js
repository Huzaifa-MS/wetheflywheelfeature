// ================================================================
// state-machine.ts
//
// A deterministic finite state machine for task lifecycle.
//
// State diagram:
//
//   pending ──start──→ processing ──complete──→ completed
//      │                    │
//      ├──cancel──→ cancelled     ├──fail──→ failed
//      │                           │
//      │                     └──retry──→ pending
//      │                           │
//      └──cancel───────────────────→ cancelled
//
// Core principle: transition(state, event) → newState   (pure function)
// ================================================================
// Transition table — single source of truth.
// Key: current state. Value: allowed events mapped to next states.
// An event not listed for a given state is disallowed.
const table = {
    pending: { start: 'processing', cancel: 'cancelled' },
    processing: { complete: 'completed', fail: 'failed', cancel: 'cancelled' },
    completed: {},
    failed: { retry: 'pending', cancel: 'cancelled' },
    cancelled: {},
};
// transition — pure function.
// Returns the next state given current state and event.
// If the event is not allowed in the current state, returns the current state unchanged
// (no-op instead of throwing, making the machine defensive by default).
function transition(state, event) {
    return table[state]?.[event] ?? state;
}
// allowedEvents — pure function.
// Returns the list of events that can be applied to the given state.
function allowedEvents(state) {
    return Object.keys(table[state]);
}
export { transition, allowedEvents };
