export interface NoteVisibilityInput {
  // The board-wide state set by an admin: `true` hidden, `false` shown, and
  // `null`/`undefined` when no board-wide rule applies.
  textHidden: boolean | null | undefined;
  // Whether the current viewer wrote in (owns) the note.
  isOwner: boolean;
  // Whether the current viewer is an admin of the board.
  isAdmin: boolean;
  // The note owner's own per-user visibility flag.
  ownerVisible: boolean | undefined;
}

/**
 * Whether a note is visible to the current viewer.
 *
 * - A board-wide state set by an admin (`textHidden`) takes precedence: when
 *   hidden, only the note's author and admins see it; when explicitly shown,
 *   everyone sees it.
 * - Otherwise a user always sees their own notes, and everyone else follows the
 *   note owner's personal visibility.
 */
export function isNoteVisible({
  textHidden,
  isOwner,
  isAdmin,
  ownerVisible,
}: NoteVisibilityInput): boolean {
  if (textHidden !== null && textHidden !== undefined) {
    return textHidden ? isOwner || isAdmin : true;
  }

  if (isOwner) {
    return true;
  }

  return ownerVisible ?? true;
}
