export class Environment {
  private values: Map<string, any> = new Map();
  constructor(private enclosing?: Environment) {}

  define(name: string, value: any): void {
    this.values.set(name, value);
  }

  get(name: string): any {
    if (this.values.has(name)) {
      return this.values.get(name);
    }
    if (this.enclosing) return this.enclosing.get(name);
    throw new Error(`Undefined variable '${name}'.`);
  }

  assign(name: string, value: any): void {
    if (this.values.has(name)) {
      this.values.set(name, value);
      return;
    }
    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }
    throw new Error(`Undefined variable '${name}'.`);
  }
}

export function createGlobalEnv(): Environment {
  const env = new Environment();

  env.define("clock", () => Date.now() / 1000);

  env.define("print", (arg: any) => {
    console.log(String(arg));
    return null;
  });

  return env;
}
