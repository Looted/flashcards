# Tech Context

Technologies used:
- Frontend: Angular v20+, TypeScript, HTML5, CSS3
- Build tool: Angular CLI for development, building, and optimized production builds
- Routing: Angular Router with lazy loading for feature modules
- Styling: Custom CSS with utility classes for responsive design
- State management: Angular signals for reactive state management; migrate from FormsModule/ngModel to signal-based [value] and (change) bindings for optimal performance
- Authentication: Firebase Auth with Google OAuth and email/password providers
- Cloud storage: Firebase Firestore for user data synchronization and persistence
- Forms: Reactive forms for complex form handling
- PWA: Angular PWA package with service workers for offline functionality, web app manifest for installability, custom install button with beforeinstallprompt event handling, SSR-compatible browser detection
- Data persistence: Hybrid @capacitor/preferences (guest) + Firestore (authenticated) for tracking word performance, mastery levels, and learning statistics across sessions
- Testing: Playwright for E2E tests with Firebase emulators for isolated testing

Development setup:
- Node.js 20+ and npm for package management
- Git for version control
- VS Code with extensions for Angular, TypeScript, and Markdown
- Angular CLI for project scaffolding and development tasks

Technical constraints:
- Browser support: Modern browsers (Chrome, Firefox, Safari, Edge)
- Data limits: LocalStorage ~5-10MB per origin; plan for IndexedDB if needed
- Offline functionality: Service workers for caching
- Performance: Aim for <100ms response times for UI interactions using OnPush change detection
- AI device compatibility: WebGPU acceleration preferred for production, CPU fallback required for testing environments

Dependencies:
- Core: @angular/core, @angular/common, @angular/router, @angular/forms
- Firebase: @angular/fire for Firebase Auth and Firestore integration
- Styling: tailwindcss v4.1.17, @tailwindcss/postcss for utility-first CSS
- AI/ML: @huggingface/transformers for on-device LLM word generation with WebGPU acceleration
- Development: @angular/cli, eslint, prettier, vitest for testing
- Testing: @angular/core/testing, vitest with Angular testing utilities, Playwright for E2E testing

Tool usage patterns:
- Use npm scripts for common tasks (ng serve, ng build, ng test)
- Commit frequently with descriptive messages
- Use branches for feature development
- Follow conventional commit format for automated versioning
- Run tests with `npm run test` for CI (use `--include` for specific files)
- Run E2E tests with `npm run e2e:safe` which uses local Firebase emulators to avoid affecting production data.
- Maintain 100% test coverage using `npm run test -- --coverage`

## Data Models

### Schema Migration
The application uses a versioned schema migration system:
- **Location**: `src/app/migrations/`
- **Structure**: Individual migration files (e.g., `001-integrity-check.ts`) export objects implementing `Migration` interface.
- **Service**: `SchemaMigrationService` orchestrates migrations by comparing current schema version (from `localStorage` or `Firestore` profile) with the latest version defined in `src/app/migrations/index.ts`.
- **Migrations**:
  - `v1`: Data integrity check and normalization.
  - `v2`: Clear vocabulary stats (due to category rework).

### Word Model
The Word model represents vocabulary items in the flashcard system with the following fields:

- `id`: Unique identifier for the word
- `term`: The English term/word being learned
- `definition`: The English definition/explanation of the term (displayed on card flip)
- `example`: Example sentence showing the term in context
- `metadata`: Additional information including difficulty level and tags/categories
- `term_translation`: Polish translation of the term
- `definition_translation`: Polish translation of the definition
- `example_translation`: Polish translation of the example sentence
- `isFree`: Boolean flag indicating if word is accessible to free users (part of freemium system)

### User Model
The User model extends Firebase Auth user data with application-specific fields:

- `uid`: Firebase user ID
- `email`: User email address
- `displayName`: User's display name
- `photoURL`: Profile photo URL
- `createdAt`: Account creation timestamp
- `lastLogin`: Last login timestamp
- `hasMigratedLocalData`: Flag indicating if local data has been migrated to cloud
- `settings`: User preferences (native language, theme, etc.)
- `schemaVersion`: Schema migration version for data compatibility
- `isPremium`: Boolean flag indicating premium subscription status (freemium system)

### Freemium Architecture
The application implements a comprehensive freemium model with the following technical components:

**Content Tagging System:**
- **Script**: `scripts/apply-freemium-rules.mjs` processes all vocabulary JSON files
- **Logic**: Tags words as `isFree: true` based on difficulty tiers:
  - 36 Easy words (difficulty: 1)
  - 18 Medium words (difficulty: 2)
  - 6 Hard words (difficulty: 3)
- **Result**: ~60 free words per category, ~180 total free words across all categories

**Service Layer Implementation:**
- **StaticVocabularyService**: Extended with `isPremium` parameter in `generateTranslatedWords()` and new `getAvailableWordsCount()` method
- **AuthService**: Added `isPremiumUser()` method to check premium status from Firestore
- **GameService**: Enhanced `startGame()` to handle premium filtering and shortened rounds

**UI Components:**
- **MenuComponent**: Added freemium logic with visual feedback:
  - Blue buttons: Content available (ready to play)
  - Gold buttons: Content exhausted (paywall/upsell state)
  - Difficulty pills: Visual indication of exhausted tiers

**Business Logic:**
- **Content Restrictions**: Non-premium users only see free-tagged words
- **Shortened Rounds**: Games adapt when insufficient words available:
  - Classic mode: Requires ≥5 words, otherwise uses available count
  - Blitz mode: Requires ≥20 words, otherwise uses available count
- **Premium Bypass**: Premium users access all 150+ words per category without restrictions
