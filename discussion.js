'use strict';

const firstIdea = {
  id: 1, author: 'Maya', time: '10:12',
  body: 'AI tutors should give a hint before revealing the answer. That gives students a chance to finish the problem themselves.',
};
const peerExchange = [
  {id: 2, author: 'Leo', time: '10:13', parentId: 1, move: 'Question', body: 'Could a hint make things harder if the student has misunderstood the whole problem?'},
  {id: 3, author: 'Maya', time: '10:13', parentId: 2, move: 'Give a reason', body: 'It could. A first hint might work better if it asks the student to explain their starting point.'},
];
const questions = {
  reason: ['Give a reason', 'What makes this suggestion likely to help a student who is stuck?'],
  question: ['Question the idea', 'When might this suggestion fail? What would you want to ask the person who proposed it?'],
  extend: ['Build on the idea', 'How would you develop this suggestion into something the AI tutor could actually say or do?'],
};
const ratings = ['None', 'A little', 'A lot'];
const messages = document.querySelector('#messages');
const panel = document.querySelector('#side-panel');
const composer = document.querySelector('#composer');
const replayForm = document.querySelector('#replay-form');
const stateLabel = document.querySelector('#discussion-state');
const announcement = document.querySelector('#announcement');
let view = 'student';
let state;

function startReplay(startingPoint, condition) {
  const allowInvites = state?.allowInvites ?? true;
  const active = startingPoint === 'active';
  state = {
    replies: active ? [firstIdea, ...peerExchange] : [firstIdea],
    nextId: 4, active, condition, allowInvites,
    offer: active || !allowInvites ? 'quiet' : 'available',
    prompt: null, draft: null, invitationSeen: false,
    opened: false, repliesFromPrompt: 0, rating: '',
  };
}

