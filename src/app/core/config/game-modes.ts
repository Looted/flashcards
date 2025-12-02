import { GameMode } from '../models/game-config.model';
import { LanguageService } from '../../services/language.service';

// Factory function to create game modes with dynamic language configuration
export function createStandardGameMode(languageService: LanguageService): GameMode {
  return {
    id: 'standard',
    description: 'Classic Learning Mode',
    rounds: [
      {
        id: 'recognition',
        name: 'Recognition',
        layout: {
          templateId: 'flashcard_standard',
          dataMap: {
            primary: 'english',
            secondary: languageService.nativeLanguage
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
            primary: languageService.nativeLanguage,
            secondary: 'english'
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
        id: 'writing',
        name: 'Writing',
        layout: {
          templateId: 'typing_challenge',
          dataMap: {
            primary: languageService.nativeLanguage,
            secondary: 'english'
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
      }
    ]
  };
}

// Factory function to create Blitz mode with dynamic language configuration
export function createBlitzGameMode(languageService: LanguageService): GameMode {
  return {
    id: 'blitz',
    description: 'Blitz Mode - Fast Flipping',
    rounds: [
      {
        id: 'recognition',
        name: 'Recognition',
        layout: {
          templateId: 'flashcard_standard',
          dataMap: {
            primary: 'english',
            secondary: languageService.nativeLanguage
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
            primary: languageService.nativeLanguage,
            secondary: 'english'
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
      }
    ]
  };
}
