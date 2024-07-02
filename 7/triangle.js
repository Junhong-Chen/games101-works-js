import { vec2, vec3 } from "gl-matrix"
import Object3D from "./object"
import Material from "./material"
import Ray from "./ray"
import Intersection from "./intersection"
import Bounds3 from "./bounds3"
import BVHAccel from "./BVH"

/**
 * Checks if a ray intersects with a triangle.
 * @param {vec3} v0 - The first vertex of the triangle.
 * @param {vec3} v1 - The second vertex of the triangle.
 * @param {vec3} v2 - The third vertex of the triangle.
 * @param {vec3} orig - The origin of the ray.
 * @param {vec3} dir - The direction of the ray.
 * @returns {Object} The nearest intersection distance and barycentric coordinate.
 */
function rayTriangleIntersect(v0, v1, v2, orig, dir) {
  // Möller–Trumbore 算法
  const E1 = vec3.sub(vec3.create(), v1, v0)
  const E2 = vec3.sub(vec3.create(), v2, v0)
  const S = vec3.sub(vec3.create(), orig, v0)
  const S1 = vec3.cross(vec3.create(), dir, E2)
  const S2 = vec3.cross(vec3.create(), S, E1)

  const result = vec3.scale(
    vec3.create(),
    vec3.fromValues(
      vec3.dot(S2, E2),
      vec3.dot(S1, S),
      vec3.dot(S2, dir)
    ),
    1 / vec3.dot(S1, E1)
  )
  const [tNear, u, v] = result

  // u、v 表示重心坐标
  if (tNear >= 0 && v >= 0 && u >= 0 && (u + v) <= 1) {
    return { tNear, u, v }
  }
}

/**
 * @class Triangle
 * @extends Object3D
 */
export class Triangle extends Object3D {
  /**
   * Creates an instance of Triangle.
   * @param {vec3} v0 - The first vertex of the triangle.
   * @param {vec3} v1 - The second vertex of the triangle.
   * @param {vec3} v2 - The third vertex of the triangle.
   * @param {Material} [material=null] - The material of the triangle.
   */
  constructor(v0, v1, v2, material = null) {
    super()
    this.v0 = v0
    this.v1 = v1
    this.v2 = v2
    this.material = material
    const e1 = vec3.sub(vec3.create(), v1, v0)
    const e2 = vec3.sub(vec3.create(), v2, v0)
    this.normal = vec3.cross(vec3.create(), e1, e2)
    this.area = vec3.length(this.normal) * 0.5
    vec3.normalize(this.normal, this.normal)
  }

  /**
   * Checks if a ray intersects the triangle.
   * @param {Ray} ray - The ray to check for intersection.
   * @returns {boolean} True if the ray intersects the triangle, false otherwise.
   */
  intersect(ray) {
    return true
  }

  /**
   * Checks if a ray intersects the triangle and returns the intersection distance.
   * @param {Ray} ray - The ray to check for intersection.
   * @param {number} tnear - The nearest intersection distance.
   * @param {number} index - The index of the intersected object.
   * @returns {boolean} True if the ray intersects the triangle, false otherwise.
   */
  intersectWithDistance(ray, tnear, index) {
    return false
  }

  /**
   * Returns the intersection details of a ray with the triangle.
   * @param {Ray} ray - The ray to check for intersection.
   * @returns {Intersection} The intersection details.
   */
  getIntersection(ray) {
    const inter = new Intersection()

    if (vec3.dot(ray.direction, this.normal) > 0) return inter

    const hit = rayTriangleIntersect(this.v0, this.v1, this.v2, ray.origin, ray.direction)

    // TODO find ray triangle intersection
    if (hit) {
      const { tNear } = hit
      inter.happened = true
      inter.coords = ray.at(tNear)
      inter.normal = this.normal
      inter.distance = tNear
      inter.obj = this
      inter.material = this.material
    }

    return inter
  }

  /**
   * Returns the surface properties of the triangle.
   * @param {vec3} P - The point on the surface.
   * @param {vec3} I - The incident vector.
   * @param {number} index - The index of the intersected object.
   * @param {vec2} uv - The UV coordinates.
   * @param {vec3} N - The normal vector at the point.
   * @param {vec2} st - The surface texture coordinates.
   * @returns {Object}
   */
  getSurfaceProperties(P, I, index, uv, N, st) {
    return {
      st: vec2.create(),
      normal: this.normal
    }
  }

  /**
   * Returns the diffuse color of the triangle.
   * @param {vec2} st - The surface texture coordinates.
   * @returns {vec3} The diffuse color.
   */
  evalDiffuseColor(st) {
    return vec3.fromValues(0.5, 0.5, 0.5)
  }

  /**
   * Returns the bounding box of the triangle.
   * @returns {Bounds3} The bounding box.
   */
  getBounds() {
    return Bounds3.union(new Bounds3(this.v0, this.v1), this.v2)
  }

  /**
   * Samples a point on the surface of the triangle.
   * @param {Intersection} pos - The intersection point.
   * @param {number} pdf - The probability density function value.
   * @returns {Object} pos & pdf
   */
  sample(pos, pdf) {
    const x = Math.sqrt(Math.random())
    const y = Math.random()
    const u = 1 - x
    const v = x * (1 - y)
    const w = x * y
    vec3.scaleAndAdd(pos.coords, pos.coords, this.v0, u)
    vec3.scaleAndAdd(pos.coords, pos.coords, this.v1, v)
    vec3.scaleAndAdd(pos.coords, pos.coords, this.v2, w)
    pos.normal = this.normal
    pdf = 1 / this.area
    return {
      pos,
      pdf
    }
  }

