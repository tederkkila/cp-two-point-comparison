function minimize_l_bfgs_b(
  func: (x: number[]) => number,
  x0: number[],
  bounds: [number, number][],
  options: any = {}
): { x: number[], fun: number, message: string, nit: number } {
  const { m = 10, maxIter = 15000, pgtol = 1e-5, factr = 1e7 } = options;
  let x = x0.slice();
  let f = func(x);
  let g = numericalGradient(func, x);
  let n = x.length;
  let H = identityMatrix(n);
  let s: number[][] = [];
  let y: number[][] = [];
  let rho: number[] = [];
  let iterations = 0;

  while (iterations < maxIter && norm2(g) > pgtol) {
    let searchDirection = matrixVectorMultiply(H, g.map(val => -val));
    for (let i = 0; i < n; i++) {
      searchDirection[i] = Math.max(bounds[i][0] - x[i], Math.min(searchDirection[i], bounds[i][1] - x[i]));
    }

    let alpha = lineSearch(func, x, searchDirection, f, g);
    let x_new = vectorSum(x, searchDirection.map(val => val * alpha));
    let f_new = func(x_new);
    let g_new = numericalGradient(func, x_new);

    s.push(vectorSubtract(x_new, x));
    y.push(vectorSubtract(g_new, g));
    rho.push(1 / dotProduct(vectorSubtract(g_new, g), vectorSubtract(x_new, x)));

    x = x_new;
    f = f_new;
    g = g_new;

    if (s.length > m) {
      s.shift();
      y.shift();
      rho.shift();
    }

    H = identityMatrix(n);

    for (let i = s.length - 1; i >= 0; i--) {
      const alpha_i = rho[i] * dotProduct(s[i], matrixVectorMultiply(H, y[i]));
      const term1 = matrixMultiply(outerProduct(s[i], s[i]), H);
      const term2 = outerProduct(s[i], matrixVectorMultiply(H, y[i]));
      const term3 = outerProduct(matrixVectorMultiply(H, y[i]), s[i]);
      H = matrixSubtract(H, matrixMultiply(term1, rho[i]));
      H = matrixAdd(H, matrixMultiply(matrixSubtract(term2, term3), rho[i]));
      H = matrixMultiply(H, rho[i] * dotProduct(y[i], matrixVectorMultiply(H, y[i])) + 1);
    }
    iterations++;
  }
  return { x: x, fun: f, message: "Optimization terminated successfully.", nit: iterations };
}

function numericalGradient(func: (x: number[]) => number, x: number[], h: number = 1e-8): number[] {
  let grad: number[] = [];
  let n = x.length;
  for (let i = 0; i < n; i++) {
    let x_plus = x.slice();
    x_plus[i] += h;
    let x_minus = x.slice();
    x_minus[i] -= h;
    grad.push((func(x_plus) - func(x_minus)) / (2 * h));
  }
  return grad;
}

function lineSearch(func: (x: number[]) => number, x: number[], direction: number[], f: number, g: number[], alpha: number = 1.0, rho: number = 0.5, c: number = 1e-4): number {
  let alpha_k = alpha;
  while (func(vectorSum(x, direction.map(val => val * alpha_k))) > f + c * alpha_k * dotProduct(g, direction)) {
    alpha_k *= rho;
  }
  return alpha_k;
}

function vectorSum(a: number[], b: number[]): number[] {
  return a.map((val, index) => val + b[index]);
}

function vectorSubtract(a: number[], b: number[]): number[] {
  return a.map((val, index) => val - b[index]);
}

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, index) => sum + val * b[index], 0);
}

function norm2(a: number[]): number {
  return Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
}

function matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
  return matrix.map(row => dotProduct(row, vector));
}

function matrixMultiply(a: number[][], b: number[][]): number[][] {
  let result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < b.length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

function matrixAdd(a: number[][], b: number[][]): number[][] {
  return a.map((row, i) => row.map((val, j) => val + b[i][j]));
}

function matrixSubtract(a: number[][], b: number[][]): number[][] {
  return a.map((row, i)0 => row.map((val, j) => val - b[i][j]));
}

function outerProduct(a: number[], b: number[]): number[][] {
  return a.map(i => b.map(j => i * j));
}

function identityMatrix(n: number): number[][] {
  let matrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      matrix[i][j] = i === j ? 1 : 0;
    }
  }
  return matrix;
}