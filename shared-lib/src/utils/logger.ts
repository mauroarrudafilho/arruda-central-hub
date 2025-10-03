export class ArrudaLogger {
  private enabled: boolean;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  log(message: string, ...args: any[]) {
    if (this.enabled) {
      console.log(`[ArrudaAuth] ${message}`, ...args);
    }
  }

  error(message: string, error?: any) {
    if (this.enabled) {
      console.error(`[ArrudaAuth ERROR] ${message}`, error);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.enabled) {
      console.warn(`[ArrudaAuth WARN] ${message}`, ...args);
    }
  }
}

