import { Stmt, Expr } from "../frontend/ast.ts";


export type RuntimeVal =
  | NumberVal
  | BooleanVal
  | NullVal
  | FunctionVal;

export interface NumberVal {
  type: "number";
  value: number;
}

export interface BooleanVal {
  type: "boolean";
  value: boolean;
}

export interface NullVal {
  type: "null";
  value: null;
}

export interface FunctionVal {
  type: "function";
  params: string[];
  body: Stmt[];
  closure: Environment;
}

export function mkNumber(n: number): NumberVal {
  return { type: "number", value: n };
}

export function mkBoolean(b: boolean): BooleanVal {
  return { type: "boolean", value: b };
}

export function mkNull(): NullVal {
  return { type: "null", value: null };
}

export function mkFunction(params: string[], body: Stmt[], closure: Environment): FunctionVal {
  return { type: "function", params, body, closure };
}

export class Environment {
  private values: Map<string, RuntimeVal> = new Map();
  private parent?: Environment;

  constructor(parent?: Environment) {
    this.parent = parent;
  }

  declare(name: string, value: RuntimeVal): RuntimeVal {
    this.values.set(name, value);
    return value;
  }

  assign(name: string, value: RuntimeVal): RuntimeVal {
    if (this.values.has(name)) {
      this.values.set(name, value);
      return value;
    } else if (this.parent) {
      return this.parent.assign(name, value);
    }
    throw new ReferenceError(`Variable "${name}" is not defined.`);
  }

  lookup(name: string): RuntimeVal {
    if (this.values.has(name)) {
      return this.values.get(name)!;
    } else if (this.parent) {
      return this.parent.lookup(name);
    }
    throw new ReferenceError(`Variable "${name}" is not defined.`);
  }
}
