import { vec3 } from "gl-matrix"
import Object3D from "./object"
import Material from "./material"
import Ray from "./ray"
import Intersection from "./intersection"
import Bounds3 from "./bounds3"
import { solveQuadratic } from "./utils"

/**
 * @class Sphere
 * @extends Object3D
 */
export default class Sphere extends Object3D {
  /**
   * Creates an instance of Sphere.
   * @param {vec3} center - The center of the sphere.
   * @param {number} radius - The radius of the sphere.
   * @param {Material} [material=new Material()] - The material of the sphere.
   */
  constructor({ center, radius, material = new Material() }) {
    super(arguments[0])
    this.center = center
    this.radius = radius
    this.radius2 = radius * radius
    this.material = material
    this.area = 4 * Math.PI * radius * radius
  }

  /**
   * Checks if a ray intersects the sphere.
   * @param {Ray} ray - The ray to check for intersection.
   * @returns {boolean} True if the ray intersects the sphere, false otherwise.
   */
  intersect(ray) {
    const L = vec3.create()
    vec3.subtract(L, ray.origin, this.center)
    const a = vec3.dot(ray.direction, ray.direction)
    const b = 2 * vec3.dot(ray.direction, L)
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

  /**
   * Returns the intersection details of a ray with the sphere.
   * @param {Ray} ray - The ray to check for intersection.
   * @returns {Intersection} The intersection details.
   */
  getIntersection(ray) {
    const result = new Intersection()
    result.happened = false
    const L = vec3.create()
    vec3.subtract(L, ray.origin, this.center)
    const a = vec3.dot(ray.direction, ray.direction)
    const b = 2 * vec3.dot(ray.direction, L)
    const c = vec3.dot(L, L) - this.radius2
    const t0 = []
    const t1 = []
    if (!solveQuadratic(a, b, c, t0, t1)) return result
    if (t0[0] < 0) t0[0] = t1[0]
    if (t0[0] < 0) return result
    result.happened = true
    const temp = vec3.create()
    vec3.scale(temp, ray.direction, t0[0])
    vec3.add(result.coords, ray.origin, temp)
    vec3.subtract(result.normal, result.coords, this.center)
    vec3.normalize(result.normal, result.normal)
    result.material = this.material
    result.object = this
    result.distance = t0[0]
    return result
  }

  /**
   * Returns the surface properties of the sphere.
   * @param {vec3} P - The point on the surface.
   * @param {vec3} I - The incident vector.
   * @param {number} index - The index of the intersected object.
   * @param {vec2} uv - The UV coordinates.
   * @param {vec2} st - The surface texture coordinates.
   */
  getSurfaceProperties(P, I, index, uv, st) {
    const N = vec3.create()
    vec3.subtract(N, P, this.center)
    vec3.normalize(N, N)
    return N
  }

  /**
   * Returns the diffuse color of the sphere.
   * @param {vec2} st - The surface texture coordinates.
   * @returns {vec3} The diffuse color.
   */
  evalDiffuseColor(st) {
    // return this.material.getColor()
  }

  /**
   * Returns the bounding box of the sphere.
   * @returns {Bounds3} The bounding box.
   */
  getBounds() {
    const min = vec3.fromValues(
      this.center[0] - this.radius,
      this.center[1] - this.radius,
      this.center[2] - this.radius
    )
    const max = vec3.fromValues(
      this.center[0] + this.radius,
      this.center[1] + this.radius,
      this.center[2] + this.radius
    )
    return new Bounds3(min, max)
  }

  /**
   * Samples a point on the surface of the sphere.
   * @param {Intersection} pos - The intersection point.
   * @param {number} pdf - The probability density function value.
   * @returns {number} pdf
   */
  sample(pos, pdf) {
    const theta = 2.0 * Math.PI * Math.random()
    const phi = Math.PI * Math.random()
    const dir = vec3.fromValues(Math.cos(phi), Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta))
    vec3.scaleAndAdd(pos.coords, this.center, dir, this.radius)
    vec3.copy(pos.normal, dir)
    pos.emit = this.material.emission
    pdf = 1 / this.area
    return pdf
  }

  /**
   * Checks if the sphere has emission.
   * @returns {boolean} True if the sphere has emission, false otherwise.
   */
  hasEmission() {
    return this.material.hasEmission()
  }

}