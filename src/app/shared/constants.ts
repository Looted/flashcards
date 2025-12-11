export enum GameMode {
  New = 'new',
  Practice = 'practice'
}

export const GAME_CONSTANTS = {
  CARDS_PER_GAME: 10, // Deprecated, use specific mode counts
  CLASSIC_WORD_COUNT: 5,
  BLITZ_WORD_COUNT: 20,
  FLIP_DELAY: 100,
  FEEDBACK_DELAY: 800,
  ERROR_DELAY: 2000
};
