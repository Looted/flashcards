# Active Context

Current work focus: Implementing comprehensive E2E test fixes with Firebase emulator integration.

Recent changes:
- Implemented Firebase Authentication with Google OAuth and email/password providers
- Added Firebase Firestore for cloud data synchronization across devices
- Created slide-over hamburger menu replacing traditional settings page for better mobile UX
- Added EmailSigninModal component for email-based authentication
- Implemented automatic data migration from localStorage to Firestore on user sign-in
- Updated header component with user avatar/initials display and hamburger menu toggle
- Configured Firebase emulators for E2E testing isolation
- Added comprehensive test IDs to UI components for robust e2e test selectors
- Fixed all E2E tests to work with new authentication and navigation patterns
- Updated memory bank documentation with new system architecture and technologies
- Refactored schema migration system into a modular architecture in `src/app/migrations/`.

Current fixes in progress:
- Updated Playwright config to start Firebase emulators before Angular dev server
- Added English locale forcing to prevent language detection issues
- Created test helper functions using Firebase Auth Emulator REST API instead of localStorage manipulation
- Fixed TypeScript declarations for Firebase window properties
- Updated happy-path.spec.ts to use new helper functions and proper app readiness checks
- **Resolved E2E auth test failure**: Fixed `SettingsMenu` component state persistence issue where sign-in options remained visible after sign-out, causing test failures. Implemented `effect()` to reset component state on close.

Next steps:
- Continue fixing authentication tests using new Firebase emulator API
- Update remaining test files to use proper authentication mocking
- Run incremental test verification starting with simple game flow tests
- Monitor test stability and performance with Firebase emulators
- Consider implementing push notifications for learning reminders
- Plan expansion of supported languages beyond Polish/Spanish

Active decisions and considerations:
- Framework choice: Angular v20+ for modern web-based UI with signals, standalone components, and OnPush change detection for optimal performance.
- Data storage: Start with local storage, expand to IndexedDB for word databases and user progress.
- AI integration: Use transformers.js for on-device LLM word generation to avoid server dependencies and ensure privacy.
- Learning algorithm: Implemented three-round spaced repetition system:
  - Round 1 (RECOGNIZE_EN): English→Polish recognition. If all correct, skip to summary.
  - Round 2 (RECOGNIZE_PL): Polish→English recognition, testing only words wrong in Round 1. If all correct, skip to summary.
  - Round 3 (WRITE_EN): Polish→English typing, testing only words wrong in Round 2.
- Algorithm: Basic spaced repetition where each round focuses on reinforcing mistakes from the previous round, ensuring efficient learning without wasting time on mastered content.
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
