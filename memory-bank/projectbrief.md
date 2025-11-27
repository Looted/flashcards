# Project Brief

Project Name: Fiszki

Description: A flashcard application to help polish users learn and memorize english words through spaced repetition.

Core Requirements:
- User can create decks of flashcards with a chosen theme (e.g. IT or HR words)
- Words generated on the fly by embedded transformers.js LLM model
- Each flashcard has a front (question) and back (answer)
- Three rounds:
  - 1. Card shows word in english, when reverted shows word in polish. User confirms if they got it right.
  - 2. Card in polish, reverted shows english. User confirms.
  - 3. Card in polish, user types in english word.  System approves or not.
- Used words saved. Words the user got wrong saved.
- When starting new game, user either selects new words or practicing the ones he got wrong.
- Save progress locally or in the cloud
- Simple and intuitive UI
- Progressive Web App (PWA) with offline functionality, installable, and native app-like experience

Goals:
- Efficient learning tool built with modern Angular v20+ standards
- Cross-platform (web-based initially)
- Extensible for different subjects
- High-performance UI using signals and OnPush change detection
