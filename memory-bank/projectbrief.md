# Project Brief

Project Name: BizzWords

Description: A flashcard application to help users learn and memorize business terminology across various domains (HR, Medicine, Finance, etc.) through configurable game modes.

Core Requirements:
- **PWA**: Progressive Web App with offline functionality, installable, and native app-like experience.
- **Static Vocabulary**: The application will use a predefined, static vocabulary for the flashcards. The use of Large Language Models (LLMs) for on-the-fly word generation is a potential future enhancement.
- **Configurable Game Modes**: Users can choose from different game modes to tailor their learning experience. This includes:
    - **Classic Mode**: The standard learning mode with configurable rounds.
    - **Blitz Mode**: A fast-paced mode for quick review sessions.
- **Configurable Rounds**: Within the Classic Mode, users can configure the number and type of rounds for their study session. The rounds can include:
    - Round 1: Card shows the word in English, and the translation is revealed on flip.
    - Round 2: Card shows the word in the translated language, and the English word is revealed on flip.
    - Round 3: Card shows the word in the translated language, and the user has to type the English equivalent.
- **Progress Tracking**: User progress, including correctly and incorrectly answered words, is saved locally.
- **Practice Mode**: Users can choose to practice words they have previously answered incorrectly.
- **Simple and Intuitive UI**: A clean and user-friendly interface for a seamless learning experience.

Goals:
- Efficient learning tool built with modern Angular v20+ standards
- Cross-platform (web-based initially)
- Extensible for different subjects
- High-performance UI using signals and OnPush change detection
