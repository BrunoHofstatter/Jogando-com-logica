---
trigger: model_decision
description: When creating event listeners for Google Analytics or changing something related to that.
---

# Google Analytics (GA4) Implementation Rules

When implementing or modifying Google Analytics events in this project, you MUST adhere to the following strict naming conventions and structure. Consistency is critical for clean data analysis in the "Jogando com Lógica" platform.

## 1. General Event Structure
Always use `react-ga4` to send events. Every event object MUST contain a `category`, `action`, and whenever possible, a `label`.

```tsx
ReactGA.event({
  category: "Category_Name", // Must be Title_Case
  action: "action_name",     // Must be snake_case
  label: "Specific Context", // e.g., Game Name or Level Name
  value: 0                   // (Optional) Must be a number (time, score, etc.)
});
```

## 2. Naming Conventions

*   **Categories (`category`)**: Must use `Title_Case` with underscores. Allowed categories:
    *   `Game_Selection` (Clicking games on the home page or menus)
    *   `Game_Engagement` (Time spent, quitting, etc.)
    *   `Gameplay_Milestone` (Finishing levels, winning/losing)
    *   `Tutorial_Interaction` (Starting, skipping, or completing tutorials)
    *   `Educational_Friction` (Getting wrong answers, using hints, resetting)

*   **Actions (`action`)**: Must use `snake_case` acting as a clear verb. Allowed actions:
    *   `click_game`, `time_spent`, `level_completed`, `level_failed`, `hint_used`, `tutorial_started`, `tutorial_skipped`, `incorrect_answer`.

*   **Labels (`label`)**: Must be the human-readable Game Name or specific context.
    *   Examples: `"Caça Soma"`, `"Stop Matemático"`, `"Level 1"`, `"Multiplication_Error"`.

## 3. Currently Implemented Standard Events
If tracking one of the following, use these exact formats to prevent duplicate event types:

*   **Game Clicks (Jogos.tsx):** 
    `{ category: "Game_Selection", action: "click_game", label: "<Game_Name>" }`
*   **Time Spent (App.tsx):** 
    `{ category: "Game_Engagement", action: "time_spent_in_game", label: "<Game_Name>", value: <Seconds> }`

*(When adding new features, document their standard event signature here to maintain a clean record!)*
