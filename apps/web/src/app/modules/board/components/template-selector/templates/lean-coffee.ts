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
    column(0, '#e7f0fd', '📥 To discuss', 'Topics to bring up — vote to prioritise.'),
    column(1300, '#fdeede', '💬 Discussing', "What we're talking about now."),
    column(2600, '#e3f7e0', '✅ Discussed', "Topics we've covered."),
  ];
}
