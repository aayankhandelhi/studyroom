/**
 * Discriminated-union result type. Server Actions return Result<T> instead of
 * throwing across the RSC boundary, so the UI can render error states cleanly
 * and TypeScript forces callers to handle both branches.
 */
export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

export interface AppError {
  code: AppErrorCode;
  message: string;
  /** Field-level messages for form validation. */
  fields?: Record<string, string[]>;
}

export type AppErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });
export const err = (code: AppErrorCode, message: string, fields?: Record<string, string[]>): Result<never> =>
  ({ ok: false, error: { code, message, fields } });

/**
 * Throwable typed error. Server Action bodies can `throw new ActionError(code,
 * message)` for expected failures (conflict, forbidden, not-found …); the
 * `action()` wrapper converts it into the matching `Result` with the message
 * intact — no generic "something went wrong".
 */
export class ActionError extends Error {
  constructor(public code: AppErrorCode, message: string, public fields?: Record<string, string[]>) {
    super(message);
    this.name = 'ActionError';
  }
}
