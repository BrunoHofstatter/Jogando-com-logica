## Game Template

Copy this folder when starting a new placeholder game.

### Recommended flow

1. Copy `src/GameTemplate` to `src/YourGameName`.
2. Rename `Pages/TemplateGamePage.tsx` to your real page name.
3. Update `gameTemplateConfig.ts` first.
4. Run a search/replace for `TemplateGame`.
5. Add route constants in `src/routes.ts`.
6. Wire the pages in `src/App.tsx`.
7. Decide whether the game should appear in `src/Main/Pages/Jogos.tsx`.

### What to replace

- `displayName`
- `previewImage`
- `themeColor`
- `routes.rules`
- `routes.game`
- `routes.levels`
- `modeInputName`

### If the new game does not use levels

1. Set `hasLevels: false` in `gameTemplateConfig.ts`.
2. Do not add the levels route to `src/routes.ts`.
3. Do not wire the levels page in `src/App.tsx`.
4. Delete `Pages/LevelsMenuPage.tsx` and `styles/levelsMenu.module.css` if you want a cleaner final folder.

### Notes

- `Components/` and `Logic/` are intentionally empty.
- The template is self-contained and not connected to the app.
- All user-facing text inside the pages is already in Brazilian Portuguese.
