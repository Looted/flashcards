# BizzWords - Business Terminology Flashcard Learning App

An efficient flashcard application designed to help users learn and memorize business terminology across various domains (HR, Medicine, Finance, etc.) through spaced repetition and AI-generated words. Built with modern Angular v20+ and featuring offline-first Progressive Web App capabilities.

## 🚀 Features

- **AI-Powered Word Generation**: Uses embedded transformers.js LLM models to generate contextual vocabulary on-the-fly
- **Spaced Repetition Learning**: Three progressive learning rounds:
  - English → Polish recognition
  - Polish → English recognition
  - Polish → English typing practice
- **Themed Decks**: Create custom decks for different themes (IT, HR, etc.) with difficulty levels
- **Progress Tracking**: Saves learned words and tracks mistakes for focused review
- **Vocabulary Statistics**: Persistent tracking of word performance across sessions with mastery levels and learning analytics
- **Progressive Web App**: Installable, offline-capable with service workers
- **Modern Angular**: Built with Angular v20+ signals, standalone components, and OnPush change detection
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## 🛠 Tech Stack

- **Frontend**: Angular v20+, TypeScript, HTML5, CSS3
- **Styling**: Tailwind CSS v4 with custom responsive design
- **AI/ML**: Hugging Face Transformers.js for on-device LLM word generation
- **State Management**: Angular signals for reactive state
- **PWA**: Angular PWA package with service workers
- **Build Tool**: Angular CLI with Vite
- **Testing**: Vitest with Angular testing utilities
- **Server-Side Rendering**: Angular SSR for improved performance

## 📋 Prerequisites

- Node.js 18+
- npm 11.6.2+

## 🚀 Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd fiszki
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## 🏃 Development

Start the development server:
```bash
npm start
# or
ng serve
```

The application will be available at `http://localhost:4200/`. The app will automatically reload when you make changes to the source files.

## 🏗 Building

Build the project for production:
```bash
npm run build
# or
ng build
```

The build artifacts will be stored in the `dist/` directory.

## 🚀 Deployment to GitHub Pages

This app is configured for deployment to GitHub Pages under the repository path `/bizzwords/`.

### GitHub Pages Setup

The application is deployed to `https://looted.github.io/bizzwords/` using the following configuration:

- **Deploy URL**: `/bizzwords/` - Prefixes all static assets (CSS, JS, images) with the repository path
- **Service Worker**: Configured to cache resources from the correct paths
- **Build Tool**: Uses `gh-pages` npm package for automated deployment

### Deployment Scripts

Deploy to GitHub Pages:
```bash
npm run deploy
```

This command will:
1. Build the application with production settings
2. Deploy the `dist/bizzwords/browser/` directory to the `gh-pages` branch

### Manual Deployment

If you prefer manual control:

1. Build for GitHub Pages:
   ```bash
   npm run build:gh-pages
   ```

2. Deploy using gh-pages:
   ```bash
   npx gh-pages -d dist/bizzwords/browser
   ```

### Configuration Details

- **angular.json**: Uses `"deployUrl": "/bizzwords/"` in production configuration
- **ngsw-config.json**: Service worker configured for proper caching
- **package.json**: Includes `build:gh-pages` and `deploy` scripts

**Note**: The app automatically handles static resource paths for the GitHub Pages subdirectory deployment.

## 🧪 Testing

Run unit tests:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test -- --coverage --no-watch --no-progress
```

Run a specific test suite (replace `.spec.ts` with `.*` due to a bug):
```bash
npm run test -- --no-watch --no-progress --include=src/app/app.spec.*
```

**Note**: Maintain 100% test coverage for all new code.

## 🔧 Development Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run build:gh-pages` - Build specifically for GitHub Pages deployment
- `npm run watch` - Build and watch for changes
- `npm run test` - Run unit tests
- `npm run deploy` - Build and deploy to GitHub Pages
- `npm run serve:ssr:bizzwords` - Serve SSR version

## 🌐 Progressive Web App

This app is built as a PWA and can be installed on devices:

### Installation Features
- **Install Button**: Custom "Install" button appears in the app header when the PWA is installable
- **Native App Experience**: Once installed, appears alongside platform-specific apps with custom icon
- **Standalone Mode**: Launches as a standalone app without browser UI elements
- **Cross-Platform**: Works on desktop (Chrome, Edge, Safari) and mobile (Android, iOS)

### Offline Capabilities
- **Service Workers**: Automatic caching of app resources and static vocabulary data
- **Offline-First**: Core functionality works without internet connection
- **Fast Loading**: Optimized caching strategies for improved performance

### Browser Support
- **Desktop**: Chrome, Microsoft Edge, Safari (macOS Sonoma 14+)
- **Android**: Chrome, Firefox, Samsung Internet, Opera
- **iOS**: Safari, Chrome, Edge, Firefox (iOS 16.4+)

### Technical Implementation
- **Web App Manifest**: Complete manifest with icons, display mode, and installation criteria
- **Service Worker**: Angular PWA package with custom caching configuration
- **Install Prompt**: Custom handling of `beforeinstallprompt` event for seamless installation
- **SSR Compatible**: Proper browser detection to avoid server-side rendering issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and ensure tests pass
4. Commit with conventional commit format
5. Push to your fork and submit a pull request

## 📄 License

This project is private and proprietary.

## 📞 Support

For questions or support, please refer to the project documentation or create an issue in the repository.
