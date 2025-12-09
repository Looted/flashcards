import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { TypingCardComponent } from './typing-card.component';
import { ValidationService } from '../../../../services/validation.service';

describe('TypingCardComponent', () => {
  let component: TypingCardComponent;
  let fixture: ComponentFixture<TypingCardComponent>;
  let validationServiceSpy: any;

  beforeEach(async () => {
    const spy = {
      validateTypingAnswer: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [TypingCardComponent, ReactiveFormsModule],
      providers: [
        { provide: ValidationService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TypingCardComponent);
    component = fixture.componentInstance;
    validationServiceSpy = TestBed.inject(ValidationService);
    vi.useFakeTimers()
    // Set required inputs using component properties
    fixture.componentRef.setInput('promptText', 'Translate: hello');
    fixture.componentRef.setInput('expectedAnswer', 'hola');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('checkTyping', () => {
    it('should call validation service with correct parameters', () => {
      validationServiceSpy.validateTypingAnswer.mockReturnValue(true);
      component.inputControl.setValue('hola');

      component.checkTyping();

      expect(validationServiceSpy.validateTypingAnswer).toHaveBeenCalledWith('hola', 'hola');
    });

  it('should emit success when validation passes', async () => {
      validationServiceSpy.validateTypingAnswer.mockReturnValue(true);
      component.inputControl.setValue('hola');

      let result: boolean | undefined = undefined;
      const subscription = component.answerSubmitted.subscribe((event) => {
        result = event.success;
      });

      component.checkTyping();

      await vi.advanceTimersToNextTimerAsync();
            await vi.advanceTimersToNextTimerAsync();
      expect(result).toBe(true);
      subscription.unsubscribe();
    });

    it('should emit failure when validation fails', () => {
      validationServiceSpy.validateTypingAnswer.mockReturnValue(false);
      component.inputControl.setValue('wrong');

      component.answerSubmitted.subscribe((event) => {
        expect(event.success).toBe(false);
      });

      component.checkTyping();
      expect(component.typingFeedback()?.correct).toBe(false);
      expect(component.isPaused()).toBe(true);
    });

    it('should not validate empty input', () => {
      component.inputControl.setValue('');

      component.checkTyping();

      expect(validationServiceSpy.validateTypingAnswer).not.toHaveBeenCalled();
    });
  });

  describe('continueAfterWrongAnswer', () => {
    it('should reset state and emit failure', () => {
      component.isPaused.set(true);
      component.typingFeedback.set({ correct: false, msg: 'Incorrect' });

      component.answerSubmitted.subscribe((event) => {
        expect(event.success).toBe(false);
      });

      component.continueAfterWrongAnswer();

      expect(component.isPaused()).toBe(false);
      expect(component.typingFeedback()).toBe(null);
      expect(component.inputControl.value).toBe('');
    });
  });
});
