import { describe, expect, it } from 'vitest';
import { isNoteVisible } from './note-visibility.util';

describe('isNoteVisible', () => {
  describe('no board-wide rule (textHidden is null)', () => {
    it('a user always sees their own note, even if their flag is hidden', () => {
      expect(
        isNoteVisible({
          textHidden: null,
          isOwner: true,
          isAdmin: false,
          ownerVisible: false,
        }),
      ).toBe(true);
    });

    it("others follow the note owner's visibility flag (visible)", () => {
      expect(
        isNoteVisible({
          textHidden: null,
          isOwner: false,
          isAdmin: false,
          ownerVisible: true,
        }),
      ).toBe(true);
    });

    it("others follow the note owner's visibility flag (hidden)", () => {
      expect(
        isNoteVisible({
          textHidden: null,
          isOwner: false,
          isAdmin: false,
          ownerVisible: false,
        }),
      ).toBe(false);
    });

    it('defaults to visible when the owner has no flag', () => {
      expect(
        isNoteVisible({
          textHidden: null,
          isOwner: false,
          isAdmin: false,
          ownerVisible: undefined,
        }),
      ).toBe(true);
    });
  });

  describe('an admin hid the board (textHidden is true)', () => {
    it('the author still sees their own note', () => {
      expect(
        isNoteVisible({
          textHidden: true,
          isOwner: true,
          isAdmin: false,
          ownerVisible: false,
        }),
      ).toBe(true);
    });

    it('an admin sees every note', () => {
      expect(
        isNoteVisible({
          textHidden: true,
          isOwner: false,
          isAdmin: true,
          ownerVisible: false,
        }),
      ).toBe(true);
    });

    it('everyone else sees nothing (even their own flag says visible)', () => {
      expect(
        isNoteVisible({
          textHidden: true,
          isOwner: false,
          isAdmin: false,
          ownerVisible: true,
        }),
      ).toBe(false);
    });
  });

  describe('an admin showed the board (textHidden is false)', () => {
    it('overrides personal privacy: everyone sees the note', () => {
      expect(
        isNoteVisible({
          textHidden: false,
          isOwner: false,
          isAdmin: false,
          ownerVisible: false,
        }),
      ).toBe(true);
    });
  });
});
