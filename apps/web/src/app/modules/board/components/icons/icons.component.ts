import {
  ChangeDetectionStrategy,
  Component,
  computed,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SafeHtmlPipe } from '@tapiz/cdk/pipes/safe-html';
import { boardIcons } from './icons.data';

@Component({
  selector: 'tapiz-icons',
  imports: [FormsModule, SafeHtmlPipe],
  template: `
    <input
      class="search"
      type="text"
      placeholder="Search icons…"
      [ngModel]="search()"
      (ngModelChange)="search.set($event)" />

    <div class="grid">
      @for (icon of filtered(); track icon.name) {
        <button
          type="button"
          class="icon-btn"
          [title]="icon.name"
          (click)="iconSelected.emit(icon.svg)"
          [innerHTML]="icon.svg | safeHtml"></button>
      } @empty {
        <p class="empty">No icon found</p>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: 10px;
        inline-size: 320px;
        max-block-size: 360px;
      }

      .search {
        inline-size: 100%;
        padding: 8px 10px;
        border: 1px solid var(--grey-30, #e8e9ea);
        border-radius: 8px;
        font-size: 14px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 6px;
        overflow-y: auto;
      }

      .icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        aspect-ratio: 1;
        padding: 8px;
        border: 1px solid transparent;
        border-radius: 8px;
        background: transparent;
        cursor: pointer;
      }

      .icon-btn:hover {
        background: var(--grey-20, #f2f3f4);
        border-color: var(--grey-30, #e8e9ea);
      }

      .icon-btn ::ng-deep svg {
        inline-size: 24px;
        block-size: 24px;
      }

      .empty {
        grid-column: 1 / -1;
        color: var(--grey-60, #777);
        text-align: center;
        margin: 8px 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconsComponent {
  iconSelected = output<string>();

  search = signal('');

  #icons = boardIcons;

  filtered = computed(() => {
    const query = this.search().toLowerCase().trim();

    if (!query) {
      return this.#icons;
    }

    return this.#icons.filter((icon) => icon.name.includes(query));
  });
}
