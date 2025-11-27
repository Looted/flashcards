# System Patterns

System architecture: Client-side web application built with Angular v20+, using standalone components and signals-based reactive architecture. Data stored locally in browser storage initially.

Key technical decisions:
- Framework: Angular v20+ with standalone components for streamlined architecture.
- Routing: Angular Router with lazy loading for feature routes to optimize bundle sizes.
- State management: Angular signals for reactive local state; computed signals for derived state.
- Change detection: OnPush strategy for optimized performance and reduced unnecessary re-renders.
- Data persistence: LocalStorage for user data; migrate to IndexedDB for larger datasets.
- Forms: Reactive forms for complex form handling with validation.
- PWA: Service workers for caching strategies, web app manifest for installability, background sync for offline data persistence.

Design patterns in use:
- Standalone components: Self-contained components without NgModules for better tree-shaking.
- Signal-based reactivity: Using signals, computed, and effects for state management.
- Component composition: Building complex UIs from reusable standalone components.
- Service injection: Using inject() function for dependency injection in components and services.

Component relationships:
- App (root standalone component) -> Header, MainContent
- MainContent -> DeckList or DeckView or ReviewView (lazy-loaded routes)
- DeckView -> CardList, AddCardForm
- ReviewView -> CardReview, ProgressBar

Critical implementation paths:
- Three-round learning algorithm: Round 1 (English→Polish recognition), Round 2 (Polish→English recognition), Round 3 (Polish→English typing with validation)
- AI word generation: transformers.js LLM integration for on-the-fly word creation based on selected themes
- Word tracking: Save used words and track incorrect answers for targeted practice sessions
- Session management: Allow users to start new sessions with fresh words or practice mistakes
- Card scheduling algorithm: Calculate next review date based on user rating (easy/hard) using pure functions.
- Data flow: User actions -> signal updates -> computed signals -> UI updates -> localStorage/IndexedDB saves.
- Performance: OnPush change detection, lazy loading, and signal reactivity for optimal performance with AI processing.