function escapeHtml(value) {
  const symbols = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
  return String(value).replace(/[&<>"']/g, (character) => symbols[character]);
}

function byId(id) {
  return state.replies.find((reply) => reply.id === id);
}

function makeButton(action, text, {outline = false, value = '', pressed} = {}) {
  const style = outline ? ' class="button-outline"' : '';
  const toggle = pressed === undefined ? '' : ` aria-pressed="${pressed}"`;
  return `<button type="button" data-action="${action}" data-value="${escapeHtml(value)}"${style}${toggle}>${text}</button>`;
}

function renderDiscussion() {
  stateLabel.textContent = state.active ? 'Active exchange' : 'Idea awaiting a reply';
  stateLabel.classList.toggle('active', state.active);
  messages.innerHTML = state.replies.map((reply) => {
    const parent = byId(reply.parentId);
    const context = [parent ? `Reply to ${parent.author}` : '', reply.move].filter(Boolean).join(' · ');
    return `<li class="message">
      <span class="avatar ${reply.author[0]}" aria-hidden="true">${reply.author[0]}</span>
      <div>
        <strong>${reply.author}</strong> <span class="small">${reply.time}${context ? ` · ${escapeHtml(context)}` : ''}</span>
        <p class="body">${escapeHtml(reply.body)}</p>
        ${view === 'student' ? `<button type="button" class="reply-link" data-action="reply" data-value="${reply.id}" aria-label="Reply to ${reply.author} at ${reply.time}">Reply</button>` : ''}
      </div>
    </li>`;
  }).join('');
}

function renderComposer() {
  const draft = state.draft;
  composer.hidden = view !== 'student' || !draft;
  if (composer.hidden) {
    composer.replaceChildren();
    return;
  }
  const parent = byId(draft.sourceId);
  composer.innerHTML = `<form id="reply-form">
    <label for="reply-body">${parent ? `Reply to ${parent.author}` : 'Add to the discussion'}</label>
    <p class="small">Your reply will appear in the group discussion when you share it.</p>
    <textarea id="reply-body" name="body" required maxlength="1600" placeholder="Write your response">${escapeHtml(draft.body)}</textarea>
    <div class="actions">
      <button type="submit">Share reply</button>
      ${makeButton('discard-draft', 'Discard draft', {outline:true})}
    </div>
  </form>`;
}

function renderInvitation() {
  if (state.prompt) {
    const {sourceId, move} = state.prompt;
    const source = byId(sourceId);
    const content = source
      ? `<h3>Respond to a peer’s idea</h3>
        <blockquote><p>${escapeHtml(source.body)}</p><cite>${source.author} · ${source.time}</cite></blockquote>
        <p>${questions[move][1]}</p>
        <div class="actions">${Object.entries(questions).map(([key, [label]]) =>
          makeButton('move', label, {outline:key !== move, value:key, pressed:key === move})).join('')}</div>`
      : '<h3>General invitation</h3><p>Is there anything you would like to add to the discussion?</p>';
    return `<section class="invitation" aria-label="Private prompt">
      ${content}
      <div class="actions">${makeButton('use-prompt', 'Draft a reply')}${makeButton('dismiss', 'Dismiss prompt', {outline:true})}</div>
    </section>`;
  }
  if (state.offer === 'available') {
    return `<section class="invitation" aria-label="Invitation">
      <h3>An idea is open for discussion</h3>
      <p>Would you like help starting a reply?</p>
      <div class="actions">${makeButton('open-prompt', 'Show me a prompt')}${makeButton('dismiss', 'Not now', {outline:true})}</div>
    </section>`;
  }
  const note = {
    stale: state.draft ? 'The discussion moved on. You can still edit your draft.' : 'The discussion moved on. You can ask for a new prompt.',
    dismissed: 'The invitation has closed.',
    used: 'Your reply is in the discussion.',
    quiet: state.active ? 'The group is exchanging ideas. Automatic invitations are paused.' : 'Automatic invitations are off.',
  }[state.offer];
  return `<section><p>${note}</p><div class="actions">${makeButton('open-prompt', 'Ask for a prompt', {outline:true})}</div></section>`;
}

function renderStudent() {
  const feedback = state.invitationSeen || state.opened ? `<section>
    <h3>How interruptive was the support?</h3>
    <div class="actions">${ratings.map((rating) => makeButton('rate', rating, {outline:state.rating !== rating, value:rating, pressed:state.rating === rating})).join('')}</div>
    <dl class="metrics">
      <div><dt>Prompt opened</dt><dd>${state.opened ? 'Yes' : 'No'}</dd></div>
      <div><dt>Replies drafted from a prompt and shared</dt><dd>${state.repliesFromPrompt}</dd></div>
    </dl>
  </section>` : '';
  return `<p class="eyebrow">Private student tools</p>
    <h2 id="role-title">Your discussion support</h2>
    ${renderInvitation()}
    <section><label class="preference"><input id="allow-invites" type="checkbox"${state.allowInvites ? ' checked' : ''}> Offer a private prompt when an idea is waiting for a reply</label></section>
    ${feedback}`;
}

function renderFacilitator() {
  const students = state.replies.filter((reply) => reply.author === 'Ari').length;
  const linked = state.replies.filter((reply) => reply.parentId).length;
  return `<p class="eyebrow">Facilitator view</p>
    <h2 id="role-title">Discussion state</h2>
    <p>${state.active ? 'The group is exchanging ideas. Automatic invitations are paused.' : 'Maya’s idea is awaiting a reply. Students may receive a private invitation if enabled.'}</p>
    ${state.active ? '' : `<div class="actions">${makeButton('advance', 'Replay peer replies')}</div>`}
    <dl class="metrics">
      <div><dt>Messages</dt><dd>${state.replies.length}</dd></div>
      <div><dt>Linked replies</dt><dd>${linked}</dd></div>
      <div><dt>Student contributions</dt><dd>${students}</dd></div>
    </dl>`;
}

function render() {
  for (const tab of document.querySelectorAll('[data-view]')) {
    tab.setAttribute('aria-pressed', tab.dataset.view === view);
  }
  if (view === 'student' && state.offer === 'available') state.invitationSeen = true;
  panel.hidden = view === 'group';
  panel.innerHTML = view === 'student' ? renderStudent() : view === 'facilitator' ? renderFacilitator() : '';
  renderDiscussion();
  renderComposer();
}

function focusAfterRender(selector) {
  const next = document.querySelector(selector);
  if (!next) return;
  if (!next.matches('button, input, textarea, select, a')) next.tabIndex = -1;
  next.focus();
}

function say(message) {
  announcement.textContent = message;
}

function draftReply(sourceId, move, fromPrompt = false) {
  state.draft = {sourceId, move, fromPrompt, body: state.draft?.body ?? ''};
  render();
  focusAfterRender('#reply-body');
}

function startExchange() {
  state.active = true;
  if (state.offer === 'available' || state.prompt) {
    state.offer = 'stale';
    state.prompt = null;
  }
}

function shareReply() {
  const {body, sourceId, move, fromPrompt} = state.draft;
  if (!body.trim()) {
    say('Write a message before sharing.');
    return;
  }
  state.replies.push({
    id: state.nextId++, author: 'Ari', time: 'Now', body: body.trim(),
    parentId: sourceId, move: fromPrompt && sourceId ? questions[move][0] : '',
  });
  if (fromPrompt) state.repliesFromPrompt += 1;
  state.draft = null;
  startExchange();
  state.offer = 'used';
  render();
  focusAfterRender('#conversation-title');
  say('Reply shared with the group.');
}

const studentActions = {
  'open-prompt': () => {
    const source = state.condition === 'contextual' ? state.replies.findLast((reply) => reply.author !== 'Ari') : null;
    state.prompt = {sourceId: source?.id, move: 'reason'};
    state.opened = true;
    return '[data-action="use-prompt"]';
  },
  move: (key) => {
    state.prompt.move = key;
    say(questions[key][1]);
    return `[data-action="move"][data-value="${key}"]`;
  },
  'use-prompt': () => draftReply(state.prompt.sourceId, state.prompt.move, true),
  dismiss: () => {
    state.offer = 'dismissed';
    state.prompt = null;
    say('Invitation closed.');
    return '[data-action="open-prompt"]';
  },
  reply: (id) => draftReply(Number(id), ''),
  'discard-draft': () => {
    state.draft = null;
    say('Draft discarded.');
    return '#conversation-title';
  },
  rate: (rating) => {
    state.rating = rating;
    say('Feedback recorded for this replay.');
    return `[data-action="rate"][data-value="${rating}"]`;
  },
};

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const {view: nextView, action, value} = button.dataset;
  if (nextView) {
    view = nextView;
    render();
    return;
  }
  if (view === 'facilitator' && action === 'advance' && !state.active) {
    state.replies.push(...peerExchange);
    startExchange();
    render();
    focusAfterRender('#role-title');
    say('Peer replies added. Automatic invitations paused.');
    return;
  }
  if (view === 'student' && Object.hasOwn(studentActions, action)) {
    const focusTarget = studentActions[action](value);
    if (focusTarget) {
      render();
      focusAfterRender(focusTarget);
    }
  }
});

document.addEventListener('input', (event) => {
  if (event.target.id === 'reply-body') state.draft.body = event.target.value;
});

document.addEventListener('change', (event) => {
  if (event.target.id !== 'allow-invites' || view !== 'student') return;
  state.allowInvites = event.target.checked;
  if (!state.allowInvites && state.offer === 'available') state.offer = 'quiet';
  if (state.allowInvites && !state.active && state.offer === 'quiet') state.offer = 'available';
  render();
  focusAfterRender('#allow-invites');
});

document.addEventListener('submit', (event) => {
  if (event.target === replayForm) {
    event.preventDefault();
    const input = new FormData(replayForm);
    startReplay(input.get('startingPoint'), input.get('promptType'));
    render();
    say('New replay ready.');
  }
  if (event.target.id === 'reply-form' && view === 'student') {
    event.preventDefault();
    shareReply();
  }
});

startReplay('unanswered', 'contextual');
render();
