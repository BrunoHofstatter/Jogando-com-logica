# Jogando com Lógica project overview

Current project context confirmed by Bruno on October 12, 2026. Technical summaries describe the repository, not proof that every latest change is deployed or validated in classrooms.

## What it is

Jogando com Lógica (JcL, Playing with Logic) is currently a free educational game platform in Brazilian Portuguese, primarily for Brazilian public schools. Students and teachers do not need accounts. The public website is `jogandocomlogica.com`.

Bruno founded the project in Novo Hamburgo, Rio Grande do Sul, in 2024. His original motivation was strengthening his study-abroad application profile, with encouragement from Daqui Pra Fora. Math, teaching, and Rubik's cubes were existing interests. He brought cubes from his first school visit, before the project had a name or a concrete format.

The in-person work expanded from one school in 2024 to two different schools in 2025. Website development began in early 2025 and the website launched in late 2025. Bruno stopped the in-person classes after 2025 because he started college in 2026 and no longer had time for that schedule.

Read [history.md](history.md) for chronology and school arrangements, and [founder-context.md](founder-context.md) for motivation, working approach, availability, and collaboration experience. The [original history source](../archive/project-history-original.md) is preserved separately.

## Current use and priority

The main objective is getting teachers to use the platform in their classes. JcL remains early in outreach and validation.

Bruno presented the website to a teacher after contacting a coordinator at his old school. He believes she used it a few times, based on activity in his city on several days in Google Analytics after that contact. Continued use is unknown. This is an early indication of use, not confirmed sustained school adoption or evidence of learning outcomes. Analytics alone does not identify that teacher or count individual students.

Immediate priorities are:

- Reach teachers, schools, and coordinators, especially through existing relationships.
- Gather early-user feedback about fundamental problems in the experience.
- Improve the website and make its value and classroom use clear to educators.
- Find contributors, particularly someone who can independently test games and features and suggest improvements.
- Use analytics to understand activity and reliability, with the measurement limits in [analytics.md](../systems/analytics.md).

Teacher adoption is the strategic priority, but most of Bruno's own time still goes into website development. He currently sees limited useful outreach work to fill many hours every day. Automated checks exist; he does not consider the games and features sufficiently tested through human use.

## Audience and classroom role

The usual target is children around ages 8–13, with many activities recommended around 3rd–7th grade. In-person work previously included 1st–6th graders. Recommendations vary by activity and teacher support; these ranges are not validated eligibility limits.

Teachers and coordinators are key users. They need clear instructions, suggested grades, approximate durations, and activities fitting lessons, computer labs, pairs, small groups, or contraturno programs. The platform supports teachers as an auxiliary resource, not a complete curriculum.

Independent use at home is welcome. Bruno imagines some children playing independently after encountering JcL at school, but school and classroom use remain the focus.

## Educational approach

- **Learn through activity:** children should interact and try things before lengthy explanation. Most activities reinforce existing math and logic knowledge; cube modules also explicitly teach concepts.
- **Support understanding:** progressive hints and feedback help children understand the activity and continue playing. Explanation follows useful discovery or difficulty when appropriate.
- **Practice through play:** reasoning belongs inside the activity rather than unrelated quizzes between moves. Games can reinforce material a teacher is covering.
- **Use mental calculation where it fits:** mental reasoning is common, but not an absolute restriction. Cube lessons also contain interactive written multiplication.
- **Adapt difficulty to the activity:** levels, complexity, and help should suit the intended learners. Every game need not cover every grade.

These are product intentions. Grade fit, learning effectiveness, and classroom duration still require observation and feedback. See [teacher-manual.md](teacher-manual.md) for educator-facing detail.

## Game design principles

Useful activities have a clear objective, understandable controls, meaningful math or logic in their actions, replayability, and feedback that makes choices and consequences readable. Simple rules can support deeper strategy. New activities should add useful content or a different experience rather than merely repeat an existing game.

Avoid unnecessary rule complexity, unclear win conditions, heavy text, and avoidable external materials or setup. A cooperative communication puzzle, a mental-arithmetic round, and a cube lesson need not have identical structures.

## Platform in the repository

The main catalog has six entries: Caça Coroa, Guerra Matemática, Super Jogo da Velha, Stop Matemático, Caça Soma, and Cubo Mágico. [games-overview.md](games-overview.md) describes their current modes.

Other implemented support includes rule pages, a teacher manual, temporary classroom codes, room monitoring, and analytics. Bomb Game has online cooperative Numbers and Navigation content implemented but is not in the six-entry main catalog. Houses and Puzzle Wire have placeholder gameplay pages.

The frontend is static, deployed through GitHub Pages with Cloudflare. A separate Render backend supports online multiplayer. Current online flows use temporary in-memory rooms and classrooms without accounts or a database; online modes require a server connection. These features do not imply sustained adoption, universal offline availability, or classroom validation.

## Current team and working arrangement

There are three active members:

- **Bruno, the founder:** leads website behavior, feature and game design, and implementation through AI agents. He currently writes almost no code manually and puts substantially more time into JcL than the other members.
- **Gabriel:** outreach, social media, school contact, ideas, and game design; he is taking on analytics.
- **The other Bruno:** outreach, social media, school contact, ideas, and game design. This name refers to the teammate, not the founder.

Weekly meetings cover the website, games, what the founder implemented, what the others did, and the project overall. Product discussions involve everyone. Recruitment is active, but specific arrangements are changing.

Bruno's time varies with college, exams, and other projects. Some weeks are around 3 hours, others 15–20 or more. A desired average of 10–15 hours is an estimate, not a measured routine. More detail belongs in [founder-context.md](founder-context.md).

## Outreach

Personal contacts and people already known to the team have made it easier to get someone to try the website. The team is pursuing those relationships, while finding adoption difficult.

Instagram and Facebook support explanation, credibility, and contact with educators. Reach has been small, and they are not established as the main acquisition channel. Post schedules and recruitment tactics should be updated as they change.

## Confirmed intentions and tentative ideas

These are plans, not implemented promises or a fixed delivery schedule:

- **Teacher-led tournament system:** definitely intended, ahead of Houses. Bruno sees it as a potentially important feature. The working comparison is "Kahoot-like"; grouping, timing, and scoring remain open. See [the tournament discussion](../plans/classroom-tournament-discussion-context.md).
- **Houses:** definitely intended because it fills the gap in word puzzles and mathematical story/word-problem content. The current concept identifies a person among houses using clues; the final design can evolve.
- **Puzzle Wire:** probably intended eventually, but lower priority. A better game idea can move it farther down the queue.
- **More games over time:** an ongoing intention. Additional cube modules and Bomb Game level ideas are documented in their own references; they have no fixed schedule here.

## Long-term intention and uncertainty

Bruno wants to continue JcL indefinitely because of his attachment to the project. His picture of growth includes many schools actively using it, more contributors, and more people involved. There is no settled numerical scale target.

Access is free today. Permanent free access and eventual income or monetization are both possible; neither is a settled financial commitment. Older "What Won't Change" wording is not a promise that free access can never change.

Other open questions include sustained teacher use, effective acquisition, sufficient human testing, classroom fit, future contributors, and which improvements early feedback will justify.
