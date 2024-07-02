import { vec3 } from "gl-matrix"

/**
 * Class representing a ray.
 */
export default class Ray {
  /**
   * Create a ray.
   * @param {vec3} origin - The origin of the ray.
   * @param {vec3} direction - The direction of the ray.
   * @param {number} [t=0] - The transportation time.
   */
  constructor(origin, direction, t = 0) {
    this.origin = origin // 射线的起点
    this.direction = direction // 射线的方向
    this.directionInv = vec3.fromValues(1 / direction[0], 1 / direction[1], 1 / direction[2]) // 方向的倒数，用于加速计算（在包围盒相交测试中）
    this.t = t // 传输时间
    this.tMin = 0 // 最小传输时间
    this.tMax = Number.MAX_VALUE // 最大传输时间
  }

  /**
   * Get the position of the ray at time t.
   * @method at - 根据时间参数 t 计算射线上的点。
   * @param {number} t - The Time.
   * @returns {vec3} The position of the ray at time t.
   */
  at(t) {
    const result = vec3.create()
    vec3.scaleAndAdd(result, this.origin, this.direction, t)
    return result
  }

  /**
   * Convert the ray to a string.
   * @returns {string} The string representation of the ray.
   */
  toString() {
    return `[origin: ${this.origin}, direction: ${this.direction}, time: ${this.t}]`
  }
}