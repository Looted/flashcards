# Progress

What works:
- Memory Bank documentation system initialized
- Core files created with initial content
- Project structure planned
- Basic Angular application setup with standalone components (package.json, index.html, app.component.ts)
- PWA setup with Angular PWA package, service workers, and web app manifest
- PWA installability implemented with custom install button and beforeinstallprompt handling
- Vocabulary statistics service implemented with localStorage persistence for tracking word performance across sessions
- AI integration package (transformers.js) installed
- First app screen with theme/mode selection using Angular signals and responsive CSS
- AI integration with @huggingface/transformers for on-device word generation (service and worker implemented and tested)
- Worker file modularized into separate concerns (AI models, text parsing, message handling)
- Comprehensive test suite for all modules with 54 passing tests (100% coverage)
- Test environment compatibility: CPU fallback for AI models in testing environments
- Difficulty level selection implemented for both static and AI-generated vocabulary
- LLM prompt now respects selected difficulty level for targeted word generation
  - **Freemium Architecture**: Complete implementation with content restrictions, premium status management, and UI feedback
  - Content tagged with `isFree` flags based on difficulty tiers (36 Easy, 18 Medium, 6 Hard per category)
  - UserProfile model extended with `isPremium` field
  - AuthService enhanced with `isPremiumUser()` method
  - StaticVocabularyService filters words based on premium status
  - GameService handles shortened rounds when insufficient free words available
  - MenuComponent provides visual feedback with blue/gold button states
  - All tests passing (395/395) with comprehensive coverage including freemium logic
    - Regression fix: "Learn New Words" strictly blocked when exhausted (no recycling of old words for free users)
  - **Freemium Logic Fixes & Testing**:
    - Fixed "Start Game" button logic (Gold vs Blue) based on new word availability.
    - Ensured Practice Mode remains available as long as words need practice.
    - Optimized Blitz rounds to maximize length.
    - Fixed test failures in `VocabularyStatsService` and `SummaryComponent`.
    - Resolved `global` variable issues in spec files for cleaner test runs.
    - **Mastery Calculation Fix**: Resolved inconsistency where words with `masteryLevel: 4` were counted as both "Mastered" and "Practice". A word is now considered "needing practice" only if `masteryLevel < 4`, ensuring "Mastered" and "Practice" states are mutually exclusive. This fixed a reporting bug where a user with 53 mastered words saw 0 words in practice mode.

What's left to build:
- Deck management components (create themed decks: IT, HR, etc.) using signals and OnPush
- Three-round learning system: English→Polish recognition, Polish→English recognition, Polish→English typing
- Word tracking and mistake management system
- Session management (new words vs. practice mistakes)
- Review system with spaced repetition algorithm using computed signals
- Data persistence layer with Angular services, IndexedDB for word storage, and offline sync
- UI styling and responsive design with custom CSS utility classes
- Push notifications for review reminders
- Complete testing suite with vitest achieving 100% coverage for all components
- Deployment configuration with Angular CLI

Current status: Pre-development phase complete. Ready to start coding the core application.

Known issues: None identified at this stage.

Evolution of project decisions:
- Initial decision: Web-based application for broad accessibility
- Tech stack: Angular v20+ selected for modern reactive development with signals and performance optimization
- Architecture: Standalone component-based approach for modularity and tree-shaking
