import { TestBed } from '@angular/core/testing';
import { FlashcardComponent } from './flashcard.component';
import { GameStore } from '../../../../game-store';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('FlashcardComponent', () => {
  let component: FlashcardComponent;
  let fixture: any;
  let mockStore: any;

  beforeEach(async () => {
    mockStore = {
      currentRoundConfig: vi.fn(),
      currentCard: vi.fn()
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
      (component as any).frontLabel = () => 'Custom Front';
      expect(component.displayFrontLabel()).toBe('Custom Front');
    });

    it('should return "English" when primary is english', () => {
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { primary: 'english' } }
      });
      expect(component.displayFrontLabel()).toBe('English');
    });

    it('should return native language display name when primary is polish', () => {
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { primary: 'polish' } }
      });
      expect(component.displayFrontLabel()).toBe('Polski');
    });

    it('should return "Front" when no config available', () => {
      mockStore.currentRoundConfig.mockReturnValue(null);
      expect(component.displayFrontLabel()).toBe('Front');
    });

    it('should return field name for contextSentence', () => {
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { primary: 'contextSentence' } }
      });
      expect(component.displayFrontLabel()).toBe('contextSentence');
    });

    it('should return field name for translation', () => {
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { primary: 'translation' } }
      });
      expect(component.displayFrontLabel()).toBe('translation');
    });
  });

  describe('displayFrontText', () => {
    it('should return provided frontText when available', () => {
      (component as any).frontText = () => 'Custom Text';
      expect(component.displayFrontText()).toBe('Custom Text');
    });

    it('should return english text when primary is english', () => {
      mockStore.currentCard.mockReturnValue({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { primary: 'english' } }
      });
      expect(component.displayFrontText()).toBe('hello');
    });

    it('should return polish text when primary is polish', () => {
      mockStore.currentCard.mockReturnValue({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { primary: 'polish' } }
      });
      expect(component.displayFrontText()).toBe('cześć');
    });

    it('should return empty string when no card or config', () => {
      mockStore.currentCard.mockReturnValue(null);
      mockStore.currentRoundConfig.mockReturnValue(null);
      expect(component.displayFrontText()).toBe('');
    });

    it('should return empty string for contextSentence field', () => {
      mockStore.currentCard.mockReturnValue({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { primary: 'contextSentence' } }
      });
      expect(component.displayFrontText()).toBe('');
    });

    it('should return empty string for translation field', () => {
      mockStore.currentCard.mockReturnValue({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { primary: 'translation' } }
      });
      expect(component.displayFrontText()).toBe('');
    });

    it('should return empty string when translation not found', () => {
      mockStore.currentCard.mockReturnValue({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { primary: 'german' } }
      });
      expect(component.displayFrontText()).toBe('');
    });
  });

  describe('displayBackLabel', () => {
    it('should return provided backLabel when available', () => {
      (component as any).backLabel = () => 'Custom Back';
      expect(component.displayBackLabel()).toBe('Custom Back');
    });

    it('should return "English" when secondary is english', () => {
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { secondary: 'english' } }
      });
      expect(component.displayBackLabel()).toBe('English');
    });

    it('should return native language display name when secondary is polish', () => {
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { secondary: 'polish' } }
      });
      expect(component.displayBackLabel()).toBe('Polski');
    });

    it('should return "Back" when no config available', () => {
      mockStore.currentRoundConfig.mockReturnValue(null);
      expect(component.displayBackLabel()).toBe('Back');
    });

    it('should return field name for contextSentence secondary', () => {
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { secondary: 'contextSentence' } }
      });
      expect(component.displayBackLabel()).toBe('contextSentence');
    });

    it('should return field name for translation secondary', () => {
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { secondary: 'translation' } }
      });
      expect(component.displayBackLabel()).toBe('translation');
    });
  });

  describe('displayBackText', () => {
    it('should return provided backText when available', () => {
      (component as any).backText = () => 'Custom Text';
      expect(component.displayBackText()).toBe('Custom Text');
    });

    it('should return english text when secondary is english', () => {
      mockStore.currentCard.mockReturnValue({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { secondary: 'english' } }
      });
      expect(component.displayBackText()).toBe('hello');
    });

    it('should return polish text when secondary is polish', () => {
      mockStore.currentCard.mockReturnValue({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { secondary: 'polish' } }
      });
      expect(component.displayBackText()).toBe('cześć');
    });

    it('should return empty string when no card or config', () => {
      mockStore.currentCard.mockReturnValue(null);
      mockStore.currentRoundConfig.mockReturnValue(null);
      expect(component.displayBackText()).toBe('');
    });

    it('should return empty string for contextSentence secondary field', () => {
      mockStore.currentCard.mockReturnValue({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { secondary: 'contextSentence' } }
      });
      expect(component.displayBackText()).toBe('');
    });

    it('should return empty string for translation secondary field', () => {
      mockStore.currentCard.mockReturnValue({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { secondary: 'translation' } }
      });
      expect(component.displayBackText()).toBe('');
    });

    it('should return empty string when secondary translation not found', () => {
      mockStore.currentCard.mockReturnValue({ english: 'hello', translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { secondary: 'german' } }
      });
      expect(component.displayBackText()).toBe('');
    });
  });

  describe('textSizeClass', () => {
    it('should return large text size for short text (front)', () => {
      (component as any).frontText = () => 'Short';
      expect(component.textSizeClass()).toBe('text-2xl sm:text-3xl md:text-4xl');
    });

    it('should return large text size for short text (back)', () => {
      component.flip(); // flip to back
      (component as any).backText = () => 'Short';
      expect(component.textSizeClass()).toBe('text-2xl sm:text-3xl md:text-4xl');
    });

    it('should return medium text size for medium length text', () => {
      const mediumText = 'A'.repeat(45); // length 45
      (component as any).frontText = () => mediumText;
      expect(component.textSizeClass()).toBe('text-xl sm:text-2xl md:text-3xl');
    });

    it('should return small text size for long text', () => {
      const longText = 'A'.repeat(65); // length 65
      (component as any).frontText = () => longText;
      expect(component.textSizeClass()).toBe('text-lg sm:text-xl md:text-2xl');
    });

    it('should handle text from store when inputs not provided', () => {
      mockStore.currentCard.mockReturnValue({ english: 'A'.repeat(50), translations: { polish: 'cześć' } });
      mockStore.currentRoundConfig.mockReturnValue({
        layout: { dataMap: { primary: 'english', secondary: 'polish' } }
      });
      expect(component.textSizeClass()).toBe('text-xl sm:text-2xl md:text-3xl');
    });
  });
});
