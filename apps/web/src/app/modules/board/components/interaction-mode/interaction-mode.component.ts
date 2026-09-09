import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { InteractionModeService } from '../../services/interaction-mode.service';

@Component({
  selector: 'tapiz-interaction-mode',
  imports: [MatIconModule],
  template: `
    <button
      type="button"
      class="toggle"
      [class.move]="mode() === 'move'"
      (click)="toggle()"
      [title]="
        mode() === 'move'
          ? 'Mode déplacement — cliquer pour passer en sélection'
          : 'Mode sélection — cliquer pour passer en déplacement'
      ">
      <span class="knob"></span>
      <span class="icon select">
        <mat-icon>near_me</mat-icon>
      </span>
      <span class="icon move">
        <mat-icon>pan_tool</mat-icon>
      </span>
    </button>
  `,
  styles: [
    `
      :host {
        position: absolute;
        inset-block-end: 6.75rem;
        inset-inline-end: var(--spacing-2);
        z-index: var(--board-tools-layer);
        display: flex;
        justify-content: flex-end;
      }

      .toggle {
        position: relative;
        display: inline-flex;
        align-items: center;
        padding: 4px;
        border: none;
        border-radius: 999px;
        background: var(--grey-30, #e8e9ea);
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .icon {
        position: relative;
        z-index: 1;
        inline-size: 40px;
        block-size: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--grey-70, #555);
        transition: color 0.2s ease;
      }

      .icon mat-icon {
        font-size: 20px;
        inline-size: 20px;
        block-size: 20px;
      }

      .knob {
        position: absolute;
        z-index: 0;
        inset-block-start: 4px;
        inset-inline-start: 4px;
        inline-size: 40px;
        block-size: 34px;
        border-radius: 999px;
        background: var(--primary-color-button-bg, #1e254b);
        transition: transform 0.2s ease;
      }

      // Select mode (default): knob on the left, select icon active.
      .toggle:not(.move) .icon.select {
        color: #fff;
      }

      // Move mode: knob slides right, move icon active.
      .toggle.move .knob {
        transform: translateX(40px);
      }

      .toggle.move .icon.move {
        color: #fff;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteractionModeComponent {
  #service = inject(InteractionModeService);

  mode = this.#service.mode;

  toggle() {
    this.#service.toggle();
  }
}
