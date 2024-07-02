import { vec3 } from "gl-matrix"

export const EPSILON = 1e-3

/**
 * Converts degrees to radians.
 * @param {number} deg - The angle in degrees.
 * @returns {number} The angle in radians.
 */
export function deg2rad(deg) {
  return deg * Math.PI / 180
}

/**
 * Clamps a value between a minimum and maximum value.
 * @param {number} value - The value to clamp.
 * @param {number} [min=0] - The minimum value.
 * @param {number} [max=1] - The maximum value.
 * @returns {number} The clamped value.
 */
export function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

/**
 * Reflect the incident vector I with respect to the normal N.
 * @param {vec3} I - The incident vector.
 * @param {vec3} N - The normal vector.
 * @returns {vec3} The reflected vector.
 */
export function reflect(I, N) {
  return vec3.scaleAndAdd(vec3.create(), I, N, -2 * vec3.dot(I, N))
}

/**
* Compute refraction direction using Snell's law
* We need to handle with care the two possible situations:
* - When the ray is inside the object.
* - When the ray is outside.
*
* If the ray is outside, you need to make cosi positive cosi = -N.I
* If the ray is inside, you need to invert the refractive indices and negate the normal N
* @param {vec3} I - The incident vector.
* @param {vec3} N - The normal vector.
* @param {number} ior - The material refractive index.
* @returns {vec3} The refracted vector.
*/
export function refract(I, N, ior) {
  let cosi = clamp(vec3.dot(I, N), -1, 1)
  let etai = 1, etat = ior
  let n = vec3.clone(N)
  if (cosi < 0) {
    cosi = -cosi
  } else {
    [etai, etat] = [etat, etai]
    vec3.negate(n, N)
  }
  const eta = etai / etat
  const k = 1 - eta * eta * (1 - cosi * cosi)

  const refracted = vec3.create()
  if (k >= 0) {
    vec3.scale(refracted, I, eta)
    vec3.scaleAndAdd(refracted, refracted, n, eta * cosi - Math.sqrt(k))
  }
  return refracted
}

/**
 * @method fresnel - Compute Fresnel equation
 * @param {vec3} I - The incident view direction.
 * @param {vec3} N - The normal at the intersection point.
 * @param {number} ior - The material refractive index.
 * @returns {number} kr
 */
export function fresnel(I, N, ior) {
  let cosi = clamp(vec3.dot(I, N), -1, 1)
  let etai = 1, etat = ior
  if (cosi > 0) {
    [etai, etat] = [etat, etai]
  }
  // Compute sini using Snell's law
  const sint = etai / etat * Math.sqrt(Math.max(0, 1 - cosi * cosi))
  // Total internal reflection
  if (sint >= 1) {
    return 1
  } else {
    const cost = Math.sqrt(Math.max(0, 1 - sint * sint))
    cosi = Math.abs(cosi)
    const Rs = ((etat * cosi) - (etai * cost)) / ((etat * cosi) + (etai * cost))
    const Rp = ((etai * cosi) - (etat * cost)) / ((etai * cosi) + (etat * cost))
    return (Rs * Rs + Rp * Rp) / 2
  }
  // As a consequence of the conservation of energy, transmittance is given by:
  // kt = 1 - kr
}

/**
 * Solves the quadratic equation.
 * @param {number} a - The coefficient of x^2.
 * @param {number} b - The coefficient of x.
 * @param {number} c - The constant term.
 * @returns {Object} The solutions.
 */
export function solveQuadratic(a, b, c) {
  const discr = b * b - 4 * a * c
  let x0, x1
  if (discr < 0)
    return false
  else if (discr === 0)
    x0 = x1 = -.5 * b / a
  else {
    const q = (b > 0) ? -.5 * (b + Math.sqrt(discr)) : -.5 * (b - Math.sqrt(discr))
    x0 = q / a
    x1 = c / q
  }
  if (x0 > x1) {
    [x0, x1] = [x1, x0]
  }
  return { x0, x1 }
}