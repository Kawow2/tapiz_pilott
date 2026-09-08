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
    column(0, '#e3f7e0', '💚 Liked', 'What we enjoyed and appreciated.'),
    column(1300, '#e7f0fd', '📚 Learned', 'New things we discovered.'),
    column(2600, '#fdeede', '🕳️ Lacked', 'What was missing or could be better.'),
    column(3900, '#f3e8fb', '🌟 Longed for', 'What we wished we had.'),
  ];
}
