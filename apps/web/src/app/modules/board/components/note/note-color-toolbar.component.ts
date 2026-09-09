import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Note, TuNode } from '@tapiz/board-commons';
import { BoardActions } from '@tapiz/board-commons/actions/board.actions';
import { colorPickerSwatches } from '@tapiz/ui/color-picker';
import { boardPageFeature } from '../../reducers/boardPage.reducer';

// Colour palette shown above a selected note (like the shape toolbar), so the
// note background can be recoloured on a single click.
@Component({
  selector: 'tapiz-note-color-toolbar',
  template: `
    <div
      class="note-color-toolbar"
      [style.left.px]="position().x"
      [style.top.px]="position().y"
      (mousedown)="$event.stopPropagation()">
      <div class="swatches">
        @for (color of swatches; track color) {
          <button
            type="button"
            class="swatch"
            [style.background]="color"
            [class.active]="isActive(color)"
            (click)="setColor(color)"></button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .note-color-toolbar {
        position: absolute;
        transform: translateY(calc(-100% - 12px));
        padding: 8px 10px;
        background: var(--white, #fff);
        border: 1px solid var(--grey-30, #e8e9ea);
        border-radius: 10px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        z-index: 10;
        pointer-events: auto;
      }

      .swatches {
        display: grid;
        grid-template-columns: repeat(8, 22px);
        gap: 5px;
      }

      .swatch {
        inline-size: 22px;
        block-size: 22px;
        padding: 0;
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: 4px;
        cursor: pointer;
      }

      .swatch.active {
        outline: 2px solid var(--primary, #1e254b);
        outline-offset: 1px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteColorToolbarComponent {
  #store = inject(Store);
  #zoom = this.#store.selectSignal(boardPageFeature.selectZoom);
  #boardPosition = this.#store.selectSignal(boardPageFeature.selectPosition);

  node = input.required<TuNode<Note>>();

  swatches = colorPickerSwatches;

  position = computed(() => {
    const content = this.node().content;
    const zoom = this.#zoom();
    const boardPosition = this.#boardPosition();

    return {
      x: content.position.x * zoom + boardPosition.x,
      y: content.position.y * zoom + boardPosition.y,
    };
  });

  isActive(color: string) {
    return (this.node().content.color ?? '') === color;
  }

  setColor(color: string) {
    this.#store.dispatch(
      BoardActions.batchNodeActions({
        history: true,
        actions: [
          {
            op: 'patch',
            data: {
              id: this.node().id,
              type: 'note',
              content: { color },
            },
          },
        ],
      }),
    );
  }
}
