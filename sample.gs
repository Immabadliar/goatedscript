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
