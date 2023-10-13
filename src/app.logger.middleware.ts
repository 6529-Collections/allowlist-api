import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';
import { Time } from './time';

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl: url } = request;
    const start = Time.now();

    response.on('close', () => {
      const { statusCode } = response;

      this.logger.log(
        `[${ip}] ${method} ${url} - HTTP${statusCode} - ${start.diffFromNow()}`,
      );
    });

    next();
  }
}
