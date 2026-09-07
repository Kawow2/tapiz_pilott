import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
} from '@angular/core';
import { Shape, TuNode } from '@tapiz/board-commons';
import { NodeSpaceComponent } from '../node-space';

@Component({
  selector: 'tapiz-shape',
  template: `
    <tapiz-node-space
      [node]="node()"
      [resize]="true"
      [rotate]="true"
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
    </tapiz-node-space>
  `,
  styleUrls: ['./shape.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NodeSpaceComponent],
})
export class ShapeComponent {
  node = input.required<TuNode<Shape>>();
  pasted = input.required<boolean>();
  focus = input.required<boolean>();

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
}
