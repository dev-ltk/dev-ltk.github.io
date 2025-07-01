export function calculateVc(Q, A, grade, h, T_inf, interpolate_k1, revision) {
    // initial guess
    let V0 = 5.0;
    let k1;
    let kg;
    let rho_inf;
    let Cp;
    if (Q <= 0 || A <= 0 || h <= 0) {
        throw new Error("Input error: Negative or zero Q, A and/or H");
    }
    if (T_inf < -30 || T_inf > 50) {
        throw new Error("Out of range error: Upstream temperature is not between -30 and 50 degree Celsius");
    }
    rho_inf = getrhoInf(T_inf);
    Cp = getCp(T_inf);
    k1 = revision === 2017 ? getk1(Q, interpolate_k1) : 0.606;
    kg = grade >= 0 ? 1 : 1 + 0.0374 * Math.pow(Math.abs(grade), 0.8);
    return iterateVc(V0, k1, kg, h, Q, rho_inf, Cp, A, T_inf);
}
function iterateVc(Vc0, k1, kg, h, Q, rho_inf, Cp, A, T_inf) {
    const g = 9.81;
    let Tf;
    let Vc1;
    let iteration_diff;
    Tf = Q * 1000 / (rho_inf * Cp * A * Vc0) + (T_inf + 273);
    Vc1 = k1 * kg * Math.pow((g * h * Q * 1000 / rho_inf / Cp / A / Tf), (1 / 3));
    iteration_diff = Vc1 - Vc0;
    if (iteration_diff <= 0) {
        // assume the function is monotonically convergent
        if (iteration_diff < -0.001) {
            return iterateVc(Vc1, k1, kg, h, Q, rho_inf, Cp, A, T_inf);
        }
        else {
            return Vc1;
        }
    }
    else {
        throw new Error("Numerical error: Iteration diverges");
    }
}
function linearInterpolate(x, x0, x1, y0, y1) {
    if (x1 === x0) {
        throw new Error("Numerical error: Divided by 0");
    }
    return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
}
function findClosest(arr, value) {
    let closest = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] <= value) {
            closest = i;
        }
        else {
            break;
        }
    }
    return closest;
}
export function getrhoInf(T_inf) {
    const T_air = [-30, -20, -10, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    const rho_air = [1.451, 1.394, 1.341, 1.292, 1.269, 1.246, 1.225, 1.204, 1.184, 1.164, 1.145, 1.127, 1.109, 1.092];
    let T_index;
    T_index = findClosest(T_air, T_inf);
    if (T_index === T_air.length - 1) {
        return rho_air[T_index];
    }
    else {
        return linearInterpolate(T_inf, T_air[T_index], T_air[T_index + 1], rho_air[T_index], rho_air[T_index + 1]);
    }
}
export function getCp(T_inf) {
    const T_air = [-30, -20, -10, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    const Cp_air = [1.004, 1.005, 1.006, 1.006, 1.006, 1.006, 1.007, 1.007, 1.007, 1.007, 1.007, 1.007, 1.007, 1.007];
    let T_index;
    T_index = findClosest(T_air, T_inf);
    if (T_index === T_air.length - 1) {
        return Cp_air[T_index];
    }
    else {
        return linearInterpolate(T_inf, T_air[T_index], T_air[T_index + 1], Cp_air[T_index], Cp_air[T_index + 1]);
    }
}
export function getk1(Q, interpolate_k1) {
    // the 1st pair of data (0 & 0.87) is added to keep the if clause neat, i.e. Q is between 10 to 30
    // otherwise, it will need to check if Q is greater than 10 when the closest index is 0
    const Q1 = [0, 10, 30, 50, 70, 90, 100];
    const k1 = [0.87, 0.87, 0.74, 0.68, 0.64, 0.62, 0.606];
    let k1_index;
    k1_index = findClosest(Q1, Q);
    if (interpolate_k1) {
        if (k1_index === 0 || k1_index === 6) {
            return k1[k1_index];
        }
        else {
            return linearInterpolate(Q, Q1[k1_index], Q1[k1_index + 1], k1[k1_index], k1[k1_index + 1]);
        }
    }
    else {
        return k1[k1_index];
    }
}
//# sourceMappingURL=vc.js.map