# Core Game Rules

This document outlines the core game rules and button functionalities for BizzWords.

## Starting a New Game

When starting a new game, the user can configure the following settings:
- **Topic**: The category of words to practice (e.g., IT, HR, PM).
- **Game Mode**: Choose between `Classic` and `Blitz` mode.
- **Practice Mode**:
    - **New Words**: The game will only include words the user has never seen before.
    - **Practice**: The game will include words that the user has previously struggled with.
- **Difficulty**: The difficulty level of the words (if available for the chosen topic). Available levels are:
    - **Level 1 (Beginner)**: Basic vocabulary, easy to recognize words.
    - **Level 2 (Intermediate)**: More complex terms, moderate difficulty.
    - **Level 3 (Advanced)**: Specialized or technical terms, highest difficulty.

## Game Modes

### Classic Mode
- **Objective**: Learn and memorize new words through a series of configurable rounds.
- **Rounds**:
    - **Round 1 (Recognition - EN -> PL)**: The flashcard displays a word in English. The user thinks of the translation and then flips the card to see the correct answer in Polish.
        - **"I know" button**: The user clicks this if they knew the correct answer. The word is marked as "known".
        - **"I don't know" button**: The user clicks this if they did not know the correct answer. The word is marked as "unknown".
    - **Round 2 (Recall - PL -> EN)**: The flashcard displays a word in Polish. The user thinks of the translation and then flips the card to see the correct answer in English.
        - **"I know" button**: The user clicks this if they knew the correct answer. The word is marked as "known".
        - **"I don't know" button**: The user clicks this if they did not know the correct answer. The word is marked as "unknown".
    - **Round 3 (Writing - PL -> EN - text input)**: The flashcard displays a word in Polish. The user types the English translation into a text field.
        - **"Check" button**: The user clicks this to verify their answer. The system will indicate if the answer is correct or incorrect. Correct answers are marked as "known", incorrect as "unknown".

### Blitz Mode
- **Objective**: Quickly review a large number of words in a fast-paced environment.
- **Gameplay**: Words are displayed in rapid succession. The user must quickly decide if they know the word or not. This mode consists of the `Recognition` and `Recall` rounds.
- **Controls**:
    - **"I know" button**: Quickly mark the word as known.
    - **"I don't know" button**: Quickly mark the word as unknown.

## General Gameplay Mechanics
- **"Skip" button**: In any mode, the user can skip the current card. The card will be permanently removed from the current game session - it will not reappear in subsequent rounds, future runs, or the same game session. The card is marked as skipped and excluded from all further gameplay. When a card is skipped, it is added to a "skipped pile" and filtered out from all round transitions that source cards from the initial deck or previous round results.
+++++++ REPLACE</parameter>
- **Card Repetition on Failure**: If a user marks a card as "I don't know" or answers incorrectly in the text input round, the card will be re-introduced into the deck to be reviewed again after 3 other cards have been shown. This reinforces learning for difficult words.
- **Card Repetition on Success (Spaced Repetition)**: In Classic mode, even if a user answers a card correctly, it might be shown again later in the same round to reinforce memory. This is especially true for the first time a user sees a word. A correct answer will push the card further back in the queue (e.g., after 10 other cards).
- **Advancing Rounds**: When all cards in a round have been answered correctly (graduated), the game advances to the next round. The next round can be configured to start with all the initial words, only the words the user failed in the previous round, or only the words the user succeeded with. By default, the next round starts with all the words from the initial deck.
