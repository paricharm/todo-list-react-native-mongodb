
import { Request, Response, NextFunction } from "express";

// Handle errors passed or thrown by route handlers.
export function errorMiddleware(
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err);

  res.status(err.status || 500).json({
    message:
      err.status && err.status < 500
        ? err.message
        : "Internal server error",
  });
}