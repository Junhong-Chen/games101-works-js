import { vec3 } from 'gl-matrix'
import Object3D from './object'
import Material from './material'

// 解一元二次方程
function solveQuadratic(a, b, c) {
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

export default class Sphere extends Object3D {
  constructor({
    center,
    radius
  }) {
    super(arguments[0])
    this.center = center
    this.radius = radius
    this.radius2 = radius * radius
    this.material = new Material()
  }

  // 光线是否与球相交
  intersect(orig, dir, tNear) {
    const L = vec3.sub(vec3.create(), orig, this.center)
    const a = vec3.dot(dir, dir)
    const b = vec3.dot(dir, L) * 2
    const c = vec3.dot(L, L) - this.radius2
    const result = solveQuadratic(a, b, c)
    if (result) {
      const { x0: t0, x1: t1 } = result
      const t = t0 < 0 ? t1 : t0

      if (t >= 0 && t < tNear) {
        return {
          tNear: t,
          hitObj: this
        }
      }
    }
    return false
  }

  getSurfaceProperties({ hitPoint }) {
    return {
      normal: vec3.normalize(vec3.create(), vec3.sub(vec3.create(), hitPoint, this.center))
    }
  }
}