import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { TypingCardComponent } from './typing-card.component';
import { GAME_CONSTANTS } from '../../../../shared/constants';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('TypingCardComponent', () => {
  let component: TypingCardComponent;
  let fixture: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypingCardComponent, ReactiveFormsModule]
    })
    .overrideComponent(TypingCardComponent, {
      set: {
        providers: []
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(TypingCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize form control', () => {
      expect(component.inputControl).toBeDefined();
      expect(component.inputControl.value).toBe('');
    });

    it('should initialize signals', () => {
      expect(component.typingFeedback()).toBeNull();
      expect(component.isPaused()).toBe(false);
    });
  });

  describe('checkTyping', () => {
    beforeEach(() => {
      (component as any).promptText = () => 'cześć';
      (component as any).expectedAnswer = () => 'hello';
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should do nothing if input is empty', () => {
      component.inputControl.setValue('');
      component.checkTyping();

      expect(component.typingFeedback()).toBeNull();
    });

    it('should handle correct answer', () => {
      const mockEmit = vi.fn();
      component.answerSubmitted.emit = mockEmit;

      component.inputControl.setValue('hello');
      component.checkTyping();

      expect(component.typingFeedback()).toEqual({ correct: true, msg: 'Correct!' });

      // Fast-forward time
      vi.advanceTimersByTime(GAME_CONSTANTS.FEEDBACK_DELAY);

      expect(mockEmit).toHaveBeenCalledWith({ success: true });
      expect(component.inputControl.value).toBe('');
      expect(component.typingFeedback()).toBeNull();
    });

    it('should handle incorrect answer', () => {
      component.inputControl.setValue('wrong');
      component.checkTyping();

      expect(component.typingFeedback()).toEqual({
        correct: false,
        msg: 'Incorrect. It was: hello'
      });
      expect(component.isPaused()).toBe(true);
      // Note: The effect that disables the control runs asynchronously
    });

    it('should handle case insensitive matching', () => {
      const mockEmit = vi.fn();
      component.answerSubmitted.emit = mockEmit;

      component.inputControl.setValue('HELLO');
      component.checkTyping();

      expect(component.typingFeedback()).toEqual({ correct: true, msg: 'Correct!' });
    });

    it('should trim whitespace', () => {
      const mockEmit = vi.fn();
      component.answerSubmitted.emit = mockEmit;

      component.inputControl.setValue('  hello  ');
      component.checkTyping();

      expect(component.typingFeedback()).toEqual({ correct: true, msg: 'Correct!' });
    });
  });

  describe('continueAfterWrongAnswer', () => {
    it('should reset state after wrong answer', () => {
      const mockEmit = vi.fn();
      component.answerSubmitted.emit = mockEmit;

      // Set up wrong answer state
      component.typingFeedback.set({ correct: false, msg: 'Wrong' });
      component.isPaused.set(true);
      component.inputControl.setValue('some input');

      component.continueAfterWrongAnswer();

      expect(component.isPaused()).toBe(false);
      expect(component.typingFeedback()).toBeNull();
      expect(component.inputControl.value).toBe('');
      expect(component.inputControl.enabled).toBe(true);
      expect(mockEmit).toHaveBeenCalledWith({ success: false });
    });
  });

  describe('Effect behavior', () => {
    it('should set isPaused when wrong answer is given', () => {
      // Test that isPaused is set, which triggers the effect to disable the control
      component.inputControl.setValue('wrong');
      (component as any).expectedAnswer = () => 'hello';
      component.checkTyping();

      expect(component.isPaused()).toBe(true);
    });
  });

  describe('Template rendering', () => {
    beforeEach(() => {
      (component as any).promptText = () => 'cześć';
      (component as any).expectedAnswer = () => 'hello';
      fixture.detectChanges();
    });

    it('should render prompt text', () => {
      const promptElement = fixture.nativeElement.querySelector('h2');
      expect(promptElement.textContent.trim()).toBe('cześć');
    });

    it('should render feedback when typingFeedback is set for correct answer', () => {
      component.typingFeedback.set({ correct: true, msg: 'Correct!' });
      fixture.detectChanges();

      const feedbackElement = fixture.nativeElement.querySelector('.bg-green-100');
      expect(feedbackElement).toBeTruthy();
      expect(feedbackElement.textContent.trim()).toBe('Correct!');
    });

    it('should render feedback when typingFeedback is set for incorrect answer', () => {
      component.typingFeedback.set({ correct: false, msg: 'Incorrect. It was: hello' });
      fixture.detectChanges();

      const feedbackElement = fixture.nativeElement.querySelector('.bg-red-100');
      expect(feedbackElement).toBeTruthy();
      expect(feedbackElement.textContent.trim()).toBe('Incorrect. It was: hello');
    });

    it('should render continue button when incorrect and paused', () => {
      component.typingFeedback.set({ correct: false, msg: 'Wrong' });
      component.isPaused.set(true);
      fixture.detectChanges();

      const continueButton = fixture.nativeElement.querySelector('button.bg-red-600');
      expect(continueButton).toBeTruthy();
      expect(continueButton.textContent.trim()).toBe('Continue');
    });

    it('should not render continue button when correct', () => {
      component.typingFeedback.set({ correct: true, msg: 'Correct!' });
      component.isPaused.set(false);
      fixture.detectChanges();

      const continueButton = fixture.nativeElement.querySelector('button.bg-red-600');
      expect(continueButton).toBeFalsy();
    });

    it('should disable check button when paused', () => {
      component.isPaused.set(true);
      fixture.detectChanges();

      const checkButton = fixture.nativeElement.querySelector('button.bg-indigo-600');
      expect(checkButton.disabled).toBe(true);
    });

    it('should enable check button when not paused', () => {
      component.isPaused.set(false);
      fixture.detectChanges();

      const checkButton = fixture.nativeElement.querySelector('button.bg-indigo-600');
      expect(checkButton.disabled).toBe(false);
    });
  });
});
