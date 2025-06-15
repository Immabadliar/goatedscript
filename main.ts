import { Lexer } from "./frontend/lexer.ts";
import { Parser } from "./frontend/parser.ts";
import { Interpreter } from "./runtime/interpreter.ts";

async function run(source: string) {
  try {
    const lexer = new Lexer(source);
    const tokens = lexer.scanTokens();

    const parser = new Parser(tokens);
    const statements = parser.parse();

    const interpreter = new Interpreter();
    interpreter.interpret(statements);

  } catch (err) {
    console.error("Error:", err.message);
  }
}

const filename = Deno.args[0];
if (!filename) {
  console.error("Usage: deno run --allow-read main.ts <sourcefile.gs>");
  Deno.exit(1);
}

const source = await Deno.readTextFile(filename);
run(source);
