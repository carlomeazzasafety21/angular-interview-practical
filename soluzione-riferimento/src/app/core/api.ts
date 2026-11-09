import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './models';

export const API_URL = 'http://localhost:3000/api';

/** Converts anything thrown by HttpClient into the error shape used by the UI. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as Partial<ApiError> | null;
    if (body && typeof body.message === 'string') {
      return { message: body.message, errors: body.errors };
    }
    if (err.status === 0) {
      return { message: 'Server non raggiungibile' };
    }
  }
  return { message: 'Errore imprevisto' };
}
