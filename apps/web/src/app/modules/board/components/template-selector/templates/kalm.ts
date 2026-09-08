import { TuNode } from '@tapiz/board-commons';
import { TemplaNode } from '../template-node.model';

function column(
  x: number,
  backgroundColor: string,
  title: string,
  description: string,
): TuNode<TemplaNode> {
  return {
    id: '',
    type: 'panel',
    content: {
      position: { x, y: 50 },
      layer: 1,
      text: `<h3>${title}</h3><p><span style="color: #6c757d">${description}</span></p>`,
      width: 1250,
      height: 2600,
      rotation: 0,
      backgroundColor,
      drawing: [],
    },
  };
}

export function getTemplate(): TuNode<TemplaNode>[] {
  return [
    column(0, '#e7f0fd', '✅ Keep', 'What we should keep doing.'),
    column(1300, '#e3f7e0', '➕ Add', 'What we should start doing.'),
    column(2600, '#fdeede', '🔽 Less', 'What we should do less of.'),
    column(3900, '#f3e8fb', '🔼 More', 'What we should do more of.'),
  ];
}
