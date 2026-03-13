import { Injectable, Logger } from '@nestjs/common';
import { LogListener } from '@6529-collections/allowlist-lib/logging/logging-emitter';
import { AllowlistLibExecutionContextService } from './allowlist-lib-execution-context.service';

const nestJsLogger = new Logger('allowlist-lib');

@Injectable()
export class AllowlistLibLogListener implements LogListener {
  constructor(
    private readonly executionContext: AllowlistLibExecutionContextService,
  ) {}

  debug(message: string): void {
    nestJsLogger.debug(this.withContext(message));
  }

  error(message: string): void {
    nestJsLogger.error(this.withContext(message));
  }

  info(message: string): void {
    nestJsLogger.log(this.withContext(message));
  }

  warn(message: string): void {
    nestJsLogger.warn(this.withContext(message));
  }

  private withContext(message: string) {
    const prefix = this.executionContext.getLogPrefix();
    if (!prefix) {
      return message;
    }
    return `[${prefix}] ${message}`;
  }
}
