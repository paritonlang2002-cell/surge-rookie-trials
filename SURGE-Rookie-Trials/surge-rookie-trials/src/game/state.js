export const STATES = Object.freeze({
  START: 'START', TUTORIAL: 'TUTORIAL', TRIAL_1: 'TRIAL_1',
  TRIAL_2: 'TRIAL_2', RESULTS: 'RESULTS', PAUSED: 'PAUSED'
});

export function createStateMachine(onChange = () => {}) {
  let state = STATES.START;
  let previousTrial = STATES.TRIAL_1;
  return {
    get current() { return state; },
    get previousTrial() { return previousTrial; },
    transition(next) {
      if (!Object.values(STATES).includes(next)) return false;
      if (next === STATES.PAUSED && (state === STATES.TRIAL_1 || state === STATES.TRIAL_2)) {
        previousTrial = state;
      }
      const old = state;
      state = next;
      onChange(next, old);
      return true;
    },
    resume() {
      const old = state;
      state = previousTrial;
      onChange(state, old);
    },
    restart() { this.transition(STATES.START); }
  };
}