import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { isBoardTuNode, NodeAdd, TuNode } from '@tapiz/board-commons';
import { BoardPageActions } from '../modules/board/actions/board-page.actions';
import { boardPageFeature } from '../modules/board/reducers/boardPage.reducer';

@Injectable({
  providedIn: 'root',
})
export class CopyPasteService {
  private store = inject(Store);

  // In-memory clipboard: the source of truth so copy/paste works even where the
  // system clipboard is unavailable (http, restricted contexts). The system
  // clipboard is written best-effort on top so copying works across boards/tabs.
  #clipboard: TuNode[] = [];

  public readonly layer = this.store.selectSignal(
    boardPageFeature.selectBoardMode,
  );

  public getNodes(text: string): TuNode[] {
    try {
      return JSON.parse(text);
    } catch (_) {
      return [];
    }
  }

  public copyNodes(nodes: TuNode[]) {
    this.#clipboard = nodes.length ? JSON.parse(JSON.stringify(nodes)) : [];

    try {
      const write = navigator.clipboard?.writeText?.(JSON.stringify(nodes));
      write?.catch(() => {
        // ignore: the in-memory clipboard is the source of truth
      });
    } catch {
      // ignore: the in-memory clipboard is the source of truth
    }
  }

  public async paste(options?: {
    history?: boolean;
    x?: number;
    y?: number;
    incX?: number;
    incY?: number;
  }) {
    if (this.#clipboard.length) {
      this.pasteNodes(this.#clipboard, options);
      return;
    }

    // Nothing copied in this session: try content copied elsewhere.
    await this.pasteCurrentClipboard(options);
  }

  public async pasteCurrentClipboard(options?: {
    history?: boolean;
    x?: number;
    y?: number;
    incX?: number;
    incY?: number;
  }) {
    const hasReadText = navigator.clipboard.readText;

    if (!hasReadText) {
      return;
    }

    const text = await navigator.clipboard.readText();

    this.pasteNodes(this.getNodes(text), options);
  }

  public pasteNodes(
    sourceNodes: TuNode[],
    options?: {
      history?: boolean;
      x?: number;
      y?: number;
      incX?: number;
      incY?: number;
    },
  ) {
    if (!sourceNodes.length) {
      return;
    }

    // Clone so callers passing live board nodes (e.g. duplicate) are not
    // mutated by the position/children rewrites below.
    const copyNode: TuNode[] = JSON.parse(JSON.stringify(sourceNodes));

    const nodes: NodeAdd['data'][] = copyNode.map((it, index): TuNode => {
      if (isBoardTuNode(it)) {
        if (options?.x && options?.y) {
          it.content.position = {
            x: options.x + index * 10,
            y: options.y + index * 10,
          };
        } else if (options?.incX || options?.incY) {
          it.content.position = {
            x: it.content.position.x + (options?.incX ?? 0),
            y: it.content.position.y + (options?.incY ?? 0),
          };
        }

        if (it.children) {
          it.children = it.children.map((child) => {
            return {
              ...child,
              id: '',
            };
          });
        }
      }

      return {
        ...it,
        content: {
          ...it.content,
          layer: this.layer(),
        },
        id: '',
      };
    });

    this.store.dispatch(
      BoardPageActions.pasteNodes({ nodes, history: options?.history ?? true }),
    );
  }
}
