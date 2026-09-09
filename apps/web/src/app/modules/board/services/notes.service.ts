import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Note, Point, User, defaultUserSettings } from '@tapiz/board-commons';
import { BoardActions } from '../actions/board.actions';
import { BoardPageActions } from '../actions/board-page.actions';
import { NodesActions } from '../services/nodes-actions';
import { boardPageFeature } from '../reducers/boardPage.reducer';
import { appFeature } from '../../../+state/app.reducer';

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  #store = inject(Store);
  #boardMode = this.#store.selectSignal(boardPageFeature.selectBoardMode);
  #user = this.#store.selectSignal(appFeature.selectUser);
  #nodesActions = inject(NodesActions);
  #lastColor = '';
  #defaultSIZE = 300;

  getNew(data: Pick<Note, 'ownerId' | 'position' | 'layer'>): Note {
    return {
      text: '',
      votes: [],
      emojis: [],
      drawing: [],
      width: this.#defaultSIZE,
      height: this.#defaultSIZE,
      ...data,
      position: {
        x: data.position.x - this.#defaultSIZE / 2,
        y: data.position.y - this.#defaultSIZE / 2,
      },
    };
  }

  createNote(userId: User['id'], position: Point, color?: string) {
    if (color) {
      this.#lastColor = color;
    }

    const noteDefaults =
      this.#user()?.settings.noteDefaults ?? defaultUserSettings.noteDefaults;

    // Notes have no owner on creation: the name shown is whoever writes in it
    // (set in the note component's setText), so notes can be created for anyone.
    const note = this.getNew({
      ownerId: '',
      layer: this.#boardMode(),
      position,
    });

    note.color = this.#lastColor || noteDefaults.backgroundColor;

    const action = this.#nodesActions.add<Note>('note', note);

    this.#store.dispatch(
      BoardActions.batchNodeActions({
        history: true,
        actions: [action],
      }),
    );
  }

  // Create a note next to another one: same size, and "pasted" so it is
  // selected (showing its + buttons) without opening the editor — which lets
  // the user chain more notes by clicking a + again.
  createAdjacentNote(
    userId: User['id'],
    topLeft: Point,
    width: number,
    height: number,
    color: string,
  ) {
    const note: Note = {
      text: '',
      votes: [],
      emojis: [],
      drawing: [],
      width,
      height,
      // No owner on creation; the writer's name is set on edit.
      ownerId: '',
      layer: this.#boardMode(),
      position: topLeft,
      color,
    };

    this.#store.dispatch(
      BoardPageActions.pasteNodes({
        nodes: [{ type: 'note', id: '', content: note }],
        history: true,
      }),
    );
  }
}
