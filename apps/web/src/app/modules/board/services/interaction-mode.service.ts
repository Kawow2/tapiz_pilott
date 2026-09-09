import { Injectable, signal } from '@angular/core';

export type InteractionMode = 'select' | 'move';

// Board pointer mode toggled from the bottom-right control:
// - 'select': left-drag draws a rubber-band selection.
// - 'move': left-drag pans the board (hand tool).
// Right-drag and the wheel always pan regardless of mode.
@Injectable({
  providedIn: 'root',
})
export class InteractionModeService {
  readonly mode = signal<InteractionMode>('select');

  set(mode: InteractionMode) {
    this.mode.set(mode);
  }

  toggle() {
    this.mode.update((mode) => (mode === 'select' ? 'move' : 'select'));
  }
}
