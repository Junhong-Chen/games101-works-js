import { vec3 } from 'gl-matrix'

export default class Ray {
  constructor(origin, direction, t = 0) {
    this.origin = origin // 射线的起点
    this.direction = direction // 射线的方向
    this.directionInv = vec3.fromValues(1 / direction[0], 1 / direction[1], 1 / direction[2]) // 方向的倒数，用于加速计算（在包围盒相交测试中）
    this.t = t // 传输时间
    this.tMin = 0 // 最小传输时间
    this.tMax = Number.MAX_VALUE // 最大传输时间
  }

  /**
   * @method at - 根据参数 t 计算射线上的点，公式为 origin + t * direction。
   * @param {Number} t - 时间
   * @returns {vec3}
   */
  at(t) {
    const result = vec3.create()
    vec3.scaleAndAdd(result, this.origin, this.direction, t)
    return result
  }

  toString() {
    return `[origin: ${this.origin}, direction: ${this.direction}, time: ${this.t}]`
  }
}