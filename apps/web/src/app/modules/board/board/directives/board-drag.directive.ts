import { Directive, inject } from '@angular/core';
import { map } from 'rxjs';
import { MultiDragService } from '@tapiz/cdk/services/multi-drag.service';
import { BoardFacade } from '../../../../services/board-facade.service';
import { Store } from '@ngrx/store';
import { boardPageFeature } from '../../reducers/boardPage.reducer';
import { InteractionModeService } from '../../services/interaction-mode.service';
import {
  BoardTuNode,
  isBoardTuNode,
  isGroup,
  isPanel,
} from '@tapiz/board-commons';
import { nodesInsideNode } from '@tapiz/cdk/utils/nodes-inside';
import { getNodeSize } from '../../../../shared/node-size';
import { NodesActions } from '../../services/nodes-actions';
import { BoardActions } from '@tapiz/board-commons/actions/board.actions';
import { BoardPageActions } from '../../actions/board-page.actions';

@Directive({
  selector: '[tapizBoardDragDirective]',
})
export class BoardDragDirective {
  #multiDragService = inject(MultiDragService);
  #boardFacade = inject(BoardFacade);
  #store = inject(Store);
  #nodesActions = inject(NodesActions);
  #interactionMode = inject(InteractionModeService);

  readonly #focusIds = this.#store.selectSignal(boardPageFeature.selectFocusId);

  constructor() {
    // Elements can only be dragged in "select" mode; in "move" mode a drag pans
    // the view instead. The mode signal is read synchronously inside `map` so
    // that every fresh subscription (MultiDragService re-subscribes on each
    // mousedown via concatLatestFrom) sees the current mode without depending on
    // an async `toObservable` emission.
    const dragEnabled$ = this.#store
      .select(boardPageFeature.selectDragEnabled)
      .pipe(map((enabled) => enabled && this.#interactionMode.mode() === 'select'));

    this.#multiDragService.setUp({
      dragEnabled: dragEnabled$,
      zoom: this.#store.select(boardPageFeature.selectZoom),
      relativePosition: this.#store.select(boardPageFeature.selectPosition),
      draggableIds: (triggerNode: string) => {
        const node = this.#boardFacade.getNode(triggerNode);
        if (
          node &&
          (isPanel(node) || isGroup(node)) &&
          !node.content.unLocked
        ) {
          const nodesInside = nodesInsideNode(
            node,
            this.#boardFacade
              .get()
              .filter((itNode): itNode is BoardTuNode => {
                if (!isBoardTuNode(itNode)) {
                  return false;
                }

                if (node.content.layer === 1) {
                  return true;
                }

                return itNode.content.layer === node.content.layer;
              })
              .map((node) => {
                const { width, height } = getNodeSize(node);

                return {
                  ...node,
                  content: {
                    ...node.content,
                    width,
                    height,
                  },
                };
              }),
          );

          const nodeIds = nodesInside.map((node) => node.id);

          return [...nodeIds, ...this.#focusIds()];
        }

        return this.#focusIds();
      },
      nodes: () => {
        return this.#boardFacade.get();
      },
      move: (elements) => {
        const nodes = elements.map(({ draggable, position }) => {
          return {
            node: {
              type: draggable.nodeType,
              id: draggable.id,
              content: {
                position,
              },
            },
          };
        });

        const actions = this.#nodesActions.bulkPatch(nodes);

        this.#store.dispatch(
          BoardActions.batchNodeActions({
            history: false,
            actions,
          }),
        );
      },
      end: (dragElements) => {
        const actions = dragElements.map((action) => {
          return {
            nodeType: action.draggable.nodeType,
            id: action.draggable.id,
            initialPosition: action.initialPosition,
            initialIndex: action.initialIndex,
            finalPosition: action.finalPosition,
          };
        });
        if (actions.length) {
          this.#store.dispatch(
            BoardPageActions.endDragNode({ nodes: actions }),
          );
        }
      },
    });
  }
}
