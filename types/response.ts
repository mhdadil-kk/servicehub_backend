export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
  timestamp: string;
}

/**
 * Standard factory function for successful responses
 */
export const createSuccessResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

/**
 * Standard factory function for error responses
 */
export const createErrorResponse = (message: string, errors?: unknown): ApiResponse => ({
  success: false,
  message,
  errors,
  timestamp: new Date().toISOString(),
});
