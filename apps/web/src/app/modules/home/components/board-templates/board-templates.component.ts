import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { boardTemplates } from '@tapiz/board-commons';
import { HomeActions } from '../../+state/home.actions';

@Component({
  selector: 'tapiz-board-templates',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './board-templates.component.scss',
  template: `
    <section class="templates">
      <h2 class="title">Créer à partir d'un modèle</h2>
      <div class="grid">
        @for (template of templates; track template.id) {
          <button
            type="button"
            class="card"
            [title]="template.description"
            (click)="use(template.id, template.name)">
            <span class="icon">{{ template.icon }}</span>
            <span class="name">{{ template.name }}</span>
            <span class="description">{{ template.description }}</span>
          </button>
        }
      </div>
    </section>
  `,
})
export class BoardTemplatesComponent {
  #store = inject(Store);
  templates = boardTemplates;

  use(templateId: string, name: string) {
    this.#store.dispatch(HomeActions.createBoard({ name, templateId }));
  }
}
