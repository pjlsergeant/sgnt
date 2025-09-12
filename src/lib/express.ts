// import cors from 'cors';
import express, { Express } from 'express';
import 'express-async-errors';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}

export async function getApp(): Promise<[Express]> {
  const app = express();
  // app.use(cors());

  return [app];
}
