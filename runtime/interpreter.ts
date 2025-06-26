import { Stmt, Expr } from "../frontend/ast.ts";

type Value = any;

class ReturnException {
  value: Value;
  constructor(value: Value) {
    this.value = value;
  }
}

export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeError";
  }
}

export class Environment {
  private values = new Map<string, Value>();
  private enclosing?: Environment;

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing;
  }

  define(name: string, value: Value) {
    this.values.set(name, value);
  }

  assign(name: string, value: Value) {
    if (this.values.has(name)) {
      this.values.set(name, value);
      return;
    }
    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }
    throw new RuntimeError(`Undefined variable '${name}'.`);
  }

  get(name: string): Value {
    if (this.values.has(name)) return this.values.get(name);
    if (this.enclosing) return this.enclosing.get(name);
    throw new RuntimeError(`Undefined variable '${name}'.`);
  }
}

export interface Callable {
  arity(): number;
  call(interpreter: Interpreter, args: Value[]): Value;
}

class GsFunction implements Callable {
  private declaration: Stmt;
  private closure: Environment;

  constructor(declaration: Stmt, closure: Environment) {
    this.declaration = declaration;
    this.closure = closure;
  }

  arity(): number {
    if (this.declaration.kind !== "FunctionStmt") return 0;
    return this.declaration.params.length;
  }

  call(interpreter: Interpreter, args: Value[]): Value {
    if (this.declaration.kind !== "FunctionStmt") return undefined;
    const environment = new Environment(this.closure);
    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i], args[i]);
    }
    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (ret) {
      if (ret instanceof ReturnException) return ret.value;
      else throw ret;
    }
    return null;
  }

  toString(): string {
    return `<fn ${this.declaration.name}>`;
  }
}

export class Interpreter {
  private globals: Environment;
  private environment: Environment;

  constructor() {
    this.globals = new Environment();
    this.environment = this.globals;

    this.globals.define("print", {
      arity: () => 1,
      call: (_i: Interpreter, args: Value[]) => {
        console.log(args[0]);
        return null;
      },
      toString: () => "<native fn print>",
    });
  }

  interpret(statements: Stmt[]) {
    try {
      for (const stmt of statements) {
        this.execute(stmt);
      }
    } catch (err) {
      if (err instanceof RuntimeError) console.error("Runtime error: " + err.message);
      else throw err;
    }
  }

  private execute(stmt: Stmt) {
    switch (stmt.kind) {
      case "VarStmt":
        this.environment.define(stmt.name, stmt.initializer ? this.evaluate(stmt.initializer) : null);
        break;
      case "FunctionStmt":
        this.environment.define(stmt.name, new GsFunction(stmt, this.environment));
        break;
      case "ExpressionStmt":
        this.evaluate(stmt.expression);
        break;
      case "PrintStmt":
        console.log(this.evaluate(stmt.expression));
        break;
      case "ReturnStmt":
        throw new ReturnException(stmt.value ? this.evaluate(stmt.value) : null);
      case "IfStmt":
        this.execute(this.isTruthy(this.evaluate(stmt.condition)) ? stmt.thenBranch : stmt.elseBranch);
        break;
      case "WhileStmt":
        while (this.isTruthy(this.evaluate(stmt.condition))) this.execute(stmt.body);
        break;
      case "ForStmt":
        if (stmt.initializer) this.execute(stmt.initializer);
        while (!stmt.condition || this.isTruthy(this.evaluate(stmt.condition))) {
          this.execute(stmt.body);
          if (stmt.increment) this.evaluate(stmt.increment);
        }
        break;
      case "BlockStmt":
        this.executeBlock(stmt.statements, new Environment(this.environment));
        break;
      default:
        throw new RuntimeError("Unknown statement kind: " + (stmt as any).kind);
    }
  }

  executeBlock(statements: Stmt[], environment: Environment) {
    const prev = this.environment;
    try {
      this.environment = environment;
      for (const stmt of statements) this.execute(stmt);
    } finally {
      this.environment = prev;
    }
  }

  private evaluate(expr: Expr): Value {
    switch (expr.kind) {
      case "Literal": return expr.value;
      case "Variable": return this.environment.get(expr.name);
      case "Assign": const v = this.evaluate(expr.value); this.environment.assign(expr.name, v); return v;
      case "Grouping": return this.evaluate(expr.expression);
      case "Unary": const r = this.evaluate(expr.right); return expr.operator === "-" ? -r : !this.isTruthy(r);
      case "Binary":
        const left = this.evaluate(expr.left), right = this.evaluate(expr.right);
        switch (expr.operator) {
          case "+": return typeof left === "number" && typeof right === "number" ? left + right : String(left) + String(right);
          case "-": this.checkNum(left); this.checkNum(right); return left - right;
          case "*": this.checkNum(left); this.checkNum(right); return left * right;
          case "/": this.checkNum(left); this.checkNum(right); if (right === 0) throw new RuntimeError("Div by 0"); return left / right;
          case ">": return left > right;
          case ">=": return left >= right;
          case "<": return left < right;
          case "<=": return left <= right;
          case "==": return left === right;
          case "!=": return left !== right;
        }
        break;
      case "Logical":
        const l = this.evaluate(expr.left);
        return expr.operator === "or" ? (this.isTruthy(l) ? l : this.evaluate(expr.right)) : (!this.isTruthy(l) ? l : this.evaluate(expr.right));
      case "Call":
        const callee = this.evaluate(expr.callee);
        if (typeof callee.call !== "function") throw new RuntimeError("Only functions callable.");
        const args = expr.args.map((arg) => this.evaluate(arg));
        if (args.length !== callee.arity()) throw new RuntimeError(`Expected ${callee.arity()} args, got ${args.length}`);
        return callee.call(this, args);
    }
  }

  private isTruthy(val: any): boolean {
    return !!val;
  }

  private checkNum(val: any) {
    if (typeof val !== "number") throw new RuntimeError("Expected number");
  }
}
