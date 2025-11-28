# Active Context

Current work focus: Verifying refactoring and documenting changes.

Recent changes:
- Refactored monolithic `App` component into `HeaderComponent`, `MenuComponent`, `GameComponent`, and `SummaryComponent`.
- Implemented Angular Router for navigation between views (`/`, `/game`, `/summary`).
- Removed redundant `LearningComponent`.
- Updated tests to use `vi.spyOn` and cover new components.
- All 63 tests pass with 100% coverage.

Next steps:
- Continue implementing core flashcard application components (deck management, learning rounds, word tracking).
- Consider implementing `CanDeactivate` guard for GameComponent to prevent accidental exit.

Active decisions and considerations:
- Framework choice: Angular v20+ for modern web-based UI with signals, standalone components, and OnPush change detection for optimal performance.
- Data storage: Start with local storage, expand to IndexedDB for word databases and user progress.
- AI integration: Use transformers.js for on-device LLM word generation to avoid server dependencies and ensure privacy.
- Learning algorithm: Implement three-round system (recognition→recognition→typing) with spaced repetition for comprehensive vocabulary acquisition.
- Algorithm: Implement basic spaced repetition (e.g., SM-2 algorithm) using pure functions.
- PWA: Implement service workers for offline caching, web app manifest for installability, and background sync for data persistence.

Important patterns and preferences:
- Use standalone components with signals for reactive state management.
- Follow Angular style guide and TypeScript best practices with strict type checking.
- Use OnPush change detection strategy for all components.
- Prefer input() signals over @Input decorators and output() over @Output decorators.
- Use computed() for derived state and keep transformations pure.
- Follow consistent naming conventions (camelCase for variables/functions, PascalCase for components/classes).
- Maintain clean, modular code structure with single responsibility components.

Learnings and project insights:
- Establishing comprehensive documentation from the start ensures smooth development continuity.
- Test environment compatibility: AI models requiring WebGPU acceleration need CPU fallbacks for reliable testing.
- Mocking complex dependencies: Use vi.mock() with task-specific implementations for Hugging Face transformers to isolate AI functionality in tests.
- Singleton testing: Reset singleton instances between tests to prevent state leakage and ensure test isolation.
- Error scenario testing: Cover device compatibility, network failures, and invalid inputs for robust error handling.
- Progress callback testing: Mock async progress reporting in pipeline options for comprehensive test coverage.
- Static method mocking: Use vi.spyOn() instead of vi.mocked() for mocking static class methods in vitest. vi.mocked() only works with module-level mocks, not static methods.
