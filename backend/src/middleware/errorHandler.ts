import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("[Error]", err.message, err.stack);
  res.status(500).json({
    error: "Internal server error",
    message: "Something went wrong on our end. Please try again.",
  });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "Not found" });
}
