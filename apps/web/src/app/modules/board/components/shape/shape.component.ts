import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Shape, TuNode } from '@tapiz/board-commons';
import { BoardActions } from '@tapiz/board-commons/actions/board.actions';
import { explicitEffect } from 'ngxtension/explicit-effect';
import { PortalComponent } from '@tapiz/ui/portal';
import { SafeHtmlPipe } from '@tapiz/cdk/pipes/safe-html';
import { EditorViewComponent } from '@tapiz/ui/editor-view';
import { NodeSpaceComponent } from '../node-space';
import { ShapeToolbarComponent } from './shape-toolbar.component';
import { EditorPortalComponent } from '../editor-portal/editor-portal.component';
import { NodeToolbarComponent } from '../node-toolbar/node-toolbar.component';
import { HistoryService } from '../../services/history.service';

@Component({
  selector: 'tapiz-shape',
  template: `
    <tapiz-node-space
      [node]="node()"
      [resize]="true"
      [rotate]="true"
      [enabled]="!edit()"
      [showOutline]="focus()">
      <svg
        class="shape"
        [attr.viewBox]="viewBox()"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg">
        @switch (node().content.shapeType) {
          @case ('rectangle') {
            <rect
              [attr.x]="inset()"
              [attr.y]="inset()"
              [attr.width]="innerWidth()"
              [attr.height]="innerHeight()"
              [attr.fill]="fill()"
              [attr.stroke]="stroke()"
              [attr.stroke-width]="strokeWidth()" />
          }
          @case ('circle') {
            <ellipse
              [attr.cx]="centerX()"
              [attr.cy]="centerY()"
              [attr.rx]="radiusX()"
              [attr.ry]="radiusY()"
              [attr.fill]="fill()"
              [attr.stroke]="stroke()"
              [attr.stroke-width]="strokeWidth()" />
          }
          @case ('triangle') {
            <polygon
              [attr.points]="trianglePoints()"
              [attr.fill]="fill()"
              [attr.stroke]="stroke()"
              [attr.stroke-width]="strokeWidth()"
              stroke-linejoin="round" />
          }
          @case ('line') {
            <line
              [attr.x1]="inset()"
              [attr.y1]="centerY()"
              [attr.x2]="lineX2()"
              [attr.y2]="centerY()"
              [attr.stroke]="stroke()"
              [attr.stroke-width]="strokeWidth()"
              stroke-linecap="round" />
          }
        }
      </svg>

      @if (node().content.shapeType !== 'line') {
        <div
          class="text-layer"
          (dblclick)="startEdit($event)">
          @if (edit()) {
            <tapiz-editor-portal [node]="node()">
              <tapiz-editor-view
                #editorView="editorView"
                customClass="tapiz-shape-editor"
                [content]="initialText()"
                [focus]="edit()"
                (contentChange)="setText($event)" />
            </tapiz-editor-portal>

            @if (editorView.editor(); as editor) {
              <tapiz-portal name="node-toolbar">
                <tapiz-node-toolbar
                  [node]="node()"
                  [fontSize]="true"
                  [editor]="editor" />
              </tapiz-portal>
            }
          } @else if (text()) {
            <div
              class="rich-text"
              [innerHTML]="text() | safeHtml"></div>
          }
        </div>
      }
    </tapiz-node-space>

    @if (focus() && !edit()) {
      <tapiz-portal name="node-toolbar">
        <tapiz-shape-toolbar [node]="node()" />
      </tapiz-portal>
    }
  `,
  styleUrls: ['./shape.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NodeSpaceComponent,
    PortalComponent,
    SafeHtmlPipe,
    EditorViewComponent,
    EditorPortalComponent,
    NodeToolbarComponent,
    ShapeToolbarComponent,
  ],
})
export class ShapeComponent {
  #store = inject(Store);
  #historyService = inject(HistoryService);

  node = input.required<TuNode<Shape>>();
  pasted = input.required<boolean>();
  focus = input.required<boolean>();

  edit = signal(false);
  initialText = signal('');
  text = computed(() => this.node().content.text ?? '');

  width = computed(() => this.node().content.width);
  height = computed(() => this.node().content.height);
  strokeWidth = computed(() => this.node().content.borderWidth ?? 2);
  stroke = computed(() => this.node().content.borderColor ?? '#1e254b');
  fill = computed(() => {
    if (this.node().content.shapeType === 'line') {
      return 'none';
    }

    return this.node().content.backgroundColor ?? '#ffffff';
  });

  inset = computed(() => this.strokeWidth() / 2);
  viewBox = computed(() => `0 0 ${this.width()} ${this.height()}`);
  centerX = computed(() => this.width() / 2);
  centerY = computed(() => this.height() / 2);
  innerWidth = computed(() => Math.max(0, this.width() - this.strokeWidth()));
  innerHeight = computed(() => Math.max(0, this.height() - this.strokeWidth()));
  radiusX = computed(() => Math.max(0, (this.width() - this.strokeWidth()) / 2));
  radiusY = computed(
    () => Math.max(0, (this.height() - this.strokeWidth()) / 2),
  );
  lineX2 = computed(() => Math.max(0, this.width() - this.inset()));
  trianglePoints = computed(() => {
    const w = this.width();
    const h = this.height();
    const i = this.inset();

    return `${w / 2},${i} ${w - i},${h - i} ${i},${h - i}`;
  });

  constructor() {
    // Bracket the edit for a single, clean undo entry.
    explicitEffect([this.edit], ([edit]) => {
      if (edit) {
        this.#historyService.initEdit(this.node());
      } else {
        this.#historyService.finishEdit(this.node());
      }
    });

    // Losing focus (clicking away) commits and closes the editor.
    explicitEffect([this.focus], ([focus]) => {
      if (!focus) {
        this.edit.set(false);
      }
    });
  }

  startEdit(event: MouseEvent) {
    if (this.edit() || this.node().content.shapeType === 'line') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.initialText.set(this.node().content.text ?? '');
    this.edit.set(true);
  }

  setText(value: string) {
    this.#store.dispatch(
      BoardActions.batchNodeActions({
        history: false,
        actions: [
          {
            op: 'patch',
            data: {
              id: this.node().id,
              type: this.node().type,
              content: { text: value },
            },
          },
        ],
      }),
    );
  }
}
