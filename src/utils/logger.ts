/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

export class Logger {
  logStream: fs.WriteStream;
  private static _instance: Logger;
  private currentLogDate: string;

  private constructor() {
    // Check if logs folder exists or create it
    if (!fs.existsSync(path.resolve('logs'))) {
      fs.mkdirSync(path.resolve('logs'));
    }
    // Check if tokens folder exists or create it
    if (!fs.existsSync(path.resolve('config'))) {
      fs.mkdirSync(path.resolve('config'));
    }
    this.currentLogDate = '';
    this.setStream();
  }

  private setStream = (): void => {
    const date = new Date();
    const [month, day, year] = [
      date.getMonth(),
      date.getDate(),
      date.getFullYear()
    ];

    const newLogDate = `${year}-${month + 1}-${day}`;
    
    // Only create new stream if date changed or stream doesn't exist
    if (this.currentLogDate !== newLogDate || !this.logStream) {
      // Close existing stream if it exists
      if (this.logStream) {
        this.logStream.end();
      }
      
      const logFile = path.join(process.cwd(), 'logs');
      this.logStream = fs.createWriteStream(
        path.join(logFile, `${newLogDate}.log`),
        { flags: 'a' }
      );
      this.currentLogDate = newLogDate;
    }
  };

  public static get instance(): Logger {
    if (!this._instance) this._instance = new Logger();

    return this._instance;
  }

  log = (log: string): void => {
    this.setStream(); // Only creates new stream if needed
    const date = new Date();
    const logString = date.toLocaleTimeString() + ' Log ' + log + '\n';
    this.logStream.write(logString);
  };

  warn = (log: string): void => {
    this.setStream(); // Only creates new stream if needed
    const date = new Date();
    const logString = date.toLocaleTimeString() + ' Warn ' + log + '\n';
    this.logStream.write(logString);
  };

  error = (log: string): void => {
    this.setStream(); // Only creates new stream if needed
    const date = new Date();
    const logString = date.toLocaleTimeString() + ' Error ' + log + '\n';
    this.logStream.write(logString);
  };

  /**
   * Cleanup method to properly close the log stream
   */
  cleanup = (): void => {
    if (this.logStream) {
      this.logStream.end();
    }
  };
}

export const morganOptions = (tokens: any, req: Request, res: Response) => {
  const date = new Date();
  return [
    date.toLocaleTimeString(),
    'Log Endpoint:',
    tokens.method(req, res),
    tokens['remote-addr'](req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'),
    '-',
    tokens['response-time'](req, res),
    'ms'
  ].join(' ');
};
