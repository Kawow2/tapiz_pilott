import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { ClipboardImageService } from './clipboard-image.service';
import { FileUploadService } from './file-upload.service';

function pasteEvent(parts: {
  files?: File[];
  html?: string;
  text?: string;
}): ClipboardEvent {
  const clipboardData = {
    files: parts.files ?? [],
    items: [],
    getData: (type: string) =>
      type === 'text/html' ? (parts.html ?? '') : (parts.text ?? ''),
  };

  return { clipboardData } as unknown as ClipboardEvent;
}

describe('ClipboardImageService', () => {
  let service: ClipboardImageService;
  let addFilesToBoard: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    addFilesToBoard = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ClipboardImageService,
        { provide: FileUploadService, useValue: { addFilesToBoard } },
      ],
    });

    service = TestBed.inject(ClipboardImageService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does nothing when there is no clipboard data', async () => {
    const handled = await service.pasteFromEvent({
      clipboardData: null,
    } as unknown as ClipboardEvent);

    expect(handled).toBe(false);
    expect(addFilesToBoard).not.toHaveBeenCalled();
  });

  it('pastes an image file from the clipboard', async () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });

    const handled = await service.pasteFromEvent(pasteEvent({ files: [file] }));

    expect(handled).toBe(true);
    expect(addFilesToBoard).toHaveBeenCalledWith([file], undefined);
  });

  it('ignores non-image files', async () => {
    const file = new File(['x'], 'a.txt', { type: 'text/plain' });

    const handled = await service.pasteFromEvent(pasteEvent({ files: [file] }));

    expect(handled).toBe(false);
    expect(addFilesToBoard).not.toHaveBeenCalled();
  });

  it('prefers fetching a GIF from its source URL to preserve animation', async () => {
    const gif = new Blob(['gif'], { type: 'image/gif' });
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, blob: () => Promise.resolve(gif) });
    vi.stubGlobal('fetch', fetchMock);

    const staticFrame = new File(['x'], 'frame.png', { type: 'image/png' });

    const handled = await service.pasteFromEvent(
      pasteEvent({
        files: [staticFrame],
        html: '<img src="https://example.com/cat.gif">',
      }),
    );

    expect(handled).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/cat.gif');

    const [files] = addFilesToBoard.mock.calls[0];
    expect(files[0].type).toBe('image/gif');
  });

  it('falls back to the clipboard bitmap when the GIF fetch fails (CORS)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('CORS')));

    const staticFrame = new File(['x'], 'frame.png', { type: 'image/png' });

    const handled = await service.pasteFromEvent(
      pasteEvent({
        files: [staticFrame],
        html: '<img src="https://example.com/cat.gif">',
      }),
    );

    expect(handled).toBe(true);
    expect(addFilesToBoard).toHaveBeenCalledWith([staticFrame], undefined);
  });

  it('fetches a copied image address (non-GIF) when no blob is present', async () => {
    const png = new Blob(['png'], { type: 'image/png' });
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, blob: () => Promise.resolve(png) });
    vi.stubGlobal('fetch', fetchMock);

    const handled = await service.pasteFromEvent(
      pasteEvent({ text: 'https://example.com/pic.png' }),
    );

    expect(handled).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/pic.png');
    expect(addFilesToBoard).toHaveBeenCalled();
  });
});
