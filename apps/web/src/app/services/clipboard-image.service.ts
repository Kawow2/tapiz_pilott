import { Injectable, inject } from '@angular/core';
import { FileUploadService } from './file-upload.service';

// Matches an image URL by extension (optionally followed by a query/hash).
const IMAGE_EXTENSION = /\.(gif|png|jpe?g|webp|bmp|avif)(\?|#|$)/i;

@Injectable({
  providedIn: 'root',
})
export class ClipboardImageService {
  #fileUpload = inject(FileUploadService);

  /**
   * Handle a native paste event by dropping any image(s) found on the
   * clipboard onto the board. Returns `true` when an image (or animated GIF)
   * was pasted, so the caller can prevent the default paste.
   */
  async pasteFromEvent(
    event: ClipboardEvent,
    position?: { x: number; y: number },
  ): Promise<boolean> {
    const data = event.clipboardData;

    if (!data) {
      return false;
    }

    // `clipboardData` is only valid synchronously during the event, so read
    // everything up front and only do async work (fetch) afterwards.
    const files = this.#imageFiles(data);
    const html = data.getData('text/html');
    const text = data.getData('text/plain');
    const gifUrl = this.#imageUrl(html, text, true);
    const anyUrl = this.#imageUrl(html, text, false);

    // Prefer fetching a GIF from its source URL: copying a GIF from a web page
    // usually lands on the clipboard as a single static frame, so fetching the
    // original file is what preserves the animation.
    if (gifUrl) {
      const file = await this.#fetchImage(gifUrl);

      if (file) {
        this.#fileUpload.addFilesToBoard([file], position);
        return true;
      }
    }

    // Direct image blobs (a normal "Copy image" of a PNG/JPEG, or a static GIF
    // frame when the fetch above was not possible).
    if (files.length) {
      this.#fileUpload.addFilesToBoard(files, position);
      return true;
    }

    // "Copy image address" of a non-GIF image.
    if (anyUrl) {
      const file = await this.#fetchImage(anyUrl);

      if (file) {
        this.#fileUpload.addFilesToBoard([file], position);
        return true;
      }
    }

    return false;
  }

  #imageFiles(data: DataTransfer): File[] {
    const fromFiles = Array.from(data.files ?? []).filter((file) =>
      file.type.startsWith('image/'),
    );

    if (fromFiles.length) {
      return fromFiles;
    }

    // Some browsers expose the pasted image only through `items`.
    const fromItems: File[] = [];

    for (const item of Array.from(data.items ?? [])) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();

        if (file) {
          fromItems.push(file);
        }
      }
    }

    return fromItems;
  }

  #imageUrl(html: string, text: string, gifOnly: boolean): string | null {
    const candidates: string[] = [];

    const htmlMatch = html?.match(/<img[^>]+src=["']([^"']+)["']/i);

    if (htmlMatch?.[1]) {
      candidates.push(htmlMatch[1]);
    }

    const trimmed = text?.trim();

    if (trimmed && /^https?:\/\//i.test(trimmed)) {
      candidates.push(trimmed);
    }

    return (
      candidates.find((url) =>
        gifOnly ? /\.gif(\?|#|$)/i.test(url) : IMAGE_EXTENSION.test(url),
      ) ?? null
    );
  }

  async #fetchImage(url: string): Promise<File | null> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();

      if (!blob.type.startsWith('image/')) {
        return null;
      }

      const extension = blob.type.split('/')[1] ?? 'png';

      return new File([blob], `pasted.${extension}`, { type: blob.type });
    } catch {
      // Cross-origin or network failure: the caller falls back to any bitmap
      // already on the clipboard.
      return null;
    }
  }
}
