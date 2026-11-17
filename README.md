# EqualVoice

README prose word count 495.

## Project status

EqualVoice is a browser prototype for small university discussion groups. The discussion workspace supports custom topics, participant posts, linked replies and private prompts. It also offers sample discussions for comparing a peer-based prompt with a general invitation. The turn-taking demo separately replays a request, facilitator handoff and clarification after an uncertain reply. Both run in one browser. Sample dialogue and timing cues are scripted. Authentication, multi-device delivery, live speech capture and live model calls are planned.

## Run and inspect

Open `discussion.html` for the discussion workspace. Choose a sample replay or Custom discussion, and select one prompt condition per session. For a custom session, enter a topic and use Facilitator to add named participants’ ideas or attach replies to earlier posts. The latest peer idea and its linked replies determine when automatic invitations are offered or withdrawn. The Student view supports private invitations, linked drafts, explicit sharing and interruption feedback. The Group view shows shared messages. Prompt wording follows local rules, and session data is held in memory.

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
- Custom discussion replaced the fixed topic with participant posts entered during the session. Edge checks used two distinct topics and verified that a linked reply closed an outdated invitation while preserving the student’s draft. A shortcut in Facilitator opens the custom topic field.

## AI assistance

Codex helped organise ideas, draft documentation and translate text.
