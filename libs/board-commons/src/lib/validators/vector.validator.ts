import { z } from 'zod/v4';
import {
  CommonBoardValidation,
  SizeValidator,
} from './common-board-validation.js';

const vector = z.object({
  ...CommonBoardValidation,
  ...SizeValidator,
  url: z.string().max(20000),
  rotation: z.number(),
  icon: z.boolean().optional(),
  color: z.string().max(50).optional(),
});

export const patchVector = vector.partial();

export const newVector = vector;
