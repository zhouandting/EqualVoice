'use strict';

// Add or edit sample topics here. Each example reply names its parent by ID.
const discussionTopics = [
  {
    id: 'quiet-study', group: 'new', title: 'How should we share quiet study spaces during exams?',
    description: 'Think about booking limits, walk-in space and who needs a desk most.',
    first: {id: 1, author: 'Nina', body: 'We could reserve half the quiet desks for people who come without a booking.'},
    replies: [
      {id: 2, author: 'Omar', parentId: 1, body: 'Would that still work for students who have a long commute and need to plan ahead?'},
      {id: 3, author: 'Nina', parentId: 2, body: 'We could keep some bookings open for early mornings and review how many walk-in seats are actually used.'},
    ],
  },
  {
    id: 'reuse', group: 'new', title: 'Should campus cafés offer a discount for reusable cups?',
    description: 'Discuss how to encourage reuse and make the scheme easy to join.',
    first: {id: 1, author: 'Sam', body: 'A small discount could encourage students who already have a reusable cup to bring it.'},
    replies: [
      {id: 2, author: 'Taylor', parentId: 1, body: 'What about students who forget their cup or do not own one?'},
      {id: 3, author: 'Sam', parentId: 2, body: 'A borrow-and-return scheme might reach people who would otherwise miss out.'},
    ],
  },
  {
    id: 'ai-tutors', group: 'previous', title: 'How should AI tutors help students get unstuck?',
    description: 'An earlier example group discussed when hints help and when they can get in the way.',
    first: {id: 1, author: 'Maya', body: 'AI tutors should give a hint before revealing the answer. That gives students a chance to finish the problem themselves.'},
    replies: [
      {id: 2, author: 'Leo', parentId: 1, move: 'Question', body: 'Could a hint make things harder if the student has misunderstood the whole problem?'},
      {id: 3, author: 'Maya', parentId: 2, move: 'Give a reason', body: 'It could. A first hint might work better if it asks the student to explain their starting point.'},
    ],
  },
  {
    id: 'societies', group: 'previous', title: 'How should a student society allocate its budget?',
    description: 'An earlier example group compared a shared events fund with grants for smaller activities.',
    first: {id: 1, author: 'Isha', body: 'We should set aside part of the budget for small grants so new groups can try out an idea.'},
    replies: [
      {id: 2, author: 'Jamie', parentId: 1, body: 'Could we commit to those grants and still pay for events that most members attend?'},
      {id: 3, author: 'Isha', parentId: 2, body: 'We could fund one shared event first and reserve a fixed share of the remaining budget for small grants.'},
    ],
  },
];
