import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
  Shape,
  ShapeVerticalAlign,
  shapeVerticalAligns,
  TuNode,
} from '@tapiz/board-commons';
import { BoardActions } from '@tapiz/board-commons/actions/board.actions';
import { colorPickerSwatches } from '@tapiz/ui/color-picker';
import { MatIconModule } from '@angular/material/icon';
import { boardPageFeature } from '../../reducers/boardPage.reducer';

const TRANSPARENT = 'rgba(0, 0, 0, 0)';

type ColorKey = 'backgroundColor' | 'borderColor';

const V_ALIGN_ICON: Record<ShapeVerticalAlign, string> = {
  top: 'vertical_align_top',
  middle: 'vertical_align_center',
  bottom: 'vertical_align_bottom',
};

@Component({
  selector: 'tapiz-shape-toolbar',
  template: `
    <div
      class="shape-toolbar"
      [style.left.px]="position().x"
      [style.top.px]="position().y"
      (mousedown)="$event.stopPropagation()">
      @if (node().content.shapeType !== 'line') {
        <div class="row">
          <span class="label">Text</span>
          <div class="align-buttons">
            @for (align of verticalAligns; track align) {
              <button
                type="button"
                class="align-btn"
                [title]="'Align ' + align"
                [class.active]="isVAlign(align)"
                (click)="setVAlign(align)">
                <mat-icon>{{ vAlignIcon[align] }}</mat-icon>
              </button>
            }
          </div>
        </div>

        <div class="row">
          <span class="label">Fill</span>
          <div class="swatches">
            <button
              type="button"
              class="swatch transparent"
              title="Transparent"
              [class.active]="isActive('backgroundColor', transparent)"
              (click)="setColor('backgroundColor', transparent)"></button>
            @for (color of swatches; track color) {
              <button
                type="button"
                class="swatch"
                [style.background]="color"
                [class.active]="isActive('backgroundColor', color)"
                (click)="setColor('backgroundColor', color)"></button>
            }
          </div>
        </div>
      }

      <div class="row">
        <span class="label">Border</span>
        <div class="swatches">
          <button
            type="button"
            class="swatch transparent"
            title="No border"
            [class.active]="isActive('borderColor', transparent)"
            (click)="setColor('borderColor', transparent)"></button>
          @for (color of swatches; track color) {
            <button
              type="button"
              class="swatch"
              [style.background]="color"
              [class.active]="isActive('borderColor', color)"
              (click)="setColor('borderColor', color)"></button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .shape-toolbar {
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

      .swatch.transparent {
        background:
          linear-gradient(
              to top right,
              transparent calc(50% - 1px),
              #e5484d,
              transparent calc(50% + 1px)
            ),
          #fff;
      }

      .align-buttons {
        display: flex;
        gap: 4px;
      }

      .align-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        inline-size: 26px;
        block-size: 24px;
        padding: 0;
        border: 1px solid var(--grey-30, #e8e9ea);
        border-radius: 4px;
        background: var(--white, #fff);
        color: var(--grey-70, #555);
        cursor: pointer;
      }

      .align-btn mat-icon {
        font-size: 18px;
        inline-size: 18px;
        block-size: 18px;
      }

      .align-btn.active {
        border-color: var(--primary, #1e254b);
        color: var(--primary, #1e254b);
        background: var(--grey-20, #f2f3f4);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
})
export class ShapeToolbarComponent {
  #store = inject(Store);
  #zoom = this.#store.selectSignal(boardPageFeature.selectZoom);
  #boardPosition = this.#store.selectSignal(boardPageFeature.selectPosition);

  node = input.required<TuNode<Shape>>();

  swatches = colorPickerSwatches;
  transparent = TRANSPARENT;
  verticalAligns = shapeVerticalAligns;
  vAlignIcon = V_ALIGN_ICON;

  position = computed(() => {
    const content = this.node().content;
    const zoom = this.#zoom();
    const boardPosition = this.#boardPosition();

    return {
      x: content.position.x * zoom + boardPosition.x,
      y: content.position.y * zoom + boardPosition.y,
    };
  });

  isActive(key: ColorKey, color: string) {
    return (this.node().content[key] ?? '') === color;
  }

  isVAlign(align: ShapeVerticalAlign) {
    return (this.node().content.verticalAlign ?? 'middle') === align;
  }

  setVAlign(align: ShapeVerticalAlign) {
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
                verticalAlign: align,
              },
            },
          },
        ],
      }),
    );
  }

  setColor(key: ColorKey, color: string) {
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
                [key]: color,
              },
            },
          },
        ],
      }),
    );
  }
}