  /**
   * Returns the area of the triangle.
   * @returns {number} The area of the triangle.
   */
  getArea() {
    return this.area
  }

  /**
   * Checks if the triangle has emission.
   * @returns {boolean} True if the triangle has emission, false otherwise.
   */
  hasEmit() {
    return this.material.hasEmission()
  }
}

/**
 * @class MeshTriangle
 * @extends Object3D
 */
export default class Mesh extends Object3D {
  #triangles = []
  #bvh

  /**
   * Creates an instance of MeshTriangle.
   * @param {Object} data - The data of the geometry.
   * @param {Material} [material=new Material()] - The material of the mesh.
   */
  constructor({
    data,
    material = new Material(),
    scale = vec3.fromValues(1, 1, 1),
    translate = vec3.create()
  }) {
    super()
    this.area = 0
    this.material = material

    const minVert = vec3.fromValues(Infinity, Infinity, Infinity) // 在比较时，任何实际顶点的坐标都会小于 Infinity，从而更新 minVert。
    const maxVert = vec3.fromValues(-Infinity, -Infinity, -Infinity) // 反之亦然
    const { indices, vertices } = data

    for(let i = 0; i < indices.length; i+=3) {
      const faceVertices = []
      for (let j = 0; j < 3; j++) {
        const vert = vec3.fromValues(
          vertices[indices[i + j] * 3 + 0],
          vertices[indices[i + j] * 3 + 1],
          vertices[indices[i + j] * 3 + 2],
        )
        vec3.mul(vert, vert, scale)
        vec3.add(vert, vert, translate)
        faceVertices[j] = vert

        vec3.min(minVert, minVert, vert)
        vec3.max(maxVert, maxVert, vert)
      }

      const t = new Triangle(faceVertices[0], faceVertices[1], faceVertices[2], material)
      this.area += t.area
      this.#triangles.push(t)
    }

    this.boundingBox = new Bounds3(minVert, maxVert)
  }

  /**
   * Builds the BVH acceleration structure for the scene.
   * @param {SplitMethod} splitMethod - Method to split the nodes.
   */
  buildBVH({ splitMethod }) {
    this.#bvh = new BVHAccel({
      primitives: this.#triangles.map(triangle => triangle),
      splitMethod
    })
  }

  /**
   * Checks if a ray intersects the mesh and returns the intersection distance.
   * @param {Ray} ray - The ray to check for intersection.
   * @returns {Object|null}
   */
  intersect(ray) {
    let result = null
    for (const [index, triangle] of this.#triangles.entries()) {
      const hit = rayTriangleIntersect(triangle.v0, triangle.v1, triangle.v2, ray.origin, ray.direction)
      if (hit) {
        result = {
          ...hit,
          index
        }
        break
      }
    }
    return result
  }

  /**
   * Returns the bounding box of the mesh.
   * @returns {Bounds3} The bounding box.
   */
  getBounds() {
    return this.boundingBox
  }

  /**
   * Returns the surface properties of the mesh.
   * @param {number} index - The index of the intersected object.
   * @param {vec2} uv - The UV coordinates.
   */
  getSurfaceProperties({ index, uv }) {
    const triangle = this.#triangles[index]
    const st0 = triangle.st[0]
    const st1 = triangle.st[1]
    const st2 = triangle.st[2]
    st[0] = st0[0] * (1 - uv[0] - uv[1]) + st1[0] * uv[0] + st2[0] * uv[1]
    st[1] = st0[1] * (1 - uv[0] - uv[1]) + st1[1] * uv[0] + st2[1] * uv[1]

    return {
      normal: triangle.normal,
      st
    }
  }

  /**
   * Returns the diffuse color of the mesh.
   * @param {vec2} st - The surface texture coordinates.
   * @returns {vec3} The diffuse color.
   */
  evalDiffuseColor(st) {
    const scale = 5
    const pattern = (Math.floor(st[0] * scale) % 2) ^ (Math.floor(st[1] * scale) % 2)
    const color1 = vec3.fromValues(0.815, 0.235, 0.031)
    const color2 = vec3.fromValues(0.937, 0.937, 0.231)
    return vec3.lerp(vec3.create(), color1, color2, pattern)
  }

  /**
   * Returns the intersection details of a ray with the mesh.
   * @param {Ray} ray - The ray to check for intersection.
   * @returns {Intersection} The intersection details.
   */
  getIntersection(ray) {
    return this.#bvh ? this.#bvh.intersect(ray) : new Intersection()
  }

  /**
   * Samples a point on the surface of the mesh.
   * @param {Intersection} pos - The intersection point.
   * @param {number} pdf - The probability density function value.
   * @returns {Object} pos & pdf
   */
  sample(pos = new Intersection(), pdf) {
    pos.emit = this.material.emission
    pdf = this.#bvh.sample(pos, pdf)
    return {
      pos,
      pdf
    }
  }

  /**
   * Returns the area of the mesh.
   * @returns {number} The area of the mesh.
   */
  getArea() {
    return this.area
  }

  /**
   * Checks if the mesh has emission.
   * @returns {boolean} True if the mesh has emission, false otherwise.
   */
  hasEmit() {
    return this.material.hasEmission()
  }
}