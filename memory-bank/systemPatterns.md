# System Patterns

System architecture: Client-side web application built with Angular v20+, using standalone components and signals-based reactive architecture. Data stored locally in browser storage initially, with Firebase integration for cloud sync.

Key technical decisions:
- Framework: Angular v20+ with standalone components for streamlined architecture.
- Routing: Angular Router with lazy loading for feature routes to optimize bundle sizes.
- State management: Angular signals for reactive local state; computed signals for derived state.
- Change detection: OnPush strategy for optimized performance and reduced unnecessary re-renders.
- Data persistence: LocalStorage for guest users; Firestore for authenticated users with automatic migration.
- Authentication: Firebase Auth with Google and email/password providers, signals-based reactive auth state.
- Cloud storage: Firestore for user profiles, vocabulary statistics, and progress sync across devices.
- Forms: Reactive forms for complex form handling with validation.
- PWA: Service workers for caching strategies, web app manifest for installability, background sync for offline data persistence.
- Navigation: Slide-over settings menu replacing dedicated settings page for mobile-first experience.

Design patterns in use:
- Standalone components: Self-contained components without NgModules for better tree-shaking.
- Signal-based reactivity: Using signals, computed, and effects for state management.
- Component composition: Building complex UIs from reusable standalone components.
- Service injection: Using inject() function for dependency injection in components and services.
- Signal migration patterns: Replace FormsModule/ngModel with [value] and (change) bindings, use service setters instead of direct signal.set() for better encapsulation, handle complex event casting in component methods.
- Service signal access: Use getter methods to access service signals instead of direct property assignment for better encapsulation and API consistency.
- Template event handling: Handle complex event type casting in component methods rather than inlining in templates for better maintainability and to avoid template parser limitations.
- Modular worker architecture: AI worker split into focused modules (models, parsing, message handling) for better testability and maintainability.
- Singleton pattern: AI model pipelines use lazy-loaded singletons to avoid redundant initialization.
- Component state reset: Modal/Menu components using signals and OnPush strategy must explicitly reset internal state (using effects or inputs) when closed, as component instances persist in the DOM.
- Schema Migration: Modular, versioned migration system located in `src/app/migrations/` to handle data schema updates for both local storage and Firestore. Migrations are defined as objects implementing `Migration` interface and registered in an index file.

Testing patterns:
- Mock external dependencies: Use vi.mock() to isolate units from external libraries (transformers.js, browser APIs).
- Pipeline mocking strategy: Mock Hugging Face transformers pipeline with task-specific return values for AI testing.
- Singleton reset: Clear singleton instances between tests to ensure test isolation.
- Progress callback testing: Mock progress_callback parameters in pipeline options for async operation testing.
- Device compatibility: Use CPU fallback for AI models in test environments when WebGPU is unavailable.
- Error scenario coverage: Test various error conditions including device support, network failures, and invalid inputs.
- Segfault handling: If tests result in segfaults, rerun them as the issue may be transient.

Component relationships:
- App (root standalone component) -> Header, RouterOutlet
- RouterOutlet -> MenuComponent, GameComponent, SummaryComponent (via routes)
- GameComponent -> FlashcardComponent, ProgressBar
- DeckView -> CardList, AddCardForm (future)
- ReviewView -> CardReview, ProgressBar (future)

Critical implementation paths:
- Three-round learning algorithm: Round 1 (English→Polish recognition), Round 2 (Polish→English recognition), Round 3 (Polish→English typing with validation)
- AI word generation: transformers.js LLM integration for on-the-fly word creation based on selected themes
- Word tracking: Save used words and track incorrect answers for targeted practice sessions
- Session management: Allow users to start new sessions with fresh words or practice mistakes
- Card scheduling algorithm: Calculate next review date based on user rating (easy/hard) using pure functions.
- Data flow: User actions -> signal updates -> computed signals -> UI updates -> localStorage/IndexedDB saves.
- Performance: OnPush change detection, lazy loading, and signal reactivity for optimal performance with AI processing.

## Native Language Switcher

The language switcher controls the **native/translation language** for flashcard learning, NOT the UI language.

