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

  // Whether pressing `button` on a node should select it. The middle button is
  // always a pan gesture, and in "move" mode the left button pans the view, so
  // neither selects. The left button in "select" mode and the right button
  // (used to target the context menu) still select.
  selectsOnPointerDown(button: number): boolean {
    if (button === 1) {
      return false;
    }

    if (button === 0 && this.mode() === 'move') {
      return false;
    }

    return true;
  }
}
