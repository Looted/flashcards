import { GameMode } from '../models/game-config.model';

export const STANDARD_GAME_MODE: GameMode = {
  id: 'standard',
  description: 'Standard Learning Mode',
  rounds: [
    {
      id: 'recognition',
      name: 'Recognition',
      layout: {
        templateId: 'flashcard_standard',
        dataMap: {
          primary: 'english',
          secondary: 'polish'
        }
      },
      inputSource: 'deck_start',
      completionCriteria: {
        requiredSuccesses: 1
      },
      failureBehavior: {
        action: 'requeue',
        strategy: 'static_offset',
        params: [3]
      }
    },
    {
      id: 'recall',
      name: 'Recall',
      layout: {
        templateId: 'flashcard_standard',
        dataMap: {
          primary: 'polish',
          secondary: 'english'
        }
      },
      inputSource: 'prev_round_failures',
      completionCriteria: {
        requiredSuccesses: 1
      },
      failureBehavior: {
        action: 'requeue',
        strategy: 'static_offset',
        params: [3]
      }
    },
    {
      id: 'writing',
      name: 'Writing',
      layout: {
        templateId: 'typing_challenge',
        dataMap: {
          primary: 'polish',
          secondary: 'english'
        }
      },
      inputSource: 'prev_round_failures',
      completionCriteria: {
        requiredSuccesses: 1
      },
      failureBehavior: {
        action: 'requeue',
        strategy: 'static_offset',
        params: [3]
      }
    }
  ]
};
