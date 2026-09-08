import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { TuNode, Vector } from '@tapiz/board-commons';
import { BoardActions } from '@tapiz/board-commons/actions/board.actions';
import { colorPickerSwatches } from '@tapiz/ui/color-picker';
import { boardPageFeature } from '../../reducers/boardPage.reducer';

// Default Lucide stroke colour baked into the icon SVGs; offered first so the
// icon can be reverted to its original look.
const DEFAULT_COLOR = '#1e254b';

@Component({
  selector: 'tapiz-icon-toolbar',
  template: `
    <div
      class="icon-toolbar"
      [style.left.px]="position().x"
      [style.top.px]="position().y"
      (mousedown)="$event.stopPropagation()">
      <div class="row">
        <span class="label">Color</span>
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
    </div>
  `,
  styles: [
    `
      .icon-toolbar {
        position: absolute;
        transform: translateY(calc(-100% - 12px));
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 10px 12px;
        background: var(--white, #fff);
        border: 1px solid var(--grey-30, #e8e9ea);
        border-radius: 10px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        z-index: 10;
        pointer-events: auto;
      }

      .row {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .label {
        inline-size: 48px;
        font-size: 12px;
        color: var(--grey-70, #555);
      }

      .swatches {
        display: grid;
        grid-template-columns: repeat(9, 20px);
        gap: 4px;
      }

      .swatch {
        inline-size: 20px;
        block-size: 20px;
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
export class IconToolbarComponent {
  #store = inject(Store);
  #zoom = this.#store.selectSignal(boardPageFeature.selectZoom);
  #boardPosition = this.#store.selectSignal(boardPageFeature.selectPosition);

  node = input.required<TuNode<Vector>>();

  swatches = [DEFAULT_COLOR, ...colorPickerSwatches];

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
    return (this.node().content.color ?? DEFAULT_COLOR) === color;
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
              type: this.node().type,
              content: {
                color,
              },
            },
          },
        ],
      }),
    );
  }
}
