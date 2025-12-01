export type TemplateId = 'flashcard_standard' | 'typing_challenge';
export type LanguageField = 'polish' | 'german' | 'french' | 'spanish' | 'italian' | 'portuguese' | 'dutch' | 'czech' | 'slovak' | 'hungarian' | 'romanian';
export type CardField = 'english' | LanguageField | 'contextSentence' | 'translation';

export interface LayoutPolicy {
  templateId: TemplateId;
  dataMap: {
    primary: CardField;      // What appears on the main face (e.g. 'term')
    secondary: CardField;    // What appears on the reveal/back (e.g. 'definition')
    hint?: CardField;        // Optional hint field
  };
}

export interface FailurePolicy {
  action: 'requeue' | 'game_over';
  strategy: 'static_offset' | 'geometric_backoff';
  // If static: [3] means always re-insert 3 spots later.
  // If backoff: [3, 5, 10] means 1st fail=3, 2nd fail=5, etc.
  params: number[];
}

export interface GameRoundConfig {
  id: string;
  name: string;

  // 1. Visuals: How the card looks
  layout: LayoutPolicy;

  // 2. Entry: What cards get into this round?
  inputSource: 'deck_start' | 'prev_round_failures' | 'prev_round_successes';

  // 3. Exit: How do I finish this card?
  completionCriteria: {
    requiredSuccesses: number; // e.g. 1 = Done, 2 = Must get right twice
  };

  // 4. Failure: What happens when I miss?
  failureBehavior: FailurePolicy;
}

export interface GameMode {
  id: string;
  description: string;
  rounds: GameRoundConfig[];
}
