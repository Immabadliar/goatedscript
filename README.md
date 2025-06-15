# GoatedScript

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)  
[![Deno Version](https://img.shields.io/badge/deno->=1.0.0-blue.svg)](https://deno.land/)  
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)  

---

## Table of Contents

- [Introduction](#introduction)  
- [Features](#features)  
- [Example Program](#example-program)  
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

**GoatedScript** is a lightweight, minimalistic programming language designed to combine the simplicity of JavaScript with the power and clarity of Rust-like syntax. It uses lowercase keywords such as `let` and `fn` for variable declarations and function definitions, respectively, to keep the syntax clean and easy to learn.

Built with extensibility in mind, GoatedScript currently supports basic control flow constructs, arithmetic expressions, string operations, and built-in functions like `print` for output. The language is interpreted using a custom-built parser and runtime, powered by Deno for seamless execution.

GoatedScript is ideal for learners, language enthusiasts, or anyone interested in building interpreters and experimenting with language design.

---

## Features

- **Simple syntax** with lowercase keywords `let` and `fn`  
- Variable declarations and assignments  
- Function definitions and calls with return values  
- Control flow statements: `if-else`, `while` loops  
- Expression evaluation with arithmetic and string concatenation  
- Built-in `print` function for output to console  
- Case-sensitive syntax for clarity  
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
```

**Output:**

15
Result is greater than 10
Loop iteration: 0
Loop iteration: 1
Loop iteration: 2


# Extending the Language
You can add features such as:

Additional built-in functions

More control flow statements (for loops, switch, etc)

Data types like arrays and objects

Error handling with try/catch

Modules and imports

The code is designed to be clear and modular to facilitate these extensions.

# Contributing
Contributions are welcome! Please open issues or pull requests on GitHub.

# License
MIT License © 2025 Luca Cocchia

# Contact
For questions or feedback, reach out via GitHub or your preferred platform.
