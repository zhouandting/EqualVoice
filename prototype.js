'use strict';

const scenarios = {
  floor: 'Request a turn and see how the facilitator handles a possible pause.',
  repair: 'Reply to an optional offer and see how the system handles uncertainty.',
  prompt: 'Compare two private invitations to contribute to the same discussion.',
};
const roleNames = {student: 'Student B', host: 'Facilitator', shared: 'Group display'};
const roleChannels = {student: 'Private student view', host: 'Facilitator view', shared: 'Shared with the group'};
const peerIdea = 'AI tutors should offer a hint before revealing the answer.';
let role = 'student';
let scenario = 'floor';
let state;

function initialState() {
  return {
    floor: 'speaking', request: 'none', offer: scenario === 'repair' ? 'available' : 'off',
    prompt: 'none', studentFeedback: '', hostFeedback: '',
  };
}

function loadScenario(selected) {
  scenario = selected;
  role = 'student';
  state = initialState();
}

function sendRequest() {
  state.request = 'pending';
  state.offer = 'off';
  state.studentFeedback = 'Request sent to the facilitator. You can cancel while you wait.';
  state.hostFeedback = '';
}

const actions = {
  reset: () => loadScenario(scenario),
  student: () => { role = 'student'; },
  host: () => { role = 'host'; },
  shared: () => { role = 'shared'; },
  request: () => {
    if (role === 'student' && state.request === 'none' && state.offer !== 'clarify') sendRequest();
  },
  confirm: () => {
    if (role === 'student' && state.offer === 'clarify' && state.request === 'none') sendRequest();
  },
  maybe: () => {
    if (role === 'student' && state.offer === 'available') state.offer = 'clarify';
  },
  later: () => {
    if (role !== 'student' || state.offer !== 'clarify') return;
    state.offer = 'off';
    state.studentFeedback = 'No request sent. You can request a turn any time.';
  },
  cancel: () => {
    if (role !== 'student' || state.request !== 'pending') return;
    state.request = 'none';
    state.studentFeedback = 'Request cancelled. The facilitator queue is clear.';
    state.hostFeedback = 'The student cancelled their request.';
  },
  pause: () => {
    if (role !== 'host' || state.request !== 'pending' || state.floor !== 'speaking') return;
    state.floor = 'possible';
    state.hostFeedback = '';
  },
  hold: () => {
    if (role !== 'host' || state.request !== 'pending' || state.floor !== 'possible') return;
    state.floor = 'speaking';
    state.hostFeedback = 'Turn held. B’s request is still waiting.';
  },
  finished: () => {
    if (role !== 'host' || state.request !== 'pending' || state.floor === 'ready') return;
    state.floor = 'ready';
    state.hostFeedback = 'Speaker marked finished.';
  },
  open: () => {
    if (role !== 'host' || state.request !== 'pending' || state.floor !== 'ready') return;
    state.request = 'invited';
    state.studentFeedback = 'The facilitator opened a turn for you. You can pass.';
    state.hostFeedback = 'The group display shows that a turn is open.';
  },
  pass: () => {
    if (role !== 'student' || state.request !== 'invited') return;
    state.request = 'none';
    state.studentFeedback = 'You passed. The invitation has closed.';
    state.hostFeedback = 'The student passed.';
  },
  contextual: () => {
    if (role === 'student' && scenario === 'prompt') state.prompt = 'contextual';
  },
  general: () => {
    if (role === 'student' && scenario === 'prompt') state.prompt = 'general';
  },
  dismiss: () => {
    if (role === 'student' && state.prompt !== 'none') {
      state.prompt = 'none';
      state.studentFeedback = 'Prompt dismissed.';
    }
  },
};

function button(action, label, secondary = false, disabled = false) {
  return `<button data-action="${action}"${secondary ? ' class="secondary"' : ''}${disabled ? ' disabled' : ''}>${label}</button>`;
}

function controls(...contents) {
  return `<div class="controls">${contents.join('')}</div>`;
}

