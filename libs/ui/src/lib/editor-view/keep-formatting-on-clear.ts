import { Extension } from '@tiptap/core';
import type { Mark } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';

// When the whole text is selected and deleted (then retyped), ProseMirror
// resets the now-empty block to its defaults, dropping the text marks (colour,
// size, weight, …) and the block's alignment. This restores them so the next
// characters keep the formatting the cleared text had.
export const KeepFormattingOnClear = Extension.create({
  name: 'keepFormattingOnClear',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('keepFormattingOnClear'),
        appendTransaction(transactions, oldState, newState) {
          if (!transactions.some((tr) => tr.docChanged)) {
            return null;
          }

          const becameEmpty =
            oldState.doc.textContent.length > 0 &&
            newState.doc.textContent.length === 0;

          if (!becameEmpty) {
            return null;
          }

          // Marks of the first formatted run in the text that was cleared.
          let marks: readonly Mark[] | null = oldState.storedMarks;

          if (!marks) {
            oldState.doc.descendants((node) => {
              if (marks) {
                return false;
              }

              if (node.isText && node.marks.length) {
                marks = node.marks;
                return false;
              }

              return true;
            });
          }

          const oldFirstBlock = oldState.doc.firstChild;
          const newFirstBlock = newState.doc.firstChild;

          let tr = newState.tr;
          let changed = false;

          // Restore the block attributes (e.g. text alignment).
          if (
            oldFirstBlock &&
            newFirstBlock &&
            oldFirstBlock.type === newFirstBlock.type &&
            JSON.stringify(oldFirstBlock.attrs) !==
              JSON.stringify(newFirstBlock.attrs)
          ) {
            tr = tr.setNodeMarkup(0, undefined, oldFirstBlock.attrs);
            changed = true;
          }

          // Keep the marks for whatever the user types next.
          if (marks && marks.length) {
            tr = tr.setStoredMarks([...marks]);
            changed = true;
          }

          return changed ? tr : null;
        },
      }),
    ];
  },
});
