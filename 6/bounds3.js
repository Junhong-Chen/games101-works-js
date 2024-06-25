import { vec3 } from "gl-matrix"

export default class Bounds3 {
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
      this.pMin = vec3.fromValues(Math.min(p1[0], p2[0]), Math.min(p1[1], p2[1]), Math.min(p1[2], p2[2]))
      this.pMax = vec3.fromValues(Math.max(p1[0], p2[0]), Math.max(p1[1], p2[1]), Math.max(p1[2], p2[2]))
    }
  }

  // 计算包围盒的对角线
  diagonal() {
    return vec3.sub(vec3.create(), this.pMax, this.pMin)
  }

  // 计算包围盒在三个维度上最大的扩展
  maxExtent() {
    const d = this.diagonal()
    if (d[0] > d[1] && d[0] > d[2]) return 0
    if (d[1] > d[2]) return 1
    return 2
  }

  // 计算包围盒的表面积
  surfaceArea() {
    const d = this.diagonal()
    return 2 * (d[0] * d[1] + d[0] * d[2] + d[1] * d[2])
  }

  // 计算包围盒的质心
  centroid() {
    const result = vec3.create()
    vec3.add(result, this.pMin, this.pMax)
    vec3.scale(result, result, 0.5)
    return result
  }

  // 计算两个包围盒的交集
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

  // 计算某个点相对于包围盒最小点的偏移
  offset(p) {
    const o = vec3.create()
    vec3.subtract(o, p, this.pMin)
    if (this.pMax[0] > this.pMin[0]) o[0] /= this.pMax[0] - this.pMin[0]
    if (this.pMax[1] > this.pMin[1]) o[1] /= this.pMax[1] - this.pMin[1]
    if (this.pMax[2] > this.pMin[2]) o[2] /= this.pMax[2] - this.pMin[2]
    return o
  }

  // 判断两个包围盒是否重叠
  overlaps(b1, b2) {
    const x = (b1.pMax[0] >= b2.pMin[0]) && (b1.pMin[0] <= b2.pMax[0])
    const y = (b1.pMax[1] >= b2.pMin[1]) && (b1.pMin[1] <= b2.pMax[1])
    const z = (b1.pMax[2] >= b2.pMin[2]) && (b1.pMin[2] <= b2.pMax[2])
    return (x && y && z)
  }

  // 判断一个点是否在包围盒内
  inside(p, b) {
    return (p[0] >= b.pMin[0] && p[0] <= b.pMax[0] &&
            p[1] >= b.pMin[1] && p[1] <= b.pMax[1] &&
            p[2] >= b.pMin[2] && p[2] <= b.pMax[2])
  }

  // 判断射线是否与包围盒相交
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
    
    return tEnter < tExit && tExit >= 0
  }

  // 计算两个包围盒的并集或包围盒与点的并集
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
