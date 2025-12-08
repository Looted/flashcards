import { TestBed } from '@angular/core/testing';
import { MockComponent } from 'ng-mocks';
import { CardRendererComponent } from './card-renderer.component';
import { FlashcardComponent } from './flashcard/flashcard.component';
import { TypingCardComponent } from './typing-card/typing-card.component';
import { Flashcard } from '../../../game-store';
import { LayoutPolicy } from '../../../core/models/game-config.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('CardRendererComponent', () => {
  let component: CardRendererComponent;
  let fixture: any;

  const mockCard: Flashcard = {
    id: '1',
    english: 'hello',
    translations: { polish: 'cześć' },
    category: 'basic',
    masteryLevel: 1,
    definition: ''
  };

  const mockLayoutConfig: LayoutPolicy = {
    templateId: 'flashcard_standard',
    dataMap: {
      primary: 'english',
      secondary: 'polish'
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardRendererComponent]
    })
    .overrideComponent(CardRendererComponent, {
      set: {
        imports: [
          MockComponent(FlashcardComponent),
          MockComponent(TypingCardComponent)
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardRendererComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('frontText computed', () => {
    it('should return primary field value', () => {
      (component as any).card = () => mockCard;
      (component as any).layoutConfig = () => mockLayoutConfig;

      expect(component.frontText()).toBe('hello');
    });

    it('should handle different primary fields', () => {
      const configWithPolish: LayoutPolicy = {
        ...mockLayoutConfig,
        dataMap: { ...mockLayoutConfig.dataMap, primary: 'polish' }
      };

      (component as any).card = () => mockCard;
      (component as any).layoutConfig = () => configWithPolish;

      expect(component.frontText()).toBe('cześć');
    });

    it('should return empty string when config is null', () => {
      (component as any).card = () => mockCard;
      (component as any).layoutConfig = () => null;

      expect(component.frontText()).toBe('');
    });

    it('should return empty string when field is not found', () => {
      const configWithUnknown: LayoutPolicy = {
        ...mockLayoutConfig,
        dataMap: { ...mockLayoutConfig.dataMap, primary: 'german' as any }
      };

      (component as any).card = () => mockCard;
      (component as any).layoutConfig = () => configWithUnknown;

      expect(component.frontText()).toBe('');
    });
  });

  describe('backText computed', () => {
    it('should return secondary field value', () => {
      (component as any).card = () => mockCard;
      (component as any).layoutConfig = () => mockLayoutConfig;

      expect(component.backText()).toBe('cześć');
    });

    it('should handle different secondary fields', () => {
      const configWithEnglish: LayoutPolicy = {
        ...mockLayoutConfig,
        dataMap: { ...mockLayoutConfig.dataMap, secondary: 'english' }
      };

      (component as any).card = () => mockCard;
      (component as any).layoutConfig = () => configWithEnglish;

      expect(component.backText()).toBe('hello');
    });

    it('should return empty string when config is null', () => {
      (component as any).card = () => mockCard;
      (component as any).layoutConfig = () => null;

      expect(component.backText()).toBe('');
    });

    it('should return empty string when field is not found', () => {
      const configWithUnknown: LayoutPolicy = {
        ...mockLayoutConfig,
        dataMap: { ...mockLayoutConfig.dataMap, secondary: 'german' as any }
      };

      (component as any).card = () => mockCard;
      (component as any).layoutConfig = () => configWithUnknown;

      expect(component.backText()).toBe('');
    });
  });

  describe('frontLabel computed', () => {
    it('should return "English" when primary is english', () => {
      (component as any).layoutConfig = () => mockLayoutConfig;
      expect(component.frontLabel()).toBe('English');
    });

    it('should return "Polish" when primary is polish', () => {
      const configWithPolish: LayoutPolicy = {
        ...mockLayoutConfig,
        dataMap: { ...mockLayoutConfig.dataMap, primary: 'polish' }
      };

      (component as any).layoutConfig = () => configWithPolish;
      expect(component.frontLabel()).toBe('Polish');
    });

    it('should return "Front" when config is null', () => {
      (component as any).layoutConfig = () => null;
      expect(component.frontLabel()).toBe('Front');
    });
  });

  describe('backLabel computed', () => {
    it('should return "English" when secondary is english', () => {
      const configWithEnglishSecondary: LayoutPolicy = {
        ...mockLayoutConfig,
        dataMap: { ...mockLayoutConfig.dataMap, secondary: 'english' }
      };

      (component as any).layoutConfig = () => configWithEnglishSecondary;
      expect(component.backLabel()).toBe('English');
    });

    it('should return "Polish" when secondary is polish', () => {
      (component as any).layoutConfig = () => mockLayoutConfig;
      expect(component.backLabel()).toBe('Polish');
    });

    it('should return "Back" when config is null', () => {
      (component as any).layoutConfig = () => null;
      expect(component.backLabel()).toBe('Back');
    });
  });

  describe('onAnswerSubmitted', () => {
    it('should emit answerSubmitted event', () => {
      const mockEmit = vi.fn();
      component.answerSubmitted.emit = mockEmit;

      const event = { success: true };
      component.onAnswerSubmitted(event);

      expect(mockEmit).toHaveBeenCalledWith(event);
    });
  });

  describe('resetFlip', () => {
    it('should call resetFlip on flashcard component when available', () => {
      const mockFlashcard = { resetFlip: vi.fn() };
      component.flashcard = mockFlashcard as any;

      component.resetFlip();

      expect(mockFlashcard.resetFlip).toHaveBeenCalled();
    });

    it('should not throw when flashcard is not available', () => {
      component.flashcard = undefined;

      expect(() => component.resetFlip()).not.toThrow();
    });
  });

  describe('Template rendering', () => {
    it('should render flashcard component for flashcard_standard template', () => {
      (component as any).card = () => mockCard;
      (component as any).layoutConfig = () => mockLayoutConfig;

      fixture.detectChanges();

      const flashcardElement = fixture.nativeElement.querySelector('app-flashcard');
      expect(flashcardElement).toBeTruthy();
    });

    it('should render typing card component for typing_challenge template', () => {
      const typingConfig: LayoutPolicy = {
        templateId: 'typing_challenge',
        dataMap: {
          primary: 'polish',
          secondary: 'english'
        }
      };

      (component as any).card = () => mockCard;
      (component as any).layoutConfig = () => typingConfig;

      fixture.detectChanges();

      const typingCardElement = fixture.nativeElement.querySelector('app-typing-card');
      expect(typingCardElement).toBeTruthy();
    });

    it('should default to flashcard_standard when templateId is not specified', () => {
      const configWithoutTemplate: LayoutPolicy = {
        templateId: '' as any,
        dataMap: {
          primary: 'english',
          secondary: 'polish'
        }
      };

      (component as any).card = () => mockCard;
      (component as any).layoutConfig = () => configWithoutTemplate;

      fixture.detectChanges();

      const flashcardElement = fixture.nativeElement.querySelector('app-flashcard');
      expect(flashcardElement).toBeTruthy();
    });

    it('should not render any card component for unknown templateId', () => {
      const unknownConfig: LayoutPolicy = {
        templateId: 'unknown_template' as any,
        dataMap: {
          primary: 'english',
          secondary: 'polish'
        }
      };

      (component as any).card = () => mockCard;
      (component as any).layoutConfig = () => unknownConfig;

      fixture.detectChanges();

      const flashcardElement = fixture.nativeElement.querySelector('app-flashcard');
      const typingCardElement = fixture.nativeElement.querySelector('app-typing-card');
      expect(flashcardElement).toBeFalsy();
      expect(typingCardElement).toBeFalsy();
    });
  });
});
