export class LBFGS {
  private m: number; // Number of correction vectors to store
  private s: number[][]; // Stores the differences in x
  private y: number[][]; // Stores the differences in gradients
  private rho: number[]; // Stores the scaling factors
  private alpha: number[]; // Temporary storage for alpha values
  private k: number; // Current iteration count

  constructor(m: number = 10) {
    this.m = m;
    this.s = [];
    this.y = [];
    this.rho = [];
    this.alpha = new Array(m);
    this.k = 0;
  }

  /**
   * Minimizes the given function using the L-BFGS algorithm.
   * @param func The function to minimize. Should accept a number array and return a number (the function value).
   * @param gradient The gradient function of the function to minimize. Should accept a number array and return a number array (the gradient vector).
   * @param x0 The initial guess for the minimum.
   * @param options Optional parameters for the optimization.
   * @param options.maxIterations Maximum number of iterations (default: 100).
   * @param options.epsilon Tolerance for convergence (default: 1e-5).
   * @returns An object containing the optimized parameters, the function value at the optimum, and the number of iterations.
   */
  minimize(
    func: (x: number[]) => number,
    gradient: (x: number[]) => number[],
    x0: number[],
    options: { maxIterations?: number; epsilon?: number; bounds?:number[][] } = {}
  ): { x: number[]; value: number; iterations: number } {
    const maxIterations = options.maxIterations || 100;
    const epsilon = options.epsilon || 1e-5;
    const bounds= options.bounds

    let x = [...x0];
    let grad = gradient(x);

    for (let i = 0; i < maxIterations; i++) {
      const direction = this.getSearchDirection(grad);

      //bound directions
      if(bounds) {
        //console.log(x)
        //console.log(direction)
        for (let i = 0; i < x.length; i++) {
          direction[i] = Math.max(bounds[i][0] - x[i], Math.min(direction[i], bounds[i][1] - x[i]));
        }
        //console.log(direction)
      }


      const stepSize = this.lineSearch(func, gradient, x, direction);
      // console.log(stepSize)
      //
      // if (stepSize < 1e-16) {
      //   return { x: x, value: func(x), iterations: i + 1 };
      // }

      const x_new = x.map((val, index) => val + stepSize * direction[index]);
      const grad_new = gradient(x_new);

      // console.log(x_new);
      // console.log(x)

      // Update L-BFGS memory
      this.updateMemory(x, x_new, grad, grad_new);

      x = x_new;
      grad = grad_new;
      this.k++;

      if (grad.reduce((sum, val) => sum + val * val, 0) < epsilon * epsilon) {
        return { x: x, value: func(x), iterations: i + 1 };
      }
    }

    return { x: x, value: func(x), iterations: maxIterations };
  }

  /**
   * Gets the search direction using the two-loop recursion.
   * @param grad The current gradient vector.
   * @returns The search direction.
   */
  private getSearchDirection(grad: number[]): number[] {
    const m = this.s.length;
    const q = [...grad];

    for (let i = m - 1; i >= 0; i--) {
      this.alpha[i] = (this.rho[i] * this.dot(this.s[i], q));
      q.forEach((val, index) => q[index] -= this.alpha[i] * this.y[i][index]);
    }

    const gamma = m > 0 ? this.dot(this.s[m - 1], this.y[m - 1]) / this.dot(this.y[m - 1], this.y[m - 1]) : 1;
    const r = q.map(val => val * gamma);

    for (let i = 0; i < m; i++) {
      const beta = this.rho[i] * this.dot(this.y[i], r);
      r.forEach((val, index) => r[index] += (this.alpha[i] - beta) * this.s[i][index]);
    }

    return r.map(val => -val);
  }


  /**
   * Updates the L-BFGS memory with the new (s, y) pair.
   * @param x_old The previous x value.
   * @param x_new The current x value.
   * @param grad_old The previous gradient value.
   * @param grad_new The current gradient value.
   */
  private updateMemory(x_old: number[], x_new: number[], grad_old: number[], grad_new: number[]): void {
    const s = x_new.map((val, index) => val - x_old[index]);
    const y = grad_new.map((val, index) => val - grad_old[index]);
    const rho = 1 / this.dot(y, s);

    this.s.push(s);
    this.y.push(y);
    this.rho.push(rho);

    if (this.s.length > this.m) {
      this.s.shift();
      this.y.shift();
      this.rho.shift();
    }
  }


  /**
   * Performs a simple backtracking line search to find a suitable step size.
   * @param func The function to minimize.
   * @param gradient The gradient function.
   * @param x The current x value.
   * @param direction The search direction.
   * @param alpha Initial step size.
   * @param beta Reduction factor for backtracking.
   * @returns The step size.
   */
  private lineSearch(
    func: (x: number[]) => number,
    gradient: (x: number[]) => number[],
    x: number[],
    direction: number[],
    alpha: number = 1,
    beta: number = 0.5
  ): number {
    const phi = (step: number) => func(x.map((val, index) => val + step * direction[index]));
    const dphi0 = this.dot(gradient(x), direction);
    let step = alpha;
    while (phi(step) > phi(0) + 1e-4 * step * dphi0) {
      step *= beta;
    }
    return step;
  }


  /**
   * Calculates the dot product of two vectors.
   * @param a The first vector.
   * @param b The second vector.
   * @returns The dot product.
   */
  private dot(a: number[], b: number[]): number {
    return a.reduce((sum, val, index) => sum + val * b[index], 0);
  }
}