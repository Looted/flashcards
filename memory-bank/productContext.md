# Product Context

Why this project exists: To provide an effective business terminology learning tool using flashcards with spaced repetition and AI-generated words, addressing the need for efficient memorization of business vocabulary across various domains (HR, Medicine, Finance, etc.).

Problems it solves: Traditional memorization methods are inefficient; spaced repetition combined with AI-generated contextual business terms helps reinforce vocabulary over time, reducing forgetting and providing personalized learning paths for professionals.

How it should work: Users create themed decks of flashcards (e.g., HR, Medicine, or Finance terms) with optional difficulty level selection (beginner/intermediate/advanced/all levels). Words are generated on-the-fly using an embedded transformers.js LLM model that respects the selected difficulty level. Users can choose between static vocabulary sets or AI-generated words. Each learning session has three rounds: 1) English→Polish recognition, 2) Polish→English recognition, 3) Polish→English typing. Used words are saved, with incorrect words tracked for practice. New sessions allow selecting new words or practicing mistakes. The app schedules reviews using spaced repetition based on user performance.

User experience goals: Simple, intuitive interface that encourages daily professional vocabulary practice. Fast loading, offline capability through PWA service workers, installable as a native app, push notifications for review reminders, and progress tracking to keep users motivated.
