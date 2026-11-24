# EqualVoice

README prose word count 720.

## Project status

EqualVoice is a browser prototype for small university discussion groups. The discussion workspace supports custom topics, participant posts, linked replies and private prompts. It also offers sample discussions for comparing a peer-based prompt with a general invitation. The turn-taking demo separately replays a request, facilitator handoff and clarification after an uncertain reply. Both run in one browser. Sample dialogue and timing cues are scripted. Authentication, multi-device delivery, live speech capture and live model calls are planned.

## Run and inspect

Open `discussion.html` and choose a new topic, an earlier example discussion or your own topic. Open Starting options to change the example posts loaded or the private prompt style. Earlier example posts are fictional. You can add your own recap under Earlier discussion notes. Use Facilitator to add named participants’ ideas or attach replies. In Student, choose a response approach in a contextual prompt, then draft and share when ready. Optional feedback appears after the prompt interaction. Group display shows shared content. Prompt wording follows local rules. Session data is held in memory. Edit `discussion-topics.js` to change the example topics and posts.

Open `index.html` in a modern browser. No server, API key, package install or network access is required. Use the Scenario menu and switch roles with the three view buttons. Reset scenario clears the session. The prototype uses HTML, CSS and vanilla JavaScript. `prototype.js` contains the scenarios, state transitions and interface rendering.

| Scenario | Replay |
| --- | --- |
| Request a turn | Request as Student. In Facilitator, simulate a pause, choose Hold, mark the speaker finished and open the turn. Inspect Group display. Student can pass. |
| An uncertain reply | Choose Maybe later. Check the empty Facilitator queue. Choose Not now, or explicitly send the request and then cancel it. |
| Build on an idea | Open the peer-based prompt, switch to the general invitation and dismiss it. The facilitator queue stays empty. |

## Development record

- Lab 2 mapped the student and facilitator interaction. Its design review exposed the need to explain the suggested handoff and let the facilitator hold it. The prototype tests a false pause before a confirmed turn end.
- Lab 3 compared a deliberately faulty interpretation of “Maybe later” with explicit confirmation. The prototype implements the revised branch and checks that clarification and cancellation leave no pending request.
- The Assignment 1 comparison inspired the two private prompt variants. Both use the same student view. The contextual variant shows Maya’s source line beside the question.
- Lab 4 informed the application’s action checks. An Edge replay verified role visibility, handoff, cancellation, both prompts and dismissal. The replay also checked keyboard activation, narrow-screen overflow and HTTP requests from the prototype.
- The discussion workspace extends the Assignment 1 comparison to two discussion states. Browser checks covered linked replies, invitations expiring after peer replies, preservation of private drafts, the general comparison condition and optional interruption feedback.
- [Custom discussion](https://github.com/zhouandting/EqualVoice/commit/4aa8f66) replaced the fixed topic with participant posts entered during the session. Edge checks used two distinct topics and verified that a linked reply closed an outdated invitation while preserving the student’s draft. A shortcut in Facilitator opened the custom topic field.
- Feedback on v2 showed that the starting state could be mistaken for the topic. The [new setup](https://github.com/zhouandting/EqualVoice/commit/44d16e0) makes the choice of topic visible before asking how to start (IIS Lecture 05, slides 15–17). Change topic preserves the current session until Start discussion is selected (Lecture 06, slides 6 and 12). Earlier notes are shown separately and private prompts show their quoted discussion source (Lectures 10–11).
- The A2 report illustrates three interactions: adding a post to a custom discussion, comparing two private prompt styles with the same starting post, and continuing a draft after an invitation expires. The PDF accompanies the coursework submission.
- Feedback on v3 questioned controls that exposed a feature without supporting the current task. The revised workspace puts response approaches in one selector, moves the question and expiry message next to the draft, and presents optional feedback after the interaction. Edge checks covered the return from topic setup, rejection of a blank reply, draft retention when the facilitator added example replies and group visibility before and after sharing.

## AI assistance

Codex helped organise ideas, draft documentation and translate text.

## Prototype development and verification

The student’s walkthrough feedback identified the fixed topic and the confusing starting-state labels. This shaped the separate topic picker and the route back to a discussion in progress. The checks verified prompt attribution, draft retention and which content reached the group display.
