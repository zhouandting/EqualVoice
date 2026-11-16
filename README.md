# EqualVoice

README prose word count 361.

## Project status

EqualVoice is a browser prototype for small university discussion groups. It replays an optional turn request, a clarification after an uncertain reply and two versions of a private discussion prompt. The student, facilitator and group display are three views of one local session. The interface, request queue, cancellation, facilitator controls and prompt display run in the browser. The conversation, timing cues and model output are scripted. Role labels describe the intended audience in the simulation. Authentication, multi-device delivery, live speech capture and live model calls are planned.

## Run and inspect

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

The examples use fictional dialogue. The project report accompanies the coursework submission and contains the architecture, storyboards and references.

## AI assistance

Codex helped organise ideas, draft documentation and translate text.
