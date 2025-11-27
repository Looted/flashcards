# Tech Context

Technologies used:
- Frontend: Angular v20+, TypeScript, HTML5, CSS3
- Build tool: Angular CLI for development, building, and optimized production builds
- Routing: Angular Router with lazy loading for feature modules
- Styling: Custom CSS with utility classes for responsive design
- State management: Angular signals for reactive state management
- Forms: Reactive forms for complex form handling
- PWA: Angular PWA package with service workers for offline functionality, web app manifest for installability

Development setup:
- Node.js 18+ and npm for package management
- Git for version control
- VS Code with extensions for Angular, TypeScript, and Markdown
- Angular CLI for project scaffolding and development tasks

Technical constraints:
- Browser support: Modern browsers (Chrome, Firefox, Safari, Edge)
- Data limits: LocalStorage ~5-10MB per origin; plan for IndexedDB if needed
- Offline functionality: Service workers for caching (future enhancement)
- Performance: Aim for <100ms response times for UI interactions using OnPush change detection
- AI device compatibility: WebGPU acceleration preferred for production, CPU fallback required for testing environments

Dependencies:
- Core: @angular/core, @angular/common, @angular/router, @angular/forms
- Styling: tailwindcss v4.1.17, @tailwindcss/postcss for utility-first CSS
- AI/ML: @huggingface/transformers for on-device LLM word generation with WebGPU acceleration
- Development: @angular/cli, eslint, prettier, vitest for testing
- Testing: @angular/core/testing, vitest with Angular testing utilities

Tool usage patterns:
- Use npm scripts for common tasks (ng serve, ng build, ng test)
- Commit frequently with descriptive messages
- Use branches for feature development
- Follow conventional commit format for automated versioning
- Run tests with `npm run test -- --no-watch --no-progress` for CI
- Maintain 100% test coverage using `npm run coverage -- --no-watch --no-progress`
