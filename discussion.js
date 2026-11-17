'use strict';

const questions = {
  reason: ['Give a reason', 'What reason or example would help the group assess this idea?'],
  question: ['Question the idea', 'When might this suggestion fail? What would you want to ask the person who proposed it?'],
  extend: ['Build on the idea', 'What would you add to this idea to make it more specific or practical?'],
};
const ratings = ['None', 'A little', 'A lot'];
const messages = document.querySelector('#messages');
const panel = document.querySelector('#side-panel');
const composer = document.querySelector('#composer');
const replayForm = document.querySelector('#replay-form');
const setupPage = document.querySelector('#discussion-setup');
const sessionPage = document.querySelector('#discussion-session');
const startingPoint = document.querySelector('#starting-point');
const topicInput = document.querySelector('#custom-topic');
const notesInput = document.querySelector('#prior-notes');
const sessionNotes = document.querySelector('#discussion-notes');
const topicHeading = document.querySelector('#discussion-topic');
const stateLabel = document.querySelector('#discussion-state');
const announcement = document.querySelector('#announcement');
let view = 'student';
let state;

function startDiscussion(topic, start, condition, customTopic, notes) {
  const allowInvites = state?.allowInvites ?? true;
  const examplePosts = topic ? [topic.first, ...topic.replies].map((post) => ({
    ...post, time: topic.group === 'previous' ? 'Earlier example' : 'Example post',
  })) : [];
  const seedCount = {empty: 0, unanswered: 1, active: examplePosts.length}[start];
  const replies = examplePosts.slice(0, seedCount);
  state = {
    topic: topic?.title ?? customTopic, notes, replies,
    exampleReplies: start === 'unanswered' ? examplePosts.slice(1) : [],
    nextId: 1 + Math.max(0, ...examplePosts.map((post) => post.id)),
    condition, allowInvites,
    offer: seedCount === 1 && allowInvites ? 'available' : 'quiet',
    prompt: null, draft: null, invitationSeen: false,
    opened: false, repliesFromPrompt: 0, rating: '',
  };
  view = replies.length ? 'student' : 'facilitator';
  sessionNotes.open = false;
}