- **UI Language**: Always English
- **Native Language**: Polish (PL) or Spanish (ES) currently, with more languages planned (German, French, etc.)
- **Purpose**: Users learn English business terminology with translations shown in their selected native language
- **Design**: "Native language: PL | ES" with globe icon, always visible in header
- **Auto-detect**: Automatically detects user's browser language on first visit, falls back to Polish
- **State**: Saved in localStorage, persists across sessions
- **Brand**: Indigo-600 active color, rounded-lg, font-medium, fully accessible with focus rings

This design supports the use case of bilingual users who may want to switch between their known languages (e.g., a Polish-Spanish speaker practicing English).

### Game State Protection
The native language switcher is automatically disabled when user is in an active game (`/game` route):
- Buttons become grayed out (`opacity-50`, `text-gray-400`)
- Cursor changes to `cursor-not-allowed`
- Tooltip appears on hover: "Finish your game to change language"
- Clicks are blocked both via `[disabled]` attribute and guard in `changeLanguage()` method
- Re-enables automatically on menu, summary, or other non-game screens

## Firebase Authentication & Authorization

Firebase Auth provides seamless user authentication with multiple providers and automatic session management.

### Implementation Details
- **Providers**: Google OAuth, Email/Password authentication
- **State Management**: Signals-based reactive auth state (`AuthService`)
- **Session Persistence**: Automatic Firebase session persistence with localStorage
- **User Profile**: Basic profile data (email, displayName, photoURL) stored in Firestore
- **Migration**: Automatic migration of guest user data to authenticated user accounts
- **UI Integration**: Header displays user avatar/initials or hamburger menu for guest users

### Auth Flow
1. **Guest Access**: Users can play games without authentication
2. **Sign-in Options**: Click user menu → "Sign In" → Choose provider
3. **Email Sign-in**: Modal dialog with email/password fields and mode toggle
4. **Google Sign-in**: Popup-based OAuth flow
5. **Data Migration**: Guest progress automatically migrates to authenticated account
6. **Sign-out**: Available in settings menu with confirmation

### Security Considerations
- Client-side only authentication (no custom backend)
- Firebase security rules protect user data
- Automatic token refresh handled by Firebase SDK
- Test environment uses Firebase emulators for isolated testing

## Firestore Cloud Storage

Firestore provides real-time cloud storage for user data synchronization across devices.

### Data Structure
```
users/{userId}/
├── profile: { email, displayName, photoURL, createdAt, hasMigratedLocalData }
├── vocabularyStats: { categoryId: { totalLearned, needsPractice, lastPlayed } }
├── sessions: { sessionId: { date, score, duration, category, gameMode } }
└── settings: { theme, language, notifications }
```

### Implementation Details
- **Service**: `FirestoreService` with typed CRUD operations
- **Offline Support**: Automatic offline caching with online sync
- **Migration**: One-time migration of localStorage data to Firestore
- **Real-time**: Live updates for shared data (future feature)
- **Security**: User-scoped data with Firebase security rules

### Sync Strategy
- **Guest Mode**: All data stored in localStorage
- **Authenticated**: Data syncs to/from Firestore on sign-in
- **Conflict Resolution**: Server-side timestamp-based conflict resolution
- **Backup**: LocalStorage serves as offline backup and cache

## Hamburger Menu & Settings UI

Mobile-first slide-over menu replaces traditional settings page for better UX.

### Implementation Details
- **Trigger**: Hamburger icon (guest) or user avatar/initials (authenticated)
- **Animation**: Smooth slide-in from right with backdrop blur
- **Content**: Auth section, settings section, navigation links
- **Accessibility**: Proper ARIA attributes, keyboard navigation, focus management
- **Responsive**: Full-width on mobile, fixed width on desktop

### Menu Sections
1. **Account Section**:
   - User profile display (authenticated users)
   - Sign-in options (guest users)
   - Sign-out button (authenticated users)

2. **Settings Section**:
   - Theme toggle (light/dark/system)
   - Language selector (dropdown buttons)
   - Future settings (notifications, etc.)

3. **Links Section**:
   - About page navigation
   - Privacy policy navigation
   - Help/support links

### Technical Features
- **State Management**: Signals for menu open/close state
- **Event Handling**: Backdrop click and escape key close menu
- **Positioning**: Fixed positioning with z-index management
- **Styling**: Tailwind CSS with consistent design system
- **Testing**: Comprehensive test IDs for e2e testing
