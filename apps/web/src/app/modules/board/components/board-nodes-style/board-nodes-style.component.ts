import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { isNote, isShape, Note, Shape, StateActions } from '@tapiz/board-commons';
import { colorPickerSwatches } from '@tapiz/ui/color-picker';
import { BoardFacade } from '../../../../services/board-facade.service';
import { BoardActions } from '../../actions/board.actions';
import { NodesActions } from '../../services/nodes-actions';

const TRANSPARENT = 'rgba(0, 0, 0, 0)';

// Multi-selection style bar: when several nodes are selected, apply one fill /
// border colour to every selected shape (and the fill to selected notes) at
// once. Mirrors BoardNodesAlignComponent (board-level, shown on 2+ selection).
@Component({
  selector: 'tapiz-board-nodes-style',
  template: `
    @if (show()) {
      <div
        class="wrapper"
        (mousedown)="$event.stopPropagation()">
        <div class="row">
          <span class="label">Fill</span>
          <div class="swatches">
            <button
              type="button"
              class="swatch transparent"
              title="Transparent"
              (click)="setFill(transparent)"></button>
            @for (color of swatches; track color) {
              <button
                type="button"
                class="swatch"
                [style.background]="color"
                (click)="setFill(color)"></button>
            }
          </div>
        </div>

        @if (hasShapes()) {
          <div class="row">
            <span class="label">Border</span>
            <div class="swatches">
              <button
                type="button"
                class="swatch transparent"
                title="No border"
                (click)="setBorder(transparent)"></button>
              @for (color of swatches; track color) {
                <button
                  type="button"
                  class="swatch"
                  [style.background]="color"
                  (click)="setBorder(color)"></button>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .wrapper {
        position: fixed;
        left: 50%;
        top: 96px;
        transform: translate(-50%, 0);
        z-index: var(--board-tools-layer);
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 8px 10px;
        background: var(--white, #fff);
        border: 1px solid var(--grey-30, #e8e9ea);
        border-radius: 10px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
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
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardNodesStyleComponent {
  #store = inject(Store);
  #boardFacade = inject(BoardFacade);
  #nodesActions = inject(NodesActions);

  swatches = colorPickerSwatches;
  transparent = TRANSPARENT;

  #focusNodes = this.#boardFacade.focusNodes;

  hasShapes = computed(() => this.#focusNodes().some((node) => isShape(node)));

  show = computed(() => {
    const nodes = this.#focusNodes();

    return (
      nodes.length > 1 && nodes.some((node) => isShape(node) || isNote(node))
    );
  });

  setFill(color: string) {
    const actions: StateActions[] = [];

    this.#focusNodes().forEach((node) => {
      if (isShape(node)) {
        actions.push(
          this.#nodesActions.patch<Shape>({
            type: 'shape',
            id: node.id,
            content: { backgroundColor: color },
          }),
        );
      } else if (isNote(node)) {
        actions.push(
          this.#nodesActions.patch<Note>({
            type: 'note',
            id: node.id,
            content: { color },
          }),
        );
      }
    });

    this.#dispatch(actions);
  }

  setBorder(color: string) {
    const actions: StateActions[] = [];

    this.#focusNodes().forEach((node) => {
      if (isShape(node)) {
        actions.push(
          this.#nodesActions.patch<Shape>({
            type: 'shape',
            id: node.id,
            content: { borderColor: color },
          }),
        );
      }
    });

    this.#dispatch(actions);
  }

  #dispatch(actions: StateActions[]) {
    if (!actions.length) {
      return;
    }

    this.#store.dispatch(
      BoardActions.batchNodeActions({ history: true, actions }),
    );
  }
}
