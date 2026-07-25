# IBM AI Builders Challenge — July 2026 — working notes (not for commit)

Theme: "Reimagine Creative Industries with AI"
Deadline: 2026-07-31, 11:59 PM ET
Platform: aibuilderschallenge-bobhub.bemyapp.com

## Decision
GLB_FACTORY (this repo) is the submission. Rejected building something new or
submitting the IBM DeckFlow practice-lab app (everyone gets that same starter,
would score ~0 on originality).

## Requirements checklist
- [ ] Use IBM Bob as the PRIMARY DEVELOPMENT TOOL to build a new feature
- [ ] Every team member: 1+ IBM SkillsBuild course/webinar on Bob + certificate
      (pick one — both are short):
      - "Troubleshoot Your Code Using IBM Bob" (hands-on VS Code debugging lab)
      - "How IBM Bob and AI Tools Are Changing the Way Solutions Are Built"
        (short overview activity)
      Certificate must be uploaded as proof on the submission page.
- [ ] README includes: problem statement, solution description, AI approach/
      architecture, selected theme, and specifically "how IBM Bob was used"
- [ ] Publish submission page on BeMyApp platform: team info, repo link, demo
- [ ] Demo/presentation video, PUBLICLY accessible, MAX 3 MINUTES
- [ ] Judged on: Technical Execution, Innovation, Challenge Fit, Feasibility,
      Real-World Impact
- [ ] (Optional but recommended) Join Discord, #july-challenge-and-learning
      channel — updates/mentors live there, not required for submission itself

## Timeline (ET)
- Jul 7 — Kickoff webinar (replay available)
- Jul 9 — Team Formation webinar
- Jul 15 — Tech Talk: DJ Software with IBM Bob
- Jul 31, 11:59 PM — Submission deadline (hard)
- Aug 1 — Judging begins
- Week of Aug 11 — Winners announced

Prize pool: $15,000 across monthly challenges (July theme is one entry).

## Feature to build with Bob (pick one)
1. AI-generated backstory/lore text for each mutated avatar
2. Style-transfer option for the avatar's look
3. Turn the Mutation Lab into a guided creative-ideation flow

## How to run Bob here
Angela's Bob = `bobshell` v1.0.6, a terminal CLI (NOT the GUI/IDE version IBM's
docs describe). To use it on this project:
```
cd "C:\Users\enter\OneDrive\Desktop\GLB_Studio\GLB_FACTORY"
bob
```
- No "Start new task" button, no Ask/Plan/Code mode switcher — just type/paste
  prompts directly into the running session.
- `/clear` resets conversation history in that terminal.
- Every response shows a Bobcoin cost — be deliberate with prompts, balance is
  limited (already burned through one account elsewhere; do NOT create a
  second account to farm more coins, that risks disqualification — ask IBM
  support for a credit instead, citing the documented complaint on the
  original account).
- Official install source per the contest page: bit.ly/IBMBob-freetrial

## Workflow to follow (same as the DeckFlow practice lab)
1. Ask Bob to explore/explain the relevant part of this codebase first
2. Have Bob draft an implementation plan for the chosen feature
3. Have Bob implement it against that plan
4. Test it actually works
5. Write up "How IBM Bob was used" in the real README using this process
6. Record the ≤3-min demo
