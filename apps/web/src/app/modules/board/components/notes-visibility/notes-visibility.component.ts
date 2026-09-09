import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { BoardActions } from '../../actions/board.actions';
import { CdkMenu, CdkMenuItemRadio, CdkMenuTrigger } from '@angular/cdk/menu';
import { BoardFacade } from '../../../../services/board-facade.service';
import { MatIconModule } from '@angular/material/icon';
import { isNote, StateActions } from '@tapiz/board-commons';
import { boardPageFeature } from '../../reducers/boardPage.reducer';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'tapiz-notes-visibility',
  styleUrls: ['./notes-visibility.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkMenuTrigger,
    CdkMenu,
    MatIconModule,
    CdkMenuItemRadio,
    LucideAngularModule,
  ],
  template: `
    <div class="right-col-toolbar note-visibility">
      <button
        [cdkMenuTriggerFor]="selectVisibility"
        [class.no-visible]="!visible()">
        <span class="title">Notes visibility</span>
        <div class="value">
          @if (visible()) {
            Public
            <lucide-icon
              name="eye"
              size="18" />
          } @else {
            Private
            <lucide-icon
              name="eye-closed"
              size="18" />
          }
        </div>
      </button>
    </div>
    <ng-template #selectVisibility>
      <div
        class="menu radio-menu"
        cdkMenu>
        <button
          cdkMenuItemRadio
          class="radio-menu-item"
          [class.selected]="visible()"
          (cdkMenuItemTriggered)="setVisibility(true)">
          <p>Public</p>
          <p>Your notes are visible to everyone</p>
        </button>
        <button
          cdkMenuItemRadio
          class="radio-menu-item"
          [class.selected]="!visible()"
          (cdkMenuItemTriggered)="setVisibility(false)">
          <p>Private</p>
          <p>Your notes are visible only to you</p>
        </button>
      </div>
    </ng-template>
  `,
})
export class NotesVisibilityComponent {
  #store = inject(Store);
  #boardFacade = inject(BoardFacade);
  #users = this.#boardFacade.users;
  userId = this.#store.selectSignal(boardPageFeature.selectUserId);
  isAdmin = this.#store.selectSignal(boardPageFeature.selectIsAdmin);
  currentUser = computed(() => {
    return this.#users()?.find((user) => user.id === this.userId());
  });
  visible = computed(() => this.currentUser()?.visible);

  setVisibility(visible: boolean) {
    // Only an admin/owner can hide or show EVERY note on the board at once.
    // This board-wide rule (each note's textHidden) takes precedence over a
    // user's own per-user visibility. A regular user changes only their own
    // flag below, which affects only the notes they own.
    const notesActions: StateActions[] = this.isAdmin()
      ? this.#boardFacade
          .get()
          .filter(isNote)
          .map((it) => {
            return {
              data: {
                type: 'note',
                id: it.id,
                content: {
                  textHidden: !visible,
                },
              },
              op: 'patch',
            };
          })
      : [];

    this.#store.dispatch(
      BoardActions.batchNodeActions({
        history: false,
        actions: [
          ...notesActions,
          {
            data: {
              type: 'user',
              id: this.userId(),
              content: {
                visible,
              },
            },
            op: 'patch',
          },
        ],
      }),
    );
  }
}