function escapeHtml(value) {
  const symbols = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
  return String(value).replace(/[&<>"']/g, (character) => symbols[character]);
}

function byId(id) {
  return state.replies.find((reply) => reply.id === id);
}

function discussionStatus() {
  const idea = state.replies.findLast((reply) => !reply.student && !reply.parentId);
  if (!idea) return {kind: 'empty', idea};
  const addressed = state.replies.some((reply) => reply.parentId === idea.id);
  return {kind: addressed ? 'active' : 'waiting', idea};
}

function makeButton(action, text, {outline = false, value = '', pressed} = {}) {
  const style = outline ? ' class="button-outline"' : '';
  const toggle = pressed === undefined ? '' : ` aria-pressed="${pressed}"`;
  return `<button type="button" data-action="${action}" data-value="${escapeHtml(value)}"${style}${toggle}>${text}</button>`;
}

function renderDiscussion({kind}) {
  topicHeading.textContent = state.topic;
  stateLabel.textContent = {empty: 'No posts yet', waiting: 'No reply yet', active: 'Replies have started'}[kind];
  stateLabel.classList.toggle('active', kind === 'active');
  sessionNotes.hidden = !state.notes;
  document.querySelector('#notes-text').textContent = state.notes;
  document.querySelector('#empty-discussion').hidden = state.replies.length > 0;
  messages.innerHTML = state.replies.map((reply) => {
    const parent = byId(reply.parentId);
    const context = [parent ? `Reply to ${parent.author}` : '', reply.move].filter(Boolean).join(' · ');
    const author = escapeHtml(reply.author);
    const avatarStyle = reply.student ? ' A' : reply.author === 'Leo' ? ' L' : '';
    return `<li class="message">
      <span class="avatar${avatarStyle}" aria-hidden="true">${escapeHtml(reply.author[0])}</span>
      <div>
        <strong>${author}</strong> <span class="small">${reply.time}${context ? ` · ${escapeHtml(context)}` : ''}</span>
        <p class="body">${escapeHtml(reply.body)}</p>
        ${view === 'student' ? `<button type="button" class="reply-link" data-action="reply" data-value="${reply.id}" aria-label="Reply to ${author} at ${reply.time}">Reply</button>` : ''}
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
    <label for="reply-body">${parent ? `Reply to ${escapeHtml(parent.author)}` : 'Add to the discussion'}</label>
    <p class="small">Your reply will appear in the group discussion when you share it.</p>
    <textarea id="reply-body" name="body" required maxlength="1600" placeholder="Write your response">${escapeHtml(draft.body)}</textarea>
    <div class="actions">
      <button type="submit">Share reply</button>
      ${makeButton('discard-draft', 'Discard draft', {outline:true})}
    </div>
  </form>`;
}

function renderInvitation({kind}) {
  if (kind === 'empty') {
    return '<section><p>Prompts become available after a peer adds an idea.</p></section>';
  }
  if (state.prompt) {
    const {sourceId, move} = state.prompt;
    const source = byId(sourceId);
    const content = source
      ? `<h3>Respond to a peer’s idea</h3>
        <blockquote><p>${escapeHtml(source.body)}</p><cite>${escapeHtml(source.author)} · ${source.time}</cite></blockquote>
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
    quiet: kind === 'active' ? 'The group is exchanging ideas. Automatic invitations are paused.' : 'Automatic invitations are off.',
  }[state.offer];
  return `<section><p>${note}</p><div class="actions">${makeButton('open-prompt', 'Ask for a prompt', {outline:true})}</div></section>`;
}

function renderStudent(status) {
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
    ${renderInvitation(status)}
    <section><label class="preference"><input id="allow-invites" type="checkbox"${state.allowInvites ? ' checked' : ''}> Offer a private prompt when an idea is waiting for a reply</label></section>
    ${feedback}`;
}

function renderPeerForm() {
  const targets = state.replies.map((reply) => {
    const summary = reply.body.length > 50 ? `${reply.body.slice(0, 50)}…` : reply.body;
    return `<option value="${reply.id}">${escapeHtml(`${reply.author} · ${summary}`)}</option>`;
  }).join('');
  return `<form id="peer-form" class="peer-form">
    <h3>Add a participant post</h3>
    <label for="peer-author">Participant name</label>
    <input id="peer-author" name="author" type="text" required maxlength="40" placeholder="e.g. Sam">
    <label for="peer-reply-to">Post as</label>
    <select id="peer-reply-to" name="replyTo"><option value="">New idea</option>${targets}</select>
    <label for="peer-body">Message</label>
    <textarea id="peer-body" name="body" required maxlength="1600" placeholder="Enter a participant’s idea or reply"></textarea>
    <button type="submit">Add discussion post</button>
  </form>`;
}

function renderFacilitator({kind, idea}) {
  const students = state.replies.filter((reply) => reply.student).length;
  const linked = state.replies.filter((reply) => reply.parentId).length;
  const description = {
    empty: 'Add the first participant’s idea to start the discussion.',
    waiting: `The latest idea${idea ? ` from ${escapeHtml(idea.author)}` : ''} is awaiting a reply. Private invitations depend on the student’s preference.`,
    active: 'The latest idea has a linked reply. Automatic invitations are paused.',
  }[kind];
  const replay = canReplayReplies() ? `<div class="actions">${makeButton('advance', 'Add example replies', {outline:true})}</div>` : '';
  return `<p class="eyebrow">Facilitator view</p>
    <h2 id="role-title">Discussion state</h2>
    <p>${description}</p>
    ${replay}
    ${renderPeerForm()}
    <dl class="metrics">
      <div><dt>Messages</dt><dd>${state.replies.length}</dd></div>
      <div><dt>Linked replies</dt><dd>${linked}</dd></div>
      <div><dt>Student contributions</dt><dd>${students}</dd></div>
    </dl>`;
}

function canReplayReplies() {
  const {kind, idea} = discussionStatus();
  return kind === 'waiting' && state.exampleReplies[0]?.parentId === idea.id;
}

function render() {
  const status = discussionStatus();
  for (const tab of document.querySelectorAll('[data-view]')) {
    tab.setAttribute('aria-pressed', tab.dataset.view === view);
  }
  if (view === 'student' && state.offer === 'available') state.invitationSeen = true;
  panel.hidden = view === 'group';
  panel.innerHTML = view === 'student' ? renderStudent(status) : view === 'facilitator' ? renderFacilitator(status) : '';
  renderDiscussion(status);
  renderComposer();
}

function focusAfterRender(selector) {
  const next = document.querySelector(selector);
  if (!next) return;
  if (!next.matches('button, input, textarea, select, a')) next.tabIndex = -1;
  next.focus();
}

function renderTopicChoices() {
  for (const group of ['new', 'previous']) {
    document.querySelector(`#${group}-topics`).innerHTML = discussionTopics.filter((topic) => topic.group === group).map((topic) => `
      <label class="topic-card">
        <input type="radio" name="topicChoice" value="${escapeHtml(topic.id)}">
        <span><strong>${escapeHtml(topic.title)}</strong><span>${escapeHtml(topic.description)}</span></span>
      </label>`).join('');
  }
}

function updateDiscussionSetup(choice) {
  const custom = choice === 'custom';
  const topic = discussionTopics.find((example) => example.id === choice);
  document.querySelector('#session-options').hidden = !choice;
  document.querySelector('#starting-point-field').hidden = custom;
  startingPoint.disabled = !topic;
  if (topic) startingPoint.value = topic.group === 'previous' ? 'active' : 'empty';
  document.querySelector('#custom-setup').hidden = !custom;
  topicInput.disabled = !custom;
  topicInput.required = custom;
  notesInput.disabled = !custom;
  document.querySelector('#start-discussion').disabled = !choice;
}

function showSetup() {
  sessionPage.hidden = true;
  setupPage.hidden = false;
  document.querySelector('[data-action="return-to-discussion"]').hidden = !state;
  document.querySelector('#reset-notice').hidden = !state;
  focusAfterRender('#setup-title');
}

function showDiscussion() {
  setupPage.hidden = true;
  sessionPage.hidden = false;
  render();
  focusAfterRender(view === 'facilitator' ? '#peer-author' : '#discussion-topic');
}

function say(message) {
  announcement.textContent = message;
}

function draftReply(sourceId, move, fromPrompt = false) {
  state.draft = {sourceId, move, fromPrompt, body: state.draft?.body ?? ''};
  render();
  focusAfterRender('#reply-body');
}

function addPosts(posts) {
  const previous = discussionStatus();
  state.replies.push(...posts);
  const current = discussionStatus();
  if (previous.idea?.id !== current.idea?.id) {
    state.prompt = null;
    state.offer = current.kind === 'waiting' && state.allowInvites ? 'available' : 'quiet';
  } else if (previous.kind === 'waiting' && current.kind === 'active' && (state.offer === 'available' || state.prompt)) {
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
  addPosts([{
    id: state.nextId++, author: 'Ari', time: 'Now', body: body.trim(),
    parentId: sourceId, move: fromPrompt && sourceId ? questions[move][0] : '', student: true,
  }]);
  if (fromPrompt) state.repliesFromPrompt += 1;
  state.draft = null;
  state.prompt = null;
  state.offer = 'used';
  render();
  focusAfterRender('#conversation-title');
  say('Reply shared with the group.');
}

const studentActions = {
  'open-prompt': () => {
    const {kind, idea} = discussionStatus();
    const peer = kind === 'waiting' ? idea : state.replies.findLast((reply) => !reply.student);
    const source = state.condition === 'contextual' ? peer : null;
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
  if (action === 'change-topic') {
    showSetup();
    return;
  }
  if (action === 'return-to-discussion') {
    showDiscussion();
    return;
  }
  if (view === 'facilitator' && action === 'advance' && canReplayReplies()) {
    addPosts(state.exampleReplies);
    state.exampleReplies = [];
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
  if (event.target.matches('#custom-topic, #peer-author, #peer-body')) event.target.setCustomValidity('');
});

document.addEventListener('change', (event) => {
  if (event.target.name === 'topicChoice') updateDiscussionSetup(event.target.value);
  if (event.target.id !== 'allow-invites' || view !== 'student') return;
  state.allowInvites = event.target.checked;
  if (!state.allowInvites && state.offer === 'available') state.offer = 'quiet';
  if (state.allowInvites && discussionStatus().kind === 'waiting' && state.offer === 'quiet') state.offer = 'available';
  render();
  focusAfterRender('#allow-invites');
});

function requiredText(field, message) {
  const value = field.value.trim();
  if (!value) {
    field.setCustomValidity(message);
    field.reportValidity();
  }
  return value;
}

document.addEventListener('submit', (event) => {
  if (event.target === replayForm) {
    event.preventDefault();
    const input = new FormData(replayForm);
    const choice = input.get('topicChoice');
    const topic = discussionTopics.find((example) => example.id === choice);
    const customTopic = choice === 'custom' ? requiredText(topicInput, 'Enter a discussion topic.') : '';
    if (!topic && !customTopic) return;
    startDiscussion(topic, topic ? startingPoint.value : 'empty', input.get('promptType'), customTopic, input.get('priorNotes')?.trim() ?? '');
    showDiscussion();
    say('Discussion ready.');
  }
  if (event.target.id === 'reply-form' && view === 'student') {
    event.preventDefault();
    shareReply();
  }
  if (event.target.id === 'peer-form' && view === 'facilitator') {
    event.preventDefault();
    const {author: name, body: message, replyTo} = event.target.elements;
    const author = requiredText(name, 'Enter a participant name.');
    if (!author) return;
    const body = requiredText(message, 'Enter a discussion post.');
    if (!body) return;
    const parent = byId(Number(replyTo.value));
    addPosts([{id: state.nextId++, author, body, parentId: parent?.id, time: 'Now'}]);
    render();
    focusAfterRender('#peer-author');
    say('Discussion post added.');
  }
});

renderTopicChoices();
