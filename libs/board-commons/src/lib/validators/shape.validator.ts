import { z } from 'zod/v4';
import {
  CommonBoardValidation,
  SizeValidator,
} from './common-board-validation.js';
import { nullableColorSchema } from './color.validator.js';
import { shapeTypes, shapeVerticalAligns } from '../models/shape.model.js';

const shape = z.object({
  ...CommonBoardValidation,
  ...SizeValidator,
  shapeType: z.enum(shapeTypes),
  rotation: z.number(),
  text: z.string().optional(),
  verticalAlign: z.enum(shapeVerticalAligns).optional(),
  backgroundColor: nullableColorSchema.optional(),
  borderColor: nullableColorSchema.optional(),
  borderWidth: z.number().nonnegative().int().nullable().optional(),
});

export const patchShape = shape.partial();

export const newShape = shape.partial().required({
  position: true,
  width: true,
  height: true,
  shapeType: true,
});
