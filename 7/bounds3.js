import { vec3 } from "gl-matrix"

/**
 * Class representing a 3D bounding box.
 */
export default class Bounds3 {
  /**
   * Create a bounding box.
   * @param {vec3} p1 - The first point.
   * @param {vec3} p2 - The second point.
   */
  constructor(p1, p2) {
    // two points to specify the bounding box
    if (!p1 && !p2) {
      const minNum = -Number.MAX_VALUE
      const maxNum = Number.MAX_VALUE
      this.pMax = vec3.fromValues(minNum, minNum, minNum)
      this.pMin = vec3.fromValues(maxNum, maxNum, maxNum)
    } else if (!p1 && p2) {
      this.pMin = vec3.clone(p1)
      this.pMax = vec3.clone(p1)
    } else {
      this.pMin = vec3.min(vec3.create(), p1, p2)
      this.pMax = vec3.max(vec3.create(), p1, p2)
    }
  }

  /**
   * Get the diagonal of the bounding box.（计算包围盒的对角线）
   * @returns {vec3} The diagonal of the bounding box.
   */
  diagonal() {
    return vec3.sub(vec3.create(), this.pMax, this.pMin)
  }

  /**
  * Get the maximum extent of the bounding box.（计算包围盒在三个维度上最大的扩展）
  * @returns {number} The index of the maximum extent.
  */
  maxExtent() {
    const d = this.diagonal()
    if (d[0] > d[1] && d[0] > d[2]) return 0
    if (d[1] > d[2]) return 1
    return 2
  }

  /**
   * Get the surface area of the bounding box.（计算包围盒的表面积）
   * @returns {number} The surface area.
   */
  surfaceArea() {
    const d = this.diagonal()
    return 2 * (d[0] * d[1] + d[0] * d[2] + d[1] * d[2])
  }

  /**
   * Get the centroid of the bounding box.（计算包围盒的质心）
   * @returns {vec3} The centroid.
   */
  centroid() {
    const result = vec3.create()
    vec3.add(result, this.pMin, this.pMax)
    vec3.scale(result, result, 0.5)
    return result
  }

  /**
   * Intersect this bounding box with another.（计算两个包围盒的交集）
   * @param {Bounds3} b - The other bounding box.
   * @returns {Bounds3} The intersection bounding box.
   */
  intersect(b) {
    return new Bounds3(
      vec3.fromValues(
        Math.max(this.pMin[0], b.pMin[0]),
        Math.max(this.pMin[1], b.pMin[1]),
        Math.max(this.pMin[2], b.pMin[2])
      ),
      vec3.fromValues(
        Math.min(this.pMax[0], b.pMax[0]),
        Math.min(this.pMax[1], b.pMax[1]),
        Math.min(this.pMax[2], b.pMax[2])
      )
    )
  }

  /**
   * Get the offset of a point in the bounding box.（计算某个点相对于包围盒最小点的偏移）
   * @param {vec3} p - The point.
   * @returns {vec3} The offset.
   */
  offset(p) {
    const o = vec3.create()
    vec3.subtract(o, p, this.pMin)
    if (this.pMax[0] > this.pMin[0]) o[0] /= this.pMax[0] - this.pMin[0]
    if (this.pMax[1] > this.pMin[1]) o[1] /= this.pMax[1] - this.pMin[1]
    if (this.pMax[2] > this.pMin[2]) o[2] /= this.pMax[2] - this.pMin[2]
    return o
  }

  /**
   * Check if two bounding boxes overlap.（判断两个包围盒是否重叠）
   * @param {Bounds3} b1 - The first bounding box.
   * @param {Bounds3} b2 - The second bounding box.
   * @returns {boolean} True if the bounding boxes overlap, false otherwise.
   */
  overlaps(b1, b2) {
    const x = (b1.pMax[0] >= b2.pMin[0]) && (b1.pMin[0] <= b2.pMax[0])
    const y = (b1.pMax[1] >= b2.pMin[1]) && (b1.pMin[1] <= b2.pMax[1])
    const z = (b1.pMax[2] >= b2.pMin[2]) && (b1.pMin[2] <= b2.pMax[2])
    return (x && y && z)
  }

  /**
   * Check if a point is inside a bounding box.（判断一个点是否在包围盒内）
   * @param {vec3} p - The point.
   * @param {Bounds3} b - The bounding box.
   * @returns {boolean} True if the point is inside the bounding box, false otherwise.
   */
  inside(p, b) {
    return (p[0] >= b.pMin[0] && p[0] <= b.pMax[0] &&
            p[1] >= b.pMin[1] && p[1] <= b.pMax[1] &&
            p[2] >= b.pMin[2] && p[2] <= b.pMax[2])
  }

  /**
   * Get the bounding box at index.
   * @param {number} i - The index.
   * @returns {vec3} The bounding box at index.
   */
  at(i) {
    return i === 0 ? this.pMin : this.pMax
  }

  /**
   * Check if the ray intersects the bounding box.（判断射线是否与包围盒相交）
   * @param {Ray} ray - The ray.
   * @param {vec3} invDir - The inverse direction of the ray.
   * @param {Array<number>} dirIsNeg - The direction is negative flag.
   * @returns {boolean} True if the ray intersects the bounding box, false otherwise.
   */
  intersectP(ray, invDir, dirIsNeg) {
    // invDir: ray direction(x,y,z), invDir=(1.0/x,1.0/y,1.0/z), use this because Multiply is faster that Division
    // dirIsNeg: ray direction(x,y,z), dirIsNeg=[int(x>0),int(y>0),int(z>0)], use this to simplify your logic
    // TODO test if ray bound intersects

    let tEnter = -Infinity // 光线进入所有对面
    let tExit = Infinity // 光线离开任一对面

    // 在每个维度上进行简单的范围检查
    for (let i = 0; i < 3; i++) {
      let tMin = (this.pMin[i] - ray.origin[i]) * invDir[i]
      let tMax = (this.pMax[i] - ray.origin[i]) * invDir[i]

      if (!dirIsNeg[i]) {
        [tMin, tMax] = [tMax, tMin]
      }
      tEnter = Math.max(tEnter, tMin)
      tExit = Math.min(tExit, tMax)
    }

    return tEnter <= tExit && tExit >= 0
  }

  /**
   * Get the union of two bounding boxes or a bounding box and a point.（计算两个包围盒的并集或包围盒与点的并集）
   * @param {Bounds3} b - The bounding box.
   * @param {Bounds3} bop - The bounding box or point.
   * @returns {Bounds3} The union bounding box.
   */
  static union(b, bop) {
    const ret = new Bounds3()
    if (bop instanceof Bounds3) {
      vec3.min(ret.pMin, b.pMin, bop.pMin)
      vec3.max(ret.pMax, b.pMax, bop.pMax)
    } else {
      vec3.min(ret.pMin, b.pMin, bop)
      vec3.max(ret.pMax, b.pMax, bop)
    }
    return ret
  }

  /**
   * 计算当前包围盒与其他包围盒或点的并集
   * @param {Bounds3} bop - The bounding box or point.
   * @returns {Bounds3} The union bounding box.
   */
  union(bop) {
    const ret = new Bounds3()
    if (bop instanceof Bounds3) {
      vec3.min(ret.pMin, this.pMin, bop.pMin)
      vec3.max(ret.pMax, this.pMax, bop.pMax)
    } else {
      vec3.min(ret.pMin, this.pMin, bop)
      vec3.max(ret.pMax, this.pMax, bop)
    }
    return ret
  }
}
