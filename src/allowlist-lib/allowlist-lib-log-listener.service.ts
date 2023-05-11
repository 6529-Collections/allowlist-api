import { Injectable, Logger } from '@nestjs/common';
import { LogListener } from '@6529-collections/allowlist-lib/logging/logging-emitter';

const nestJsLogger = new Logger('allowlist-lib');

@Injectable()
export class AllowlistLibLogListener implements LogListener {
  debug(message: string): void {
    nestJsLogger.debug(message);
  }

  error(message: string): void {
    nestJsLogger.error(message);
  }

  info(message: string): void {
    nestJsLogger.log(message);
  }

  warn(message: string): void {
    nestJsLogger.warn(message);
  }
}
