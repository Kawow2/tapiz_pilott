import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  HostListener,
  inject,
  viewChild,
  computed,
  signal,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Image, ImageCrop, TuNode } from '@tapiz/board-commons';
import { HotkeysService } from '@tapiz/cdk/services/hostkeys.service';
import { explicitEffect } from 'ngxtension/explicit-effect';
import { NodeSpaceComponent } from '../node-space';
import { BoardActions } from '@tapiz/board-commons/actions/board.actions';
import { input } from '@angular/core';
import { ConfigService } from '../../../../services/config.service';

const FULL_CROP: ImageCrop = { x: 0, y: 0, width: 1, height: 1 };
const MIN_CROP = 0.05;
type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

@Component({
  selector: 'tapiz-image',

  template: `
    <tapiz-node-space
      [node]="node()"
      [showOutline]="focus() && !cropping()"
      [rotate]="!cropping()"
      [resize]="!cropping()"
      [enabled]="!cropping()">
      <div class="frame">
        <img
          #image
          class="picture"
          [attr.src]="url()"
          [style.width.%]="imgWidth()"
          [style.height.%]="imgHeight()"
          [style.left.%]="imgLeft()"
          [style.top.%]="imgTop()"
          (load)="loadImage()" />
      </div>

      @if (cropping()) {
        <div
          #cropEditor
          class="crop-editor">
          <img
            class="crop-full"
            [attr.src]="url()" />

          <div
            class="crop-rect"
            [style.left.%]="workCrop().x * 100"
            [style.top.%]="workCrop().y * 100"
            [style.width.%]="workCrop().width * 100"
            [style.height.%]="workCrop().height * 100"
            (pointerdown)="startDrag($event, 'move')">
            <span
              class="handle nw"
              (pointerdown)="startDrag($event, 'nw')"></span>
            <span
              class="handle ne"
              (pointerdown)="startDrag($event, 'ne')"></span>
            <span
              class="handle sw"
              (pointerdown)="startDrag($event, 'sw')"></span>
            <span
              class="handle se"
              (pointerdown)="startDrag($event, 'se')"></span>
          </div>

          <div
            class="crop-toolbar"
            (pointerdown)="$event.stopPropagation()">
            <button
              type="button"
              (click)="resetCrop()">
              Réinitialiser
            </button>
            <button
              type="button"
              (click)="cancelCrop()">
              Annuler
            </button>
            <button
              type="button"
              class="primary"
              (click)="applyCrop()">
              Appliquer
            </button>
          </div>
        </div>
      }
    </tapiz-node-space>
  `,
  styleUrls: ['./image.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [HotkeysService],
  imports: [NodeSpaceComponent],

  host: {
    '[class.focus]': 'focus()',
    '[class.cropping]': 'cropping()',
  },
})
export class ImageComponent {
  #store = inject(Store);
  #configService = inject(ConfigService);

  imageRef = viewChild.required<ElementRef>('image');
  cropEditor = viewChild<ElementRef<HTMLElement>>('cropEditor');

  node = input.required<TuNode<Image>>();
  pasted = input.required<boolean>();
  focus = input.required<boolean>();

  cropping = signal(false);
  workCrop = signal<ImageCrop>(FULL_CROP);

  #dragMode: DragMode | null = null;
  #dragStart: { fx: number; fy: number; crop: ImageCrop } | null = null;
  #frameRect: DOMRect | null = null;
  #onMove = (event: PointerEvent) => this.#pointerMove(event);
  #onUp = () => this.#stopDrag();

  crop = computed(() => this.node().content.crop ?? FULL_CROP);
  imgWidth = computed(() => 100 / this.crop().width);
  imgHeight = computed(() => 100 / this.crop().height);
  imgLeft = computed(() => (-this.crop().x / this.crop().width) * 100);
  imgTop = computed(() => (-this.crop().y / this.crop().height) * 100);

  url = computed(() => {
    const url = this.node().content.url;

    if (url.startsWith('http')) {
      return url;
    }

    if (url.startsWith('data:')) {
      return url;
    }

    if (this.#configService.config.API_URL.endsWith('/')) {
      return this.#configService.config.API_URL + 'uploads/' + url;
    }

    return this.#configService.config.API_URL + '/uploads/' + url;
  });

  constructor() {
    // Clicking away commits the crop, matching the other in-place editors.
    explicitEffect([this.focus], ([focus]) => {
      if (!focus && this.cropping()) {
        this.applyCrop();
      }
    });
  }

  @HostListener('dblclick', ['$event'])
  onDblClick(event: MouseEvent) {
    if (this.cropping()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.workCrop.set(this.crop());
    this.cropping.set(true);
  }

  startDrag(event: PointerEvent, mode: DragMode) {
    event.preventDefault();
    event.stopPropagation();

    const editor = this.cropEditor()?.nativeElement;

    if (!editor) {
      return;
    }

    this.#frameRect = editor.getBoundingClientRect();
    this.#dragMode = mode;
    this.#dragStart = {
      ...this.#pointerFraction(event),
      crop: this.workCrop(),
    };

    document.addEventListener('pointermove', this.#onMove);
    document.addEventListener('pointerup', this.#onUp);
  }

  resetCrop() {
    this.workCrop.set(FULL_CROP);
  }

  cancelCrop() {
    this.cropping.set(false);
  }

  applyCrop() {
    const crop = this.workCrop();
    this.cropping.set(false);

    this.#store.dispatch(
      BoardActions.batchNodeActions({
        history: true,
        actions: [
          {
            op: 'patch',
            data: {
              id: this.node().id,
              type: 'image',
              content: { crop },
            },
          },
        ],
      }),
    );
  }

  loadImage() {
    const image = this.node();
    const width = image.content.width;
    const height = image.content.height;

    if (!width || !height) {
      this.#store.dispatch(
        BoardActions.batchNodeActions({
          history: true,
          actions: [
            {
              data: {
                type: 'image',
                id: image.id,
                content: {
                  width: this.imageNativeElement.naturalWidth,
                  height: this.imageNativeElement.naturalHeight,
                },
              },
              op: 'patch',
            },
          ],
        }),
      );
    }
  }

  get imageNativeElement(): HTMLImageElement {
    return this.imageRef().nativeElement;
  }

  #pointerFraction(event: PointerEvent) {
    const rect = this.#frameRect;

    if (!rect || !rect.width || !rect.height) {
      return { fx: 0, fy: 0 };
    }

    return {
      fx: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      fy: clamp((event.clientY - rect.top) / rect.height, 0, 1),
    };
  }

  #pointerMove(event: PointerEvent) {
    const start = this.#dragStart;
    const mode = this.#dragMode;

    if (!start || !mode) {
      return;
    }

    const { fx, fy } = this.#pointerFraction(event);
    let { x, y, width, height } = start.crop;

    if (mode === 'move') {
      x = clamp(start.crop.x + (fx - start.fx), 0, 1 - width);
      y = clamp(start.crop.y + (fy - start.fy), 0, 1 - height);
    } else {
      const right = start.crop.x + start.crop.width;
      const bottom = start.crop.y + start.crop.height;

      if (mode === 'nw' || mode === 'sw') {
        x = clamp(fx, 0, right - MIN_CROP);
        width = right - x;
      }

      if (mode === 'ne' || mode === 'se') {
        x = start.crop.x;
        width = clamp(fx, x + MIN_CROP, 1) - x;
      }

      if (mode === 'nw' || mode === 'ne') {
        y = clamp(fy, 0, bottom - MIN_CROP);
        height = bottom - y;
      }

      if (mode === 'sw' || mode === 'se') {
        y = start.crop.y;
        height = clamp(fy, y + MIN_CROP, 1) - y;
      }
    }

    this.workCrop.set({ x, y, width, height });
  }

  #stopDrag() {
    this.#dragMode = null;
    this.#dragStart = null;
    document.removeEventListener('pointermove', this.#onMove);
    document.removeEventListener('pointerup', this.#onUp);
  }
}
