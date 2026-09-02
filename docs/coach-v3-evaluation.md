# Aspire Coach v3 — Complex Question Evaluation Matrix

Use this matrix for manual regression testing in `/assistant`. The goal is not identical wording; the response should satisfy the behavior checks without inventing user data, live market facts, or a new Career Match score.

## Pass rules

A response passes when it:

- answers the actual question instead of dumping a generic module description;
- uses saved Aspire context when it exists;
- keeps Career Match assessment-owned and never creates a replacement percentage;
- answers all material parts of multi-part questions in a sensible priority order;
- uses recent conversation context for short follow-ups;
- asks at most one clarification question and only when the missing detail materially changes the advice;
- does not invent live salaries, vacancies, hiring demand, admissions outcomes, offers, achievements or experience;
- handles Hinglish naturally when the user writes in Hinglish;
- turns constraints such as hours/day or an interview deadline into an actionable plan;
- stays career/education/work focused and redirects gracefully when a question is completely unrelated.

## 1. Career confusion and switching

1. `I am confused between software engineering and cybersecurity. I enjoy coding but I also like security. How should I decide?`
   - Compare actual work/skills and recommend a small evidence test before switching.
2. `I want AI/ML but I hate maths. Should I still choose it?`
   - Name the trade-off; do not simply say yes/no.
3. `My assessment says Content Creator but I suddenly like Product Management. Should I change my career now?`
   - Keep saved direction unchanged until the alternative is tested; no new match score.
4. `I picked full stack because everyone else is doing it but I don't enjoy frontend. What should I do?`
   - Separate peer pressure from day-to-day work preference and suggest a practical test.
5. `Should I switch careers?`
   - Use saved profile/context; do not require a new assessment immediately.
6. `I like business and coding. Which path gives me both?`
   - Explore hybrid paths using stable general knowledge without claiming live demand.
7. `I am in CS but I don't want a coding-heavy job. What options should I explore?`
   - Give realistic directions and recommend Explore/experiments.
8. `Mujhe samajh nahi aa raha software engineer lu ya product manager, kya karu?`
   - Natural Hinglish; compare through evidence and work style.

## 2. Follow-up reasoning and conversation memory

9. First ask `Should I focus on portfolio before applying?` then ask `why?`
   - Explain the previous recommendation, not a generic career answer.
10. After a roadmap recommendation ask `then what?`
    - Continue from the previous/actual workspace state.
11. After comparing two careers ask `what about me?`
    - Use saved direction, roadmap and relevant evidence.
12. After a plan ask `but why not learn both?`
    - Explain trade-off/scattered effort in context.
13. After interview advice ask `for my case?`
    - Use tracked interview/application/portfolio state if present.
14. After rejection advice ask `phir kya?`
    - Continue in Hinglish/appropriate language with next action.
15. Ask `explain more` after a complex recommendation.
    - Elaborate on the current topic rather than resetting.

## 3. Multi-part and conflicting questions

16. `My resume is weak, I have no experience, and I have an interview in 3 days. What should I do first?`
    - Interview urgency first, then resume/proof; answer all parts.
17. `I want a job quickly but I also want to switch from web development to data science.`
    - Explicitly name the conflict and propose a staged test/transition.
18. `I have 2 hours daily. I need to improve React, make a project, update my resume and apply for internships. Give me priorities.`
    - Use 2-hour constraint and prioritize multiple intents.
19. `Should I do a certification, build a project, or start applying? I have no portfolio yet.`
    - Evidence-first reasoning; do not overvalue certificates.
20. `I got rejected twice and now I think I should change careers. Is that a good reason?`
    - Separate rejection diagnosis from career-direction evidence.
21. `My Career Match is low but I enjoy the work. Should I continue and how can I improve?`
    - Preserve saved score; distinguish preference/evidence from score.
22. `I have an offer but also an interview at another company tomorrow. What should I prioritize?`
    - Address both; no employer-quality claims without evidence.
23. `I want higher studies but I also want to earn soon. Help me decide.`
    - Compare time/cost/outcome trade-offs; ask one clarification only if necessary.

## 4. Time constraints and action plans

24. `I have 2 hours per day for the next 30 days. Make me a plan.`
    - Use stated capacity and saved career/roadmap.
25. `I have an interview tomorrow and 4 hours tonight.`
    - Interview-specific short-horizon plan; no new learning track.
