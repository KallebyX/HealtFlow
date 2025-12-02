import { applyDecorators, Type } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, getSchemaPath } from '@nestjs/swagger';

export interface PaginatedResponseOptions {
  type: Type<any>;
  description?: string;
}

export function ApiPaginatedResponse(options: PaginatedResponseOptions) {
  return applyDecorators(
    ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' }),
    ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' }),
    ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' }),
    ApiOkResponse({
      description: options.description || 'Paginated response',
      schema: {
        allOf: [
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(options.type) },
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  totalPages: { type: 'number' },
                  hasNextPage: { type: 'boolean' },
                  hasPrevPage: { type: 'boolean' },
                },
              },
            },
          },
        ],
      },
    }),
  );
}
