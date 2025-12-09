import { TestBed } from '@angular/core/testing';
import { FlashcardComponent } from './flashcard.component';
import { GameStore } from '../../../../game-store';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('FlashcardComponent', () => {
  let component: FlashcardComponent;
  let fixture: any;
  let mockStore: any;

  beforeEach(async () => {
    mockStore = {
      currentRoundConfig: signal(null),
      currentCard: signal(null)
    };

    await TestBed.configureTestingModule({
      imports: [FlashcardComponent],
      providers: [
        { provide: GameStore, useValue: mockStore }
      ]
    })
    .overrideComponent(FlashcardComponent, {
      set: {
        providers: []
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlashcardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should start with card not flipped', () => {
    expect(component.isFlipped()).toBe(false);
  });

  it('should flip card when clicked', () => {
    component.flip();
    expect(component.isFlipped()).toBe(true);

    component.flip();
    expect(component.isFlipped()).toBe(false);
  });

  it('should reset flip when resetFlip is called', () => {
    component.flip();
    expect(component.isFlipped()).toBe(true);

    component.resetFlip();
    expect(component.isFlipped()).toBe(false);
  });

  describe('displayFrontLabel', () => {
    it('should return provided frontLabel when available', () => {
      fixture.componentRef.setInput('frontLabel', 'Custom Front');
      expect(component.displayFrontLabel()).toBe('Custom Front');
    });

    it('should return "English" when primary is english', () => {
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { primary: 'english' } }
      });
      expect(component.displayFrontLabel()).toBe('English');
    });

    it('should return native language display name when primary is polish', () => {
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { primary: 'polish' } }
      });
      expect(component.displayFrontLabel()).toBe('Polski');
    });

    it('should return "Front" when no config available', () => {
      mockStore.currentRoundConfig.set(null);
      expect(component.displayFrontLabel()).toBe('Front');
    });

    it('should return field name for contextSentence', () => {
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { primary: 'contextSentence' } }
      });
      expect(component.displayFrontLabel()).toBe('contextSentence');
    });

    it('should return field name for translation', () => {
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { primary: 'translation' } }
      });
      expect(component.displayFrontLabel()).toBe('translation');
    });
  });

  describe('displayFrontText', () => {
    it('should return provided frontText when available', () => {
      fixture.componentRef.setInput('frontText', 'Custom Text');
      expect(component.displayFrontText()).toBe('Custom Text');
    });

    it('should return english text when primary is english', () => {
      mockStore.currentCard.set({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { primary: 'english' } }
      });
      expect(component.displayFrontText()).toBe('hello');
    });

    it('should return polish text when primary is polish', () => {
      mockStore.currentCard.set({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { primary: 'polish' } }
      });
      expect(component.displayFrontText()).toBe('cześć');
    });

    it('should return empty string when no card or config', () => {
      mockStore.currentCard.set(null);
      mockStore.currentRoundConfig.set(null);
      expect(component.displayFrontText()).toBe('');
    });

    it('should return empty string for contextSentence field', () => {
      mockStore.currentCard.set({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { primary: 'contextSentence' } }
      });
      expect(component.displayFrontText()).toBe('');
    });

    it('should return empty string for translation field', () => {
      mockStore.currentCard.set({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { primary: 'translation' } }
      });
      expect(component.displayFrontText()).toBe('');
    });

    it('should return empty string when translation not found', () => {
      mockStore.currentCard.set({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { primary: 'german' } }
      });
      expect(component.displayFrontText()).toBe('');
    });
  });

  describe('displayBackLabel', () => {
    it('should return provided backLabel when available', () => {
      fixture.componentRef.setInput('backLabel', 'Custom Back');
      expect(component.displayBackLabel()).toBe('Custom Back');
    });

    it('should return "English" when secondary is english', () => {
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { secondary: 'english' } }
      });
      expect(component.displayBackLabel()).toBe('English');
    });

    it('should return native language display name when secondary is polish', () => {
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { secondary: 'polish' } }
      });
      expect(component.displayBackLabel()).toBe('Polski');
    });

    it('should return "Back" when no config available', () => {
      mockStore.currentRoundConfig.set(null);
      expect(component.displayBackLabel()).toBe('Back');
    });

    it('should return field name for contextSentence secondary', () => {
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { secondary: 'contextSentence' } }
      });
      expect(component.displayBackLabel()).toBe('contextSentence');
    });

    it('should return field name for translation secondary', () => {
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { secondary: 'translation' } }
      });
      expect(component.displayBackLabel()).toBe('translation');
    });
  });

  describe('displayBackText', () => {
    it('should return provided backText when available', () => {
      fixture.componentRef.setInput('backText', 'Custom Text');
      expect(component.displayBackText()).toBe('Custom Text');
    });

    it('should return english text when secondary is english', () => {
      mockStore.currentCard.set({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { secondary: 'english' } }
      });
      expect(component.displayBackText()).toBe('hello');
    });

    it('should return polish text when secondary is polish', () => {
      mockStore.currentCard.set({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { secondary: 'polish' } }
      });
      expect(component.displayBackText()).toBe('cześć');
    });

    it('should return empty string when no card or config', () => {
      mockStore.currentCard.set(null);
      mockStore.currentRoundConfig.set(null);
      expect(component.displayBackText()).toBe('');
    });

    it('should return empty string for contextSentence secondary field', () => {
      mockStore.currentCard.set({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { secondary: 'contextSentence' } }
      });
      expect(component.displayBackText()).toBe('');
    });

    it('should return empty string for translation secondary field', () => {
      mockStore.currentCard.set({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { secondary: 'translation' } }
      });
      expect(component.displayBackText()).toBe('');
    });

    it('should return empty string when secondary translation not found', () => {
      mockStore.currentCard.set({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { secondary: 'german' } }
      });
      expect(component.displayBackText()).toBe('');
    });
  });

  describe('textSizeClass', () => {
    it('should return large text size for short text (front)', () => {
      fixture.componentRef.setInput('frontText', 'Short');
      expect(component.textSizeClass()).toBe('text-2xl sm:text-3xl md:text-4xl');
    });

    it('should return large text size for short text (back)', () => {
      component.flip(); // flip to back
      fixture.componentRef.setInput('backText', 'Short');
      expect(component.textSizeClass()).toBe('text-2xl sm:text-3xl md:text-4xl');
    });

    it('should return medium text size for medium length text', () => {
      const mediumText = 'A'.repeat(45); // length 45
      fixture.componentRef.setInput('frontText', mediumText);
      expect(component.textSizeClass()).toBe('text-xl sm:text-2xl md:text-3xl');
    });

    it('should return small text size for long text', () => {
      const longText = 'A'.repeat(65); // length 65
      fixture.componentRef.setInput('frontText', longText);
      expect(component.textSizeClass()).toBe('text-lg sm:text-xl md:text-2xl');
    });

    it('should handle text from store when inputs not provided', () => {
      mockStore.currentCard.set({ english: 'A'.repeat(50), translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.set({
        layout: { dataMap: { primary: 'english', secondary: 'polish' } }
      });
      expect(component.textSizeClass()).toBe('text-xl sm:text-2xl md:text-3xl');
    });
  });

  describe('displayBackDefinition', () => {
    it('should return empty string when no backDefinition provided', () => {
      expect(component.displayBackDefinition()).toBe('');
    });

    it('should return provided backDefinition', () => {
      fixture.componentRef.setInput('backDefinition', 'This is a definition');
      expect(component.displayBackDefinition()).toBe('This is a definition');
    });

    it('should return empty string when backDefinition is empty', () => {
      fixture.componentRef.setInput('backDefinition', '');
      expect(component.displayBackDefinition()).toBe('');
    });
  });
});
