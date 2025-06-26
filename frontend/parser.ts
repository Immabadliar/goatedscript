import { Token } from "./lexer.ts";

export type Expr =
  | { kind: "Literal"; value: any }
  | { kind: "Variable"; name: string }
  | { kind: "Assign"; name: string; value: Expr }
  | { kind: "Binary"; left: Expr; operator: string; right: Expr }
  | { kind: "Unary"; operator: string; right: Expr }
  | { kind: "Logical"; left: Expr; operator: string; right: Expr }
  | { kind: "Call"; callee: Expr; args: Expr[] }
  | { kind: "Grouping"; expression: Expr }
  | { kind: "This" }
  | { kind: "Super"; method: string };

export type Stmt =
  | { kind: "VarStmt"; name: string; initializer?: Expr }
  | { kind: "FunctionStmt"; name: string; params: string[]; body: Stmt[]; modifiers: string[]; async: boolean }
  | { kind: "ClassStmt"; name: string; superclass?: Expr; body: Stmt[]; modifiers: string[] }
  | { kind: "StructStmt"; name: string; fields: { name: string; type?: string }[] }
  | { kind: "EnumStmt"; name: string; members: string[] }
  | { kind: "InterfaceStmt"; name: string; methods: Stmt[] }
  | { kind: "ExpressionStmt"; expression: Expr }
  | { kind: "PrintStmt"; expression: Expr }
  | { kind: "ReturnStmt"; value?: Expr }
  | { kind: "IfStmt"; condition: Expr; thenBranch: Stmt; elseBranch?: Stmt }
  | { kind: "WhileStmt"; condition: Expr; body: Stmt }
  | { kind: "ForStmt"; initializer: Stmt | null; condition: Expr | null; increment: Expr | null; body: Stmt }
  | { kind: "BlockStmt"; statements: Stmt[] }
  | { kind: "BreakStmt" }
  | { kind: "ContinueStmt" };

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Stmt[] {
    const statements: Stmt[] = [];
    while (!this.isAtEnd()) {
      statements.push(this.declaration());
    }
    return statements;
  }

  private declaration(): Stmt {
    const modifiers = this.modifiers();
    if (this.match("CLASS")) return this.classDeclaration(modifiers);
    if (this.match("STRUCT")) return this.structDeclaration();
    if (this.match("ENUM")) return this.enumDeclaration();
    if (this.match("INTERFACE")) return this.interfaceDeclaration();
    if (this.match("FUN")) return this.functionDeclaration(modifiers);
    if (this.match("VAR")) return this.varDeclaration();
    return this.statement();
  }

  private modifiers(): string[] {
    const mods: string[] = [];
    while (this.match("PUBLIC", "PRIVATE", "PROTECTED", "STATIC", "FINAL", "ABSTRACT", "ASYNC")) {
      mods.push(this.previous().lexeme.toLowerCase());
    }
    return mods;
  }

  private classDeclaration(modifiers: string[]): Stmt {
    const name = this.consume("IDENTIFIER", "Expect class name.");
    let superclass: Expr | undefined;
    if (this.match("EXTENDS")) {
      this.consume("IDENTIFIER", "Expect superclass name.");
      superclass = { kind: "Variable", name: this.previous().lexeme };
    }
    this.consume("LEFT_BRACE", "Expect '{' before class body.");
    const body: Stmt[] = [];
    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      body.push(this.declaration());
    }
    this.consume("RIGHT_BRACE", "Expect '}' after class body.");
    return { kind: "ClassStmt", name: name.lexeme, superclass, body, modifiers };
  }

  private structDeclaration(): Stmt {
    const name = this.consume("IDENTIFIER", "Expect struct name.");
    this.consume("LEFT_BRACE", "Expect '{' before struct fields.");
    const fields: { name: string; type?: string }[] = [];
    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      const fieldName = this.consume("IDENTIFIER", "Expect field name.").lexeme;
      let fieldType: string | undefined;
      if (this.match("COLON")) {
        fieldType = this.consume("IDENTIFIER", "Expect field type.").lexeme;
      }
      this.consume("SEMICOLON", "Expect ';' after field declaration.");
      fields.push({ name: fieldName, type: fieldType });
    }
    this.consume("RIGHT_BRACE", "Expect '}' after struct fields.");
    return { kind: "StructStmt", name: name.lexeme, fields };
  }

  private enumDeclaration(): Stmt {
    const name = this.consume("IDENTIFIER", "Expect enum name.");
    this.consume("LEFT_BRACE", "Expect '{' before enum members.");
    const members: string[] = [];
    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      members.push(this.consume("IDENTIFIER", "Expect enum member name.").lexeme);
      if (!this.match("COMMA")) break;
    }
    this.consume("RIGHT_BRACE", "Expect '}' after enum members.");
    return { kind: "EnumStmt", name: name.lexeme, members };
  }

  private interfaceDeclaration(): Stmt {
    const name = this.consume("IDENTIFIER", "Expect interface name.");
    this.consume("LEFT_BRACE", "Expect '{' before interface body.");
    const methods: Stmt[] = [];
    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      const mods = this.modifiers();
      methods.push(this.functionDeclaration(mods));
    }
    this.consume("RIGHT_BRACE", "Expect '}' after interface body.");
    return { kind: "InterfaceStmt", name: name.lexeme, methods };
  }

  private functionDeclaration(modifiers: string[]): Stmt {
    const async = modifiers.includes("async");
    if (async) modifiers.splice(modifiers.indexOf("async"), 1);
    const name = this.consume("IDENTIFIER", "Expect function name.");
    this.consume("LEFT_PAREN", "Expect '(' after function name.");
    const parameters: string[] = [];
    if (!this.check("RIGHT_PAREN")) {
      do {
        if (parameters.length >= 255) throw new Error("Cannot have more than 255 parameters.");
        parameters.push(this.consume("IDENTIFIER", "Expect parameter name.").lexeme);
      } while (this.match("COMMA"));
    }
    this.consume("RIGHT_PAREN", "Expect ')' after parameters.");
    this.consume("LEFT_BRACE", "Expect '{' before function body.");
    const body = this.block();
    return { kind: "FunctionStmt", name: name.lexeme, params: parameters, body, modifiers, async };
  }

  private varDeclaration(): Stmt {
    const name = this.consume("IDENTIFIER", "Expect variable name.");
    let initializer: Expr | undefined;
    if (this.match("EQUAL")) {
      initializer = this.expression();
    }
    this.consume("SEMICOLON", "Expect ';' after variable declaration.");
    return { kind: "VarStmt", name: name.lexeme, initializer };
  }

  private statement(): Stmt {
    if (this.match("FOR")) return this.forStatement();
    if (this.match("BREAK")) {
      this.consume("SEMICOLON", "Expect ';' after 'break'.");
      return { kind: "BreakStmt" };
    }
    if (this.match("CONTINUE")) {
      this.consume("SEMICOLON", "Expect ';' after 'continue'.");
      return { kind: "ContinueStmt" };
    }
    if (this.match("PRINT")) return this.printStatement();
    if (this.match("RETURN")) return this.returnStatement();
    if (this.match("IF")) return this.ifStatement();
    if (this.match("WHILE")) return this.whileStatement();
    if (this.match("LEFT_BRACE")) return { kind: "BlockStmt", statements: this.block() };
    return this.expressionStatement();
  }

  private forStatement(): Stmt {
    this.consume("LEFT_PAREN", "Expect '(' after 'for'.");

    let initializer: Stmt | null;
    if (this.match("SEMICOLON")) {
      initializer = null;
    } else if (this.match("VAR")) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition: Expr | null = null;
    if (!this.check("SEMICOLON")) {
      condition = this.expression();
    }
    this.consume("SEMICOLON", "Expect ';' after loop condition.");

    let increment: Expr | null = null;
    if (!this.check("RIGHT_PAREN")) {
      increment = this.expression();
    }
    this.consume("RIGHT_PAREN", "Expect ')' after for clauses.");

    const body = this.statement();

    if (increment != null) {
      const bodyWithIncrement: Stmt = {
        kind: "BlockStmt",
        statements: [body, { kind: "ExpressionStmt", expression: increment }],
      };
      return {
        kind: "BlockStmt",
        statements: [
          initializer ?? { kind: "ExpressionStmt", expression: { kind: "Literal", value: null } },
          {
            kind: "WhileStmt",
            condition: condition ?? { kind: "Literal", value: true },
            body: bodyWithIncrement,
          },
        ],
      };
    } else {
      return {
        kind: "BlockStmt",
        statements: [
          initializer ?? { kind: "ExpressionStmt", expression: { kind: "Literal", value: null } },
          {
            kind: "WhileStmt",
            condition: condition ?? { kind: "Literal", value: true },
            body,
          },
        ],
      };
    }
  }

  private printStatement(): Stmt {
    const value = this.expression();
    this.consume("SEMICOLON", "Expect ';' after value.");
    return { kind: "PrintStmt", expression: value };
  }

  private returnStatement(): Stmt {
    let value: Expr | undefined;
    if (!this.check("SEMICOLON")) {
      value = this.expression();
    }
    this.consume("SEMICOLON", "Expect ';' after return value.");
    return { kind: "ReturnStmt", value };
  }

  private ifStatement(): Stmt {
    this.consume("LEFT_PAREN", "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume("RIGHT_PAREN", "Expect ')' after if condition.");
    const thenBranch = this.statement();
    let elseBranch: Stmt | undefined;
    if (this.match("ELSE")) {
      elseBranch = this.statement();
    }
    return { kind: "IfStmt", condition, thenBranch, elseBranch };
  }

  private whileStatement(): Stmt {
    this.consume("LEFT_PAREN", "Expect '(' after 'while'.");
    const condition = this.expression();
    this.consume("RIGHT_PAREN", "Expect ')' after condition.");
    const body = this.statement();
    return { kind: "WhileStmt", condition, body };
  }

  private block(): Stmt[] {
    const statements: Stmt[] = [];
    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      statements.push(this.declaration());
    }
    this.consume("RIGHT_BRACE", "Expect '}' after block.");
    return statements;
  }

  private expressionStatement(): Stmt {
    const expr = this.expression();
    this.consume("SEMICOLON", "Expect ';' after expression.");
    return { kind: "ExpressionStmt", expression: expr };
  }

  private expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    const expr = this.or();
    if (this.match("EQUAL")) {
      const value = this.assignment();

      if (expr.kind === "Variable") {
        return { kind: "Assign", name: expr.name, value };
      }

      throw new Error("Invalid assignment target.");
    }
    return expr;
  }

  private or(): Expr {
    let expr = this.and();
    while (this.match("OR")) {
      const operator = this.previous().lexeme;
      const right = this.and();
      expr = { kind: "Logical", left: expr, operator, right };
    }
    return expr;
  }

  private and(): Expr {
    let expr = this.equality();
    while (this.match("AND")) {
      const operator = this.previous().lexeme;
      const right = this.equality();
      expr = { kind: "Logical", left: expr, operator, right };
    }
    return expr;
  }

  private equality(): Expr {
    let expr = this.comparison();
    while (this.match("BANG_EQUAL", "EQUAL_EQUAL")) {
      const operator = this.previous().lexeme;
      const right = this.comparison();
      expr = { kind: "Binary", left: expr, operator, right };
    }
    return expr;
  }

  private comparison(): Expr {
    let expr = this.term();
    while (this.match("GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL")) {
      const operator = this.previous().lexeme;
      const right = this.term();
      expr = { kind: "Binary", left: expr, operator, right };
    }
    return expr;
  }

  private term(): Expr {
    let expr = this.factor();
    while (this.match("MINUS", "PLUS")) {
      const operator = this.previous().lexeme;
      const right = this.factor();
      expr = { kind: "Binary", left: expr, operator, right };
    }
    return expr;
  }

  private factor(): Expr {
    let expr = this.unary();
    while (this.match("SLASH", "STAR")) {
      const operator = this.previous().lexeme;
      const right = this.unary();
      expr = { kind: "Binary", left: expr, operator, right };
    }
    return expr;
  }

  private unary(): Expr {
    if (this.match("BANG", "MINUS")) {
      const operator = this.previous().lexeme;
      const right = this.unary();
      return { kind: "Unary", operator, right };
    }
    return this.call();
  }

  private call(): Expr {
    let expr = this.primary();
    while (true) {
      if (this.match("LEFT_PAREN")) {
        expr = this.finishCall(expr);
      } else if (this.match("DOT")) {
        const name = this.consume("IDENTIFIER", "Expect property name after '.'.");
        expr = { kind: "Get", object: expr, name: name.lexeme };
      } else {
        break;
      }
    }
    return expr;
  }

  private finishCall(callee: Expr): Expr {
    const args: Expr[] = [];
    if (!this.check("RIGHT_PAREN")) {
      do {
        if (args.length >= 255) throw new Error("Cannot have more than 255 arguments.");
        args.push(this.expression());
      } while (this.match("COMMA"));
    }
    this.consume("RIGHT_PAREN", "Expect ')' after arguments.");
    return { kind: "Call", callee, args };
  }

  private primary(): Expr {
    if (this.match("FALSE")) return { kind: "Literal", value: false };
    if (this.match("TRUE")) return { kind: "Literal", value: true };
    if (this.match("NIL")) return { kind: "Literal", value: null };
    if (this.match("NUMBER")) return { kind: "Literal", value: this.previous().literal };
    if (this.match("STRING")) return { kind: "Literal", value: this.previous().literal };
    if (this.match("IDENTIFIER")) return { kind: "Variable", name: this.previous().lexeme };
    if (this.match("THIS")) return { kind: "This" };
    if (this.match("SUPER")) {
      this.consume("DOT", "Expect '.' after 'super'.");
      const method = this.consume("IDENTIFIER", "Expect superclass method name.");
      return { kind: "Super", method: method.lexeme };
    }
    if (this.match("LEFT_PAREN")) {
      const expr = this.expression();
      this.consume("RIGHT_PAREN", "Expect ')' after expression.");
      return { kind: "Grouping", expression: expr };
    }
    throw new Error("Expect expression.");
  }

  private match(...types: Token["type"][]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: Token["type"], message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(message + ` Got: '${this.peek().lexeme}' (line ${this.peek().line})`);
  }

  private check(type: Token["type"]): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === "EOF";
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }
}
