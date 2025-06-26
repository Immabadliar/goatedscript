# GoatedScript

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)  
[![Deno Version](https://img.shields.io/badge/deno->=1.0.0-blue.svg)](https://deno.land/)  
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)  

---

## Table of Contents

- [Introduction](#introduction)  
- [Features](#features)  
- [Example Program](#example-program)  
- [Extended Language Features](#extended-language-features)  
- [Installation & Usage](#installation--usage)  
- [Language Syntax](#language-syntax)  
- [Architecture Overview](#architecture-overview)  
- [Project Structure](#project-structure)  
- [Error Handling](#error-handling)  
- [Limitations](#limitations)  
- [Roadmap & Future Work](#roadmap--future-work)  
- [Contributing](#contributing)  
- [License](#license)  
- [Author](#author)  

---

## Introduction

**GoatedScript** is a lightweight, minimalistic programming language designed to combine the simplicity of JavaScript with the power and clarity of Rust-like and Java-like syntax. It uses lowercase keywords such as `let` and `fn` for variable declarations and function definitions, respectively, to keep the syntax clean and easy to learn.

Built with extensibility in mind, GoatedScript currently supports basic control flow constructs, arithmetic expressions, string operations, and built-in functions like `print` for output. The language is interpreted using a custom-built parser and runtime, powered by Deno for seamless execution.

GoatedScript is ideal for learners, language enthusiasts, or anyone interested in building interpreters and experimenting with language design.

---

## Features

- Simple syntax with lowercase keywords `let` and `fn`  
- Variable declarations and assignments  
- Function definitions and calls with return values  
- Control flow statements: `if-else`, `while` loops, `for` loops  
- Expression evaluation with arithmetic and string concatenation  
- Built-in `print` function for output to console  
- Classes with inheritance, fields, methods, and constructors  
- Enums for named constant values  
- Interfaces and structs  
- Function modifiers: `public`, `static`, `final`, `async`, `void`  
- Modular architecture for easy enhancements  
- Interpreted via Deno runtime for ease of use  

---

## Example Program

```goatedscript
let x = 5;
let y = 10;

fn add(a, b) {
  return a + b;
}

let result = add(x, y);

print(result);

if (result > 10) {
  print("Result is greater than 10");
} else {
  print("Result is 10 or less");
}

let i = 0;
while (i < 3) {
  print("Loop iteration: " + i);
  i = i + 1;
}

for (let j = 0; j < 5; j = j + 1) {
  print(j);
}
```
**Expected Output:**

```
15
Result is greater than 10
Loop iteration: 0
Loop iteration: 1
Loop iteration: 2
0
1
2
3
4
```

#Extended Language Features

**Classes**

```goatedscript
class Animal {
  let name;

  fn constructor(name) {
    this.name = name;
  }

  fn speak() {
    print(this.name + " makes a sound.");
  }
}

class Dog extends Animal {
  fn speak() {
    print(this.name + " barks.");
  }
}

let dog = new Dog("Rex");
dog.speak(); // Output: Rex barks.
```

**Enums**
```goatedscript
enum Direction {
  North,
  East,
  South,
  West
}

let dir = Direction.North;
if (dir == Direction.North) {
  print("Heading North");
}
```

**Interfaces**
```goatedscript
interface Printable {
  fn print();
}

class Document implements Printable {
  fn print() {
    print("Printing document...");
  }
}

let doc = new Document();
doc.print();
```

**Structs**
```goatedscript
struct Point {
  let x;
  let y;
}

let p = Point { x: 10, y: 20 };
print(p.x); // Output: 10
```

**Function Modifiers**
```goatedscript
class Example {
  public static fn greet() {
    print("Hello from static method!");
  }

  final fn run() {
    print("This method cannot be overridden.");
  }

  async fn fetchData() {
    // async code here
    return "data";
  }

  void fn log(msg) {
    print(msg);
  }
}

Example.greet();

let ex = new Example();
ex.run();
ex.fetchData().then(data => print(data));
ex.log("Logging a message");
```

# Installation and Usage

1. Install Deno
2. Clone this Repository
3. Run your GoatedScript Program:
```bash
deno run --allow-read main.ts your_script.gs
```

#Language Syntax

* Variables: let x = 10;

* Functions: fn name(params) { ... }

* Classes: class Name { ... }

* Control flow: if, else, while, for

* Expressions: arithmetic, logical, function calls

* Built-in: print, return

Architecture Overview
Lexer: Tokenizes source code

Parser: Converts tokens into Abstract Syntax Tree (AST)

Interpreter: Executes AST with runtime environment

Environment: Manages scopes and variable bindings

# Project Structure
```
├── frontend/
│   ├── lexer.ts
│   ├── parser.ts
│   └── ast.ts
├── runtime/
│   ├── interpreter.ts
│   ├── env.ts
│   └── values.ts
├── main.ts
└── sample.gs
```
# Error Handling
Syntax errors during parsing throw descriptive errors with line numbers.

Runtime errors (like undefined variables) throw RuntimeError.

return statements throw special ReturnException internally to unwind call stack.

# Limitations
Async/await currently partially supported.

No full module system yet.

Interfaces checked only at runtime, no static checks.

No garbage collection (simple interpreter).

Roadmap & Future Work
Full async/await support

Module import/export system

Switch/case statements

Enhanced type system

Improved error reporting

Standard library expansion

# Contributing
Contributions are welcome! Please open issues or pull requests on GitHub.

# License
MIT License © 2025 Luca Cocchia

# Author
Luca Cocchia 

# Interactive Chat Editor (Popout)
To try GoatedScript interactively, you can embed this HTML snippet on your webpage or open it locally:


```
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>GoatedScript Interactive Editor</title>
<style>
  body { font-family: monospace; background: #1e1e1e; color: #c5c6c7; margin: 0; }
  textarea { width: 100%; height: 60vh; background: #0f0f0f; color: #0f0; border: none; padding: 1rem; font-size: 1rem; }
  pre { background: #121212; padding: 1rem; margin: 0; white-space: pre-wrap; }
  button { margin: 1rem 0; padding: 0.5rem 1rem; background: #45a29e; border: none; color: white; cursor: pointer; }
  button:hover { background: #66fcf1; color: #000; }
</style>
</head>
<body>
<h2 style="text-align:center;">GoatedScript Interactive Editor</h2>
<textarea id="code" spellcheck="false">
// Write GoatedScript code here

let x = 10;
print(x);

fn add(a, b) {
  return a + b;
}

print(add(5, 7));
</textarea>
<button id="runBtn">Run</button>
<pre id="output"></pre>

<script type="module">
// Assuming you have GoatedScript interpreter compiled to JS or accessible
// Here we simulate with a dummy function; replace with actual interpreter API.

async function runCode(source) {
  // You can call your Deno backend or WASM interpreter here.
  // For demo, just echo code and pretend to run:
  return "Output:\n" + source.split('\n').map((l,i)=>i+1 + ": " + l).join('\n');
}

const runBtn = document.getElementById('runBtn');
const output = document.getElementById('output');
const code = document.getElementById('code');

runBtn.onclick = async () => {
  output.textContent = "Running...";
  try {
    const result = await runCode(code.value);
    output.textContent = result;
  } catch(e) {
    output.textContent = "Error: " + e.message;
  }
};
</script>
</body>
</html>
```
Replace the runCode function with your actual interpreter call (e.g., via WebAssembly, a server endpoint, or client-side JS compiled interpreter) to get live execution of GoatedScript code.