import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('❌ Error:', error);

  if (error.statusCode === 401) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (error.statusCode === 404) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (error.message?.includes('validation')) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
