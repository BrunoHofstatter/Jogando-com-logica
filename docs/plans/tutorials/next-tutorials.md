# Considerations for future playable tutorials

Companion to [overview.md](../../tutorials/overview.md), [technical-contract.md](../../tutorials/technical-contract.md), and [crown-chase.md](../../tutorials/crown-chase.md).

This document collects relevant questions, tradeoffs, and lessons learned. It is not a required workflow, stage template, fixed sequence, or instruction to reproduce Crown Chase. Each game can use the teaching and implementation approach that fits it.

## The minimum useful introduction

The useful starting question is what a child needs to understand to begin this particular game. That may include one action loop, an objective, a result, or a mode-specific confirmation control. Secondary rules and strategy can remain in detailed rules or later help.

A clear teaching objective helps distinguish an action that demonstrates the concept from one that is merely legal. There is no required number of stages or player moves. A lesson can mix action, observation, and short explanation without giving every stage the same structure.

## What the child already sees and knows

The existing game offers a visual language: its controls, selected state, legal-action markers, tokens, number board, and feedback. Reusing that language helps the lesson transfer to normal play.

Crown Chase taught that a sizing wrapper can distort familiar pieces even when the same renderer is used. Changes around existing components deserve attention as well as changes inside them.

Preselection is useful when the goal is to teach a piece's movement immediately. Another lesson may need the child to learn selection first. A single-piece fixture, pop-up, pointer, or highlighted word can be helpful where it reduces uncertainty; none is mandatory.

## Choosing a situation that stays teachable

A small authored fixture can expose the rule clearly. A continuous match can show how actions relate over turns. Either approach is reasonable when its state changes are understandable.

The intended action needs to remain possible after the alternatives the lesson allows. Crown Chase solves this by repositioning a supporting piece. Another game might retain a chosen selection, prepare a new target, or restore a known state.

Competitive AI is useful only when its behavior helps the teaching moment. Deterministic support can be enough. A game that uses real randomness may still benefit from a predictable introductory example.

## Understanding different attempts

Illegal actions, legal alternatives, and neutral interaction have different meanings. Treating all three as mistakes can teach false rules or make normal exploration frustrating.

Useful decisions include whether an alternate action advances the same objective, stays visible, creates another opportunity, or is previewed and restored. Feedback can be a short rule explanation or a reminder of the exercise goal. The game determines which is needed.

Crown Chase counts meaningful unsuccessful attempts but excludes neutral deselection. Its capture/jump support follows alternate legal moves; its final challenge previews and returns a move. Those are examples of two recovery approaches within the same lesson.

## Giving the right amount of guidance

Initial guidance can invite an action without showing the entire solution. Additional guidance may point to a control, reveal a valid destination, narrow a choice, or explain what was missing.

The timing and amount depend on the game. Crown Chase uses attempt-based escalation and a Dica button; another tutorial might use an explicit help request or a different signal. Two/three attempts and gold destination markers are Crown Chase choices, not defaults imposed by the core.

A hint can support the action while leaving the child responsible for performing it. Advancing simply because enough attempts passed would not show that the objective was achieved.

## Reading, feedback, and movement

Short primary instructions can remain visible during interaction. Temporary feedback benefits from a clear visual hierarchy when it needs to attract attention. The reading and recovery behavior should fit the amount and importance of the text.

Automatic recovery can remove unnecessary buttons. Manual acknowledgement can be useful for an explanation that needs more time. Crown Chase's two-second correction and three-second observation are examples, not durations to copy automatically.

Hidden pages should not consume a reading window. Reduced motion should preserve the meaning of the result while avoiding a dependency on animation events. Keyboard focus and accessible labels help keep the interaction understandable beyond pointer input.

## Entry, exit, modes, and shared devices

The game needs a safe place to offer an introduction and a clear destination afterward. A local tutorial should not interrupt an active synchronized room. Practice state and effects should not become a real match.

An explicit replay option matters on shared devices: stored completion does not describe every child who uses that browser. Skip, ordinary navigation, and completion should retain their distinct meanings.

A separate mode introduction is useful when a mode changes something the child must know to play. It is not automatically necessary for every mode. The current core can distinguish identities and filter unseen lessons; automatic multi-lesson navigation still needs game-owned implementation.

## What can be reused

The shared session and history are the reusable foundation. Crown Chase's fixtures, move classifier, Board adapter, routing, controller snapshots, and pointer component show one integration.

A number-selection game can keep its own selection and submission logic. Non-board games do not need the board engine or Crown Chase's component hierarchy. A new reusable capability is worth considering when the next game has a concrete need, rather than to anticipate every possible tutorial.

## Evidence that helps assess a new lesson

Relevant behavior checks depend on the integration. Useful areas often include scenario legality, preserved teaching opportunities, accepted actions advancing once, meaningful alternatives, accurate restoration, cancellation, replay, history fallback, and separation from normal-game effects.

Visual checks can reveal changed proportions, unreadable emphasis, covered targets, or misplaced controls that code tests miss. They still follow repository permission rules. Technical verification and observation with children answer different questions; a passing test suite does not establish learning effectiveness.

Recording the final lesson's reasons and actual behavior will help the following game more than copying an earlier implementation mechanically. Keep future ideas visibly separate from what the source already supports.
