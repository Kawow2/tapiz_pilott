import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { StateActions, TuNode } from '@tapiz/board-commons';
import { BoardActions } from '@tapiz/board-commons/actions/board.actions';
import { boardPageFeature } from '../../reducers/boardPage.reducer';
import { BoardFacade } from '../../../../services/board-facade.service';
import { getNodeSize } from '../../../../shared/node-size';

@Component({
  selector: 'tapiz-lock-toolbar',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './lock-toolbar.component.scss',
  template: `
    @if (node(); as node) {
      <div
        class="bar"
        [style.left.px]="position().left"
        [style.top.px]="position().top">
        <button
          type="button"
          class="lock"
          [class.locked]="locked()"
          [title]="
            locked() ? 'Déverrouiller la position' : 'Verrouiller la position'
          "
          (click)="toggle(node)">
          <mat-icon>{{ locked() ? 'lock' : 'lock_open' }}</mat-icon>
        </button>
      </div>
    }
  `,
})
export class LockToolbarComponent {
  #store = inject(Store);
  #boardFacade = inject(BoardFacade);
  #focusIds = this.#store.selectSignal(boardPageFeature.selectFocusId);
  #zoom = this.#store.selectSignal(boardPageFeature.selectZoom);
  #boardPosition = this.#store.selectSignal(boardPageFeature.selectPosition);

  // The single selected node (the toolbar only shows for one node at a time).
  node = computed(() => {
    const ids = this.#focusIds();

    if (ids.length !== 1) {
      return null;
    }

    return this.#boardFacade.nodes().find((it) => it.id === ids[0]) ?? null;
  });

  locked = computed(
    () => !!(this.node()?.content as { locked?: boolean } | undefined)?.locked,
  );

  // A small bar centered just above the node, following the board zoom/pan.
  position = computed(() => {
    const node = this.node();

    if (!node) {
      return { left: 0, top: 0 };
    }

    const nodePosition = (
      node.content as { position: { x: number; y: number } }
    ).position;
    const { width } = getNodeSize(node);
    const zoom = this.#zoom();
    const pan = this.#boardPosition();
    const barWidth = 44;
    // Notes show a colour palette above them; sit above it so the lock stays
    // visible. Other nodes just clear their own top edge.
    const topOffset = node.type === 'note' ? 132 : 56;

    return {
      left: nodePosition.x * zoom + pan.x + (width * zoom) / 2 - barWidth / 2,
      top: nodePosition.y * zoom + pan.y - topOffset,
    };
  });

  toggle(node: TuNode) {
    const action: StateActions = {
      op: 'patch',
      data: {
        id: node.id,
        type: node.type,
        content: { locked: !this.locked() },
      },
    };

    this.#store.dispatch(
      BoardActions.batchNodeActions({ history: true, actions: [action] }),
    );
  }
}