function studentPanel() {
  const feedback = state.studentFeedback ? `<p class="message">${state.studentFeedback}</p>` : '';
  if (state.request === 'pending') return feedback + controls(button('cancel', 'Cancel request', true));
  if (state.request === 'invited') return feedback + controls(button('pass', 'Pass', true));

  if (state.offer === 'available') {
    return '<p class="message">The sample discussion record shows 15 seconds of speaking time for you. Would you like help getting a turn?</p>' +
      controls(button('request', 'Send a request'), button('maybe', 'Maybe later', true));
  }
  if (state.offer === 'clarify') {
    return '<p class="message">Should I ask the facilitator to give you a turn after Maya finishes?</p>' +
      '<p class="hint">No request has been sent.</p>' + controls(button('confirm', 'Yes, send it'), button('later', 'Not now', true));
  }

  if (scenario === 'prompt') {
    const prompt = {
      contextual: `<blockquote>${peerIdea}<br><strong>Source · Maya</strong></blockquote>` +
        '<p>When might a hint make it easier or harder for a student to solve the problem independently?</p>',
      general: '<p class="message">Is there anything you would like to add to the discussion?</p>',
      none: '',
    }[state.prompt];
    return (prompt || feedback) + '<p class="hint">Simulated invitation. Visible here only.</p>' + controls(
      button('contextual', 'Use a peer’s idea', state.prompt === 'contextual'),
      button('general', 'Try a general invitation', state.prompt !== 'general'),
      state.prompt === 'none' ? button('request', 'Request a turn', true) : button('dismiss', 'Dismiss prompt', true),
    );
  }
  return (feedback || '<p class="message">Request a turn when you have something to add.</p>') + controls(button('request', 'Request a turn'));
}

function hostPanel() {
  const feedback = state.hostFeedback ? `<p class="hint">${state.hostFeedback}</p>` : '';
  if (state.request === 'none') return '<p class="message">No requests are waiting.</p>' + feedback;
  if (state.request === 'invited') return '<p class="message">A turn has been opened for Student B.</p>' + feedback;
  const status = {
    speaking: 'Maya is still speaking.',
    possible: 'A pause was flagged. Maya may still be speaking.',
    ready: 'Maya has been marked finished.',
  }[state.floor];
  return '<p class="message"><strong>Student B requested a turn.</strong></p>' + `<p class="hint">${status}</p>` + feedback + controls(
    state.floor === 'speaking' ? button('pause', 'Simulate a pause', true) : '',
    state.floor === 'possible' ? button('hold', 'Hold', true) : '',
    state.floor === 'ready' ? '' : button('finished', 'Mark speaker finished', true),
    button('open', 'Open turn', false, state.floor !== 'ready'),
  );
}

function sharedPanel() {
  return state.request === 'invited'
    ? '<p class="message"><strong>A turn is open for another contribution.</strong></p>'
    : '<p class="message">Discussion in progress.</p>';
}

const select = document.querySelector('#scenario');
const roleTitle = document.querySelector('#role-title');
const roleContent = document.querySelector('#role-content');

function render() {
  select.value = scenario;
  document.querySelector('#scenario-description').textContent = scenarios[scenario];
  document.querySelector('#floor-state').textContent = {
    speaking: 'Maya has the floor.', possible: 'Maya has the floor.', ready: 'Maya’s turn has ended.',
  }[state.floor];
  document.querySelector('#role-channel').textContent = roleChannels[role];
  roleTitle.textContent = roleNames[role];
  for (const tab of document.querySelectorAll('.roles button')) {
    tab.setAttribute('aria-pressed', tab.dataset.action === role);
  }
  roleContent.innerHTML = {student: studentPanel, host: hostPanel, shared: sharedPanel}[role]();
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('button[data-action]');
  if (!target || target.disabled) return;
  const action = target.dataset.action;
  actions[action]();
  render();
  if (!target.isConnected) {
    const replacement = roleContent.querySelector(`button[data-action="${action}"]:not(:disabled)`) ||
      roleContent.querySelector('button:not(:disabled)');
    if (replacement) replacement.focus();
    else {
      roleTitle.tabIndex = -1;
      roleTitle.focus();
    }
  }
  document.querySelector('#announcement').textContent = `${roleNames[role]}. ${roleContent.querySelector('.message, blockquote')?.textContent ?? ''}`;
});

select.addEventListener('change', () => {
  loadScenario(select.value);
  render();
});

loadScenario(scenario);
render();
