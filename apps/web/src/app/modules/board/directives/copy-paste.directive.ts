import { Directive, HostListener, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { TuNode } from '@tapiz/board-commons';
import { BoardFacade } from '../../../services/board-facade.service';
import { CopyPasteService } from '../../../services/copy-paste.service';
import { ClipboardImageService } from '../../../services/clipboard-image.service';
import { isInputField } from '@tapiz/cdk/utils/is-input-field';
import { boardPageFeature } from '../reducers/boardPage.reducer';

@Directive({
  selector: '[tapizCopyPaste]',
})
export class CopyPasteDirective {
  @HostListener('document:keydown.control.c')
  @HostListener('document:keydown.meta.c')
  public copyEvent() {
    // Let the browser handle a real text selection; only copy nodes otherwise.
    if (!isInputField() && !(document.getSelection() ?? '').toString().length) {
      this.copy();
    }
  }

  @HostListener('document:keydown.control.v')
  @HostListener('document:keydown.meta.v')
  public pasteEvent() {
    if (!isInputField()) {
      this.paste();
    }
  }

  // Paste an image or GIF copied from anywhere (e.g. Google Images) straight
  // onto the board. Skipped inside inputs/editors so they paste text normally.
  @HostListener('document:paste', ['$event'])
  public async imagePasteEvent(event: ClipboardEvent) {
    if (isInputField()) {
      return;
    }

    const handled = await this.clipboardImage.pasteFromEvent(event);

    if (handled) {
      event.preventDefault();
    }
  }

  @HostListener('document:keydown.control.d', ['$event'])
  @HostListener('document:keydown.meta.d', ['$event'])
  public duplicateEvent(event: Event) {
    if (!isInputField()) {
      // Stop the browser's "bookmark" shortcut.
      event.preventDefault();
      this.duplicate();
    }
  }

  private store = inject(Store);
  private boardFacade = inject(BoardFacade);
  private copyPasteService = inject(CopyPasteService);
  private clipboardImage = inject(ClipboardImageService);
  private selectFocusId = this.store.selectSignal(
    boardPageFeature.selectFocusId,
  );

  public copy() {
    this.copyPasteService.copyNodes(this.selectedNodes());
  }

  public async paste() {
    this.copyPasteService.paste({
      history: true,
      incX: 20,
      incY: -20,
    });
  }

  public duplicate() {
    const selected = this.selectedNodes();

    if (selected.length) {
      this.copyPasteService.pasteNodes(selected, {
        history: true,
        incX: 10,
        incY: 10,
      });
    }
  }

  private selectedNodes(): TuNode[] {
    return this.boardFacade
      .nodes()
      .filter((node) => this.selectFocusId().includes(node.id));
  }
}
