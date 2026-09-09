import { z } from 'zod/v4';
import {
  CommonBoardValidation,
  SizeValidator,
} from './common-board-validation.js';

const image = z.object({
  ...CommonBoardValidation,
  ...SizeValidator,
  url: z.string().max(2000),
  rotation: z.number(),
  crop: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
});

export const patchImage = image.partial();

export const newImage = image;
