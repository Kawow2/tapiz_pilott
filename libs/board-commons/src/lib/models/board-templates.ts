import { TuNode } from './node.model.js';
import { Panel } from './panel.model.js';
import { Text } from './text.model.js';

export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  // Builds the starting nodes with fresh ids on each call.
  nodes: () => TuNode[];
}

const COLUMN_WIDTH = 360;
const COLUMN_HEIGHT = 540;
const COLUMN_GAP = 40;

const uid = (): string => globalThis.crypto.randomUUID();

function title(text: string): TuNode<Text, 'text'> {
  return {
    id: uid(),
    type: 'text',
    content: {
      text: `<p><strong>${text}</strong></p>`,
      position: { x: 0, y: -90 },
      layer: 0,
      width: 600,
      height: 60,
      rotation: 0,
    },
  };
}

function column(
  index: number,
  text: string,
  backgroundColor: string,
): TuNode<Panel, 'panel'> {
  return {
    id: uid(),
    type: 'panel',
    content: {
      text,
      position: { x: index * (COLUMN_WIDTH + COLUMN_GAP), y: 0 },
      layer: 0,
      width: COLUMN_WIDTH,
      height: COLUMN_HEIGHT,
      rotation: 0,
      drawing: [],
      backgroundColor,
      color: null,
      borderColor: null,
      borderWidth: null,
      borderRadius: 8,
    },
  };
}

function columns(
  headings: { text: string; color: string }[],
): TuNode[] {
  return headings.map((heading, index) =>
    column(index, heading.text, heading.color),
  );
}

export const boardTemplates: BoardTemplate[] = [
  {
    id: 'retrospective',
    name: 'Rétrospective',
    description: 'Ce qui a bien marché, à améliorer, et les actions.',
    icon: '🔁',
    nodes: () => [
      title('Rétrospective'),
      ...columns([
        { text: '😊 Ce qui a bien marché', color: '#d1fae5' },
        { text: '😕 À améliorer', color: '#fee2e2' },
        { text: '✅ Actions', color: '#dbeafe' },
      ]),
    ],
  },
  {
    id: 'kanban',
    name: 'Kanban',
    description: 'Backlog, à faire, en cours, terminé.',
    icon: '📋',
    nodes: () => [
      title('Kanban'),
      ...columns([
        { text: '📥 Backlog', color: '#f3f4f6' },
        { text: '🗒️ À faire', color: '#fef3c7' },
        { text: '🔧 En cours', color: '#dbeafe' },
        { text: '✅ Terminé', color: '#d1fae5' },
      ]),
    ],
  },
  {
    id: 'brainstorming',
    name: 'Brainstorming',
    description: 'Idées, questions et décisions.',
    icon: '💡',
    nodes: () => [
      title('Brainstorming'),
      ...columns([
        { text: '💡 Idées', color: '#fef9c3' },
        { text: '❓ Questions', color: '#ede9fe' },
        { text: '✅ Décisions', color: '#d1fae5' },
      ]),
    ],
  },
];

export function getBoardTemplate(id: string): BoardTemplate | undefined {
  return boardTemplates.find((template) => template.id === id);
}
