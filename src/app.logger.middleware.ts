import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NextFunction, Request, Response } from 'express';
import { Time } from './time';

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    if (this.configService.get('REQUEST_LOG_OFF') === 'true') {
      return next();
    }
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
