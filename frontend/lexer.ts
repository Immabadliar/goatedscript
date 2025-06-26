export type TokenType =
  // Keywords
  | "VAR" | "FUN" | "RETURN" | "PRINT" | "IF" | "ELSE" | "WHILE" | "TRUE" | "FALSE" | "NIL" | "FOR"
  | "CLASS" | "STRUCT" | "ENUM" | "INTERFACE"
  | "PUBLIC" | "PRIVATE" | "PROTECTED" | "STATIC" | "FINAL" | "ABSTRACT" | "ASYNC" | "EXTENDS" | "SUPER" | "THIS"
  | "BREAK" | "CONTINUE" | "AND" | "OR"

  // Identifiers and literals
  | "IDENTIFIER" | "STRING" | "NUMBER"

  // Single-character tokens
  | "LEFT_PAREN" | "RIGHT_PAREN" | "LEFT_BRACE" | "RIGHT_BRACE"
  | "COMMA" | "DOT" | "MINUS" | "PLUS" | "SEMICOLON" | "SLASH" | "STAR" | "EQUAL"
  | "BANG" | "BANG_EQUAL" | "EQUAL_EQUAL"
  | "GREATER" | "GREATER_EQUAL" | "LESS" | "LESS_EQUAL"
  | "COLON"

  | "EOF";

export interface Token {
  type: TokenType;
  lexeme: string;
  literal?: any;
  line: number;
}

const keywords: Record<string, TokenType> = {
  "let": "VAR",
  "fn": "FUN",
  "return": "RETURN",
  "print": "PRINT",
  "if": "IF",
  "else": "ELSE",
  "while": "WHILE",
  "true": "TRUE",
  "false": "FALSE",
  "nil": "NIL",
  "for": "FOR",

  "class": "CLASS",
  "struct": "STRUCT",
  "enum": "ENUM",
  "interface": "INTERFACE",

  "public": "PUBLIC",
  "private": "PRIVATE",
  "protected": "PROTECTED",
  "static": "STATIC",
  "final": "FINAL",
  "abstract": "ABSTRACT",
  "async": "ASYNC",

  "extends": "EXTENDS",
  "super": "SUPER",
  "this": "THIS",

  "break": "BREAK",
  "continue": "CONTINUE",

  "and": "AND",
  "or": "OR",
};

export class Lexer {
  private source: string;
  private tokens: Token[] = [];

  private start = 0;
  private current = 0;
  private line = 1;

  constructor(source: string) {
    this.source = source;
  }

  scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }
    this.tokens.push({ type: "EOF", lexeme: "", line: this.line });
    return this.tokens;
  }

  private scanToken() {
    const c = this.advance();
    switch (c) {
      case "(": this.addToken("LEFT_PAREN"); break;
      case ")": this.addToken("RIGHT_PAREN"); break;
      case "{": this.addToken("LEFT_BRACE"); break;
      case "}": this.addToken("RIGHT_BRACE"); break;
      case ",": this.addToken("COMMA"); break;
      case ".": this.addToken("DOT"); break;
      case "-": this.addToken("MINUS"); break;
      case "+": this.addToken("PLUS"); break;
      case ";": this.addToken("SEMICOLON"); break;
      case "*": this.addToken("STAR"); break;
      case ":": this.addToken("COLON"); break;
      case "!":
        this.addToken(this.match("=") ? "BANG_EQUAL" : "BANG");
        break;
      case "=":
        this.addToken(this.match("=") ? "EQUAL_EQUAL" : "EQUAL");
        break;
      case "<":
        this.addToken(this.match("=") ? "LESS_EQUAL" : "LESS");
        break;
      case ">":
        this.addToken(this.match("=") ? "GREATER_EQUAL" : "GREATER");
        break;
      case "/":
        if (this.match("/")) {
          while (this.peek() !== "\n" && !this.isAtEnd()) this.advance();
        } else {
          this.addToken("SLASH");
        }
        break;
      case " ":
      case "\r":
      case "\t":
        break;
      case "\n":
        this.line++;
        break;
      case '"':
        this.string();
        break;
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          throw new Error(`Unexpected character '${c}' at line ${this.line}`);
        }
        break;
    }
  }

  private identifier() {
    while (this.isAlphaNumeric(this.peek())) this.advance();

    const text = this.source.substring(this.start, this.current);
    const lower = text.toLowerCase();
    const type = keywords[lower] ?? "IDENTIFIER";
    this.addToken(type);
  }

  private number() {
    while (this.isDigit(this.peek())) this.advance();

    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      this.advance();
      while (this.isDigit(this.peek())) this.advance();
    }

    const value = parseFloat(this.source.substring(this.start, this.current));
    this.addToken("NUMBER", value);
  }

  private string() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === "\n") this.line++;
      this.advance();
    }

    if (this.isAtEnd()) throw new Error(`Unterminated string at line ${this.line}`);

    this.advance();

    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken("STRING", value);
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;

    this.current++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source[this.current];
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source[this.current + 1];
  }

  private isAlpha(c: string): boolean {
    return /[a-zA-Z_]/.test(c);
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private isDigit(c: string): boolean {
    return /[0-9]/.test(c);
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    return this.source.charAt(this.current++);
  }

  private addToken(type: TokenType, literal?: any) {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push({ type, lexeme: text, literal, line: this.line });
  }
}
