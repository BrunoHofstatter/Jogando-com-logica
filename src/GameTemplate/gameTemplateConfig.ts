export const GAME_TEMPLATE_CONFIG = {
  displayName: "Nome do Jogo",
  previewImage: `${import.meta.env.BASE_URL}stopPreview.png`,
  themeColor: "#ffbaba",
  hasLevels: true,
  modeInputName: "template-game-mode",
  routes: {
    rules: "/template-game/regras",
    game: "/template-game",
    levels: "/template-game/niveis",
  },
};
