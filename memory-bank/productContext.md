# Product Context

Why this project exists: To provide an effective Polish-English vocabulary learning tool using flashcards with spaced repetition and AI-generated words, addressing the need for efficient language memorization techniques.

Problems it solves: Traditional language learning methods are inefficient; spaced repetition combined with AI-generated contextual words helps reinforce vocabulary over time, reducing forgetting and providing personalized learning paths.

How it should work: Users create themed decks of flashcards (e.g., IT or HR words). Words are generated on-the-fly using an embedded transformers.js LLM model. Each learning session has three rounds: 1) English→Polish recognition, 2) Polish→English recognition, 3) Polish→English typing. Used words are saved, with incorrect words tracked for practice. New sessions allow selecting new words or practicing mistakes. The app schedules reviews using spaced repetition based on user performance.

User experience goals: Simple, intuitive interface that encourages daily language practice. Fast loading, offline capability through PWA service workers, installable as a native app, push notifications for review reminders, and progress tracking to keep users motivated.
