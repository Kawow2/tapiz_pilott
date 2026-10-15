import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { InteractionModeService } from './interaction-mode.service';

describe('InteractionModeService', () => {
  let service: InteractionModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), InteractionModeService],
    });

    service = TestBed.inject(InteractionModeService);
  });

  it('starts in select mode', () => {
    expect(service.mode()).toBe('select');
  });

  it('toggles between select and move', () => {
    service.toggle();
    expect(service.mode()).toBe('move');

    service.toggle();
    expect(service.mode()).toBe('select');
  });

  it('sets a mode explicitly', () => {
    service.set('move');
    expect(service.mode()).toBe('move');
  });

  describe('selectsOnPointerDown', () => {
    it('selects with the left button in select mode', () => {
      service.set('select');
      expect(service.selectsOnPointerDown(0)).toBe(true);
    });

    it('does not select with the left button in move mode (it pans)', () => {
      service.set('move');
      expect(service.selectsOnPointerDown(0)).toBe(false);
    });

    it('never selects with the middle button (it pans)', () => {
      service.set('select');
      expect(service.selectsOnPointerDown(1)).toBe(false);

      service.set('move');
      expect(service.selectsOnPointerDown(1)).toBe(false);
    });

    it('keeps selecting with the right button so the context menu has a target', () => {
      service.set('select');
      expect(service.selectsOnPointerDown(2)).toBe(true);

      service.set('move');
      expect(service.selectsOnPointerDown(2)).toBe(true);
    });
  });
});
