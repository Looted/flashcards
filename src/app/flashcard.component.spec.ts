import { TestBed } from '@angular/core/testing';
import { FlashcardComponent } from './flashcard.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('FlashcardComponent', () => {
  let component: FlashcardComponent;
  let fixture: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlashcardComponent]
    }).compileComponents();

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
});
