import { applyDecorators } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsPositive, Max } from 'class-validator';

export function IsIdParam(label: string) {
  return applyDecorators(
    Type(() => Number),
    IsInt({ message: `${label} id must be an integer` }),
    IsPositive({ message: `${label} id must be a positive integer` }),
    Max(2147483647, { message: `${label} id is too large` }),
  );
}