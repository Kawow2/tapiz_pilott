import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
} from '@angular/core';
import { TuNode, Vector } from '@tapiz/board-commons';
import { PortalComponent } from '@tapiz/ui/portal';
import { NodeSpaceComponent } from '../node-space';
import { IconToolbarComponent } from './icon-toolbar.component';

const SVG_DATA_URI_PREFIX = 'data:image/svg+xml;utf8,';

// Override the SVG root stroke so single-stroke icons can be recoloured.
function recolorIcon(url: string, color: string): string {
  if (!url.startsWith(SVG_DATA_URI_PREFIX)) {
    return url;
  }

  let svg: string;

  try {
    svg = decodeURIComponent(url.slice(SVG_DATA_URI_PREFIX.length));
  } catch {
    return url;
  }

  const recolored = svg.replace(/stroke="[^"]*"/, `stroke="${color}"`);

  return SVG_DATA_URI_PREFIX + encodeURIComponent(recolored);
}

@Component({
  selector: 'tapiz-vector',

  template: `
    <tapiz-node-space
      [node]="node()"
      [showOutline]="focus()"
      [rotate]="true"
      [resize]="true">
      <img
        #image
        [attr.src]="src()" />
    </tapiz-node-space>

    @if (focus() && isIcon()) {
      <tapiz-portal name="node-toolbar">
        <tapiz-icon-toolbar [node]="node()" />
      </tapiz-portal>
    }
  `,
  styleUrls: ['./vector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NodeSpaceComponent, PortalComponent, IconToolbarComponent],
})
export class VectorComponent {
  public node = input.required<TuNode<Vector>>();

  public pasted = input.required<boolean>();

  public focus = input.required<boolean>();

  // Recolorable single-stroke icons: flagged by the picker, or (for icons
  // placed before the flag existed) any inline SVG data URI. Cocomaterial
  // illustrations use remote URLs, so they stay excluded.
  public isIcon = computed(() => {
    const content = this.node().content;

    return content.icon === true || content.url.startsWith(SVG_DATA_URI_PREFIX);
  });

  public src = computed(() => {
    const content = this.node().content;

    if (this.isIcon() && content.color) {
      return recolorIcon(content.url, content.color);
    }

    return content.url;
  });
}
