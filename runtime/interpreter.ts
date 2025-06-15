import { Stmt, Expr } from "../frontend/parser.ts";

type Value = any;

export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeError";
  }
}

class ReturnException {
  value: Value;
  constructor(value: Value) {
    this.value = value;
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
    if (this.values.has(name)) {
      return this.values.get(name);
    }
    if (this.enclosing) {
      return this.enclosing.get(name);
    }
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
      if (ret instanceof ReturnException) {
        return ret.value;
      } else {
        throw ret;
      }
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

    // Define built-in functions
    this.globals.define("print", {
      arity: () => 1,
      call: (_interpreter: Interpreter, args: Value[]) => {
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
      if (err instanceof RuntimeError) {
        console.error(`Runtime error: ${err.message}`);
      } else {
        throw err;
      }
    }
  }

  private execute(stmt: Stmt) {
    switch (stmt.kind) {
      case "VarStmt":
        {
          const value = stmt.initializer ? this.evaluate(stmt.initializer) : null;
          this.environment.define(stmt.name, value);
        }
        break;

      case "FunctionStmt":
        {
          const func = new GsFunction(stmt, this.environment);
          this.environment.define(stmt.name, func);
        }
        break;

      case "ExpressionStmt":
        {
          this.evaluate(stmt.expression);
        }
        break;

      case "PrintStmt":
        {
          const value = this.evaluate(stmt.expression);
          console.log(value);
        }
        break;

      case "ReturnStmt":
        {
          const value = stmt.value ? this.evaluate(stmt.value) : null;
          throw new ReturnException(value);
        }
        break;

      case "IfStmt":
        {
          if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch);
          } else if (stmt.elseBranch) {
            this.execute(stmt.elseBranch);
          }
        }
        break;

      case "WhileStmt":
        {
          while (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.body);
          }
        }
        break;

      case "BlockStmt":
        {
          this.executeBlock(stmt.statements, new Environment(this.environment));
        }
        break;

      default:
        throw new RuntimeError(`Unknown statement kind: ${(stmt as any).kind}`);
    }
  }

  executeBlock(statements: Stmt[], environment: Environment) {
    const previous = this.environment;
    try {
      this.environment = environment;
      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }

  private evaluate(expr: Expr): Value {
    switch (expr.kind) {
      case "Literal":
        return expr.value;

      case "Grouping":
        return this.evaluate(expr.expression);

      case "Unary":
        {
          const right = this.evaluate(expr.right);
          switch (expr.operator) {
            case "-":
              this.checkNumberOperand(expr.operator, right);
              return -right;
            case "!":
              return !this.isTruthy(right);
          }
          throw new RuntimeError(`Unknown unary operator: ${expr.operator}`);
        }

      case "Binary":
        {
          const left = this.evaluate(expr.left);
          const right = this.evaluate(expr.right);
          switch (expr.operator) {
            case "+":
              if (typeof left === "number" && typeof right === "number") {
                return left + right;
              }
              if (typeof left === "string" || typeof right === "string") {
                return String(left) + String(right);
              }
              throw new RuntimeError("Operands must be two numbers or one must be a string.");
            case "-":
              this.checkNumberOperands(expr.operator, left, right);
              return left - right;
            case "*":
              this.checkNumberOperands(expr.operator, left, right);
              return left * right;
            case "/":
              this.checkNumberOperands(expr.operator, left, right);
              if (right === 0) throw new RuntimeError("Division by zero.");
              return left / right;
            case ">":
              this.checkNumberOperands(expr.operator, left, right);
              return left > right;
            case ">=":
              this.checkNumberOperands(expr.operator, left, right);
              return left >= right;
            case "<":
              this.checkNumberOperands(expr.operator, left, right);
              return left < right;
            case "<=":
              this.checkNumberOperands(expr.operator, left, right);
              return left <= right;
            case "==":
              return this.isEqual(left, right);
            case "!=":
              return !this.isEqual(left, right);
          }
          throw new RuntimeError(`Unknown binary operator: ${expr.operator}`);
        }

      case "Logical":
        {
          const left = this.evaluate(expr.left);
          if (expr.operator === "or") {
            if (this.isTruthy(left)) return left;
            return this.evaluate(expr.right);
          } else if (expr.operator === "and") {
            if (!this.isTruthy(left)) return left;
            return this.evaluate(expr.right);
          }
          throw new RuntimeError(`Unknown logical operator: ${expr.operator}`);
        }

      case "Variable":
        return this.environment.get(expr.name);

      case "Assign":
        {
          const value = this.evaluate(expr.value);
          this.environment.assign(expr.name, value);
          return value;
        }

      case "Call":
        {
          const callee = this.evaluate(expr.callee);
          if (typeof callee !== "object" && typeof callee !== "function") {
            throw new RuntimeError("Can only call functions.");
          }
          const args = expr.args.map((arg) => this.evaluate(arg));
          if (typeof callee.call !== "function") {
            throw new RuntimeError("Can only call functions.");
          }
          if (args.length !== callee.arity()) {
            throw new RuntimeError(`Expected ${callee.arity()} arguments but got ${args.length}.`);
          }
          return callee.call(this, args);
        }

      default:
        throw new RuntimeError(`Unknown expression kind: ${(expr as any).kind}`);
    }
  }

  private isTruthy(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === "boolean") return value;
    return true;
  }

  private isEqual(a: any, b: any): boolean {
    if (a === null && b === null) return true;
    if (a === null) return false;
    return a === b;
  }

  private checkNumberOperand(operator: string, operand: any) {
    if (typeof operand === "number") return;
    throw new RuntimeError(`Operand must be a number for operator '${operator}'.`);
  }

  private checkNumberOperands(operator: string, left: any, right: any) {
    if (typeof left === "number" && typeof right === "number") return;
    throw new RuntimeError(`Operands must be numbers for operator '${operator}'.`);
  }
}