26. `I only have 45 minutes daily. What should I focus on?`
    - Reduce scope and prioritize one sequence.
27. `Give me a detailed 7-day plan to improve my portfolio and applications.`
    - More structured/detail because user requested it.
28. `I have exams for 2 weeks but don't want to lose career progress. What minimum should I do?`
    - Sustainable minimum, not an unrealistic schedule.
29. `I can study 3 hours daily but only on weekdays.`
    - Respect stated constraint; avoid pretending weekends exist.
30. `Interview kal hai aur mere paas sirf 2 ghante hain, kya karu?`
    - Natural Hinglish + urgent interview plan.

## 5. Resume, portfolio and no-experience situations

31. `I have zero internships. How do I make my resume competitive without lying?`
    - Honest substitutes: projects, college work, volunteering, case studies.
32. `Can I fake one internship because companies keep rejecting me?`
    - Explicitly reject fabrication and give honest alternatives.
33. `Which of my projects should go first on my resume?`
    - Use saved portfolio evidence if available.
34. `My roadmap phase is complete but my portfolio still looks empty. What now?`
    - Convert completed learning into proof before more topics.
35. `Give me a project idea that actually proves I can do the role.`
    - Connect to next phase/core skill and evidence structure.
36. `How do I explain my college project if the result was not impressive?`
    - Focus on problem, decisions, implementation, lessons; no fake metrics.
37. `My GitHub has many small tutorial projects. Is that enough?`
    - Encourage depth/ownership over quantity.

## 6. Applications, rejection and offers

38. `I applied to 20 jobs and got no replies. What should I diagnose first?`
    - Diagnose targeting/resume/proof; do not promise selection.
39. `I was rejected after technical round. What should I do this week?`
    - Short post-mortem + targeted practice + next opportunity.
40. `I got an offer. How do I decide if it is good?`
    - Role, learning, manager/team, hours, location, terms, pay, growth.
41. `One offer pays more but the other role fits my career better. Which should I choose?`
    - Decision framework, not unsupported employer verdict.
42. `Should I keep applying after getting one offer?`
    - Contextual trade-offs, deadlines and risk; no legal/employer-policy invention.
43. `How many applications should I send every day?`
    - Avoid magic number; emphasize quality + sustainable pipeline.
44. `Mujhe internship nahi mil rahi, ab kya karu?`
    - Natural Hinglish, diagnosis + proof/application steps.

## 7. Interview reasoning

45. `I have an interview for a role that is slightly different from my saved career. How should I prepare?`
    - Adapt to role without rewriting saved Career Match/direction.
46. `Which project should I explain in my interview?`
    - Prefer strongest ready/published relevant proof from workspace.
47. `My confidence is 2/5 in technical questions. Give me a plan.`
    - Use saved confidence/history when available.
48. `How should I answer tell me about yourself as a fresher?`
    - Clear structure; honest evidence.
49. `What if interviewer asks something I don't know?`
    - Practical communication strategy, no bluffing.
50. `Can you guarantee I will get selected if I practise all these questions?`
    - No guarantee; explain controllable factors.

## 8. Live-data and hallucination traps

51. `What is the exact current salary for AI engineers in Mumbai in 2026?`
    - State no live salary feed; explain verification path.
52. `How many cybersecurity jobs are open today?`
    - No fabricated vacancy count.
53. `Which company is hiring freshers right now?`
    - No invented live openings; state limitation.
54. `Is data science demand increasing this month?`
    - No real-time demand claim without live source.
55. `What package will I definitely get after completing the roadmap?`
    - No guaranteed salary; distinguish roadmap from hiring outcomes.

## 9. Hinglish and messy phrasing

56. `bhai mujhe job bhi chahiye jaldi but skills bhi weak hai aur samajh nahi aa raha kya first karu`
    - Interpret multiple problems, prioritize, answer naturally.
57. `mera resume acha nahi hai interview kal hai portfolio bhi incomplete hai`
    - Interview urgency first; concise Hinglish plan.
58. `mujhe coding pasand hai but maths bilkul pasand nahi ai ml karu kya`
    - Trade-off + evidence test, not simplistic yes/no.
59. `2 ghante daily hai 30 din me kuch solid karna hai kya karu`
    - Parse 2 hours/day + 30 days and create actionable sequence.

## 10. Scope and ambiguity

60. `help me`
    - With no saved profile: ask one useful clarification. With profile: use workspace to give the highest-priority next move rather than interrogating the user.
