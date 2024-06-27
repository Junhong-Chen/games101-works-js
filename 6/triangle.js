import { vec2, vec3 } from "gl-matrix"
import BVH from "./BVH"
import Object3D from "./object"
import Material from './material'
import Bounds3 from "./bounds3"
import { Intersection } from "./intersection"

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

export class Triangle extends Object3D {
  constructor(v0, v1, v2, m) {
    super()
    this.v0 = v0
    this.v1 = v1
    this.v2 = v2
    this.material = m

    const e1 = vec3.sub(vec3.create(), v1, v0)
    const e2 = vec3.sub(vec3.create(), v2, v0)
    this.normal = vec3.normalize(
      vec3.create(),
      vec3.cross(vec3.create(), e1, e2)
    )
  }

  getSurfaceProperties() {
    return {
      normal: this.normal
    }
  }

  getBounds() {
    return Bounds3.union(new Bounds3(this.v0, this.v1), this.v2)
  }

  getIntersection(ray) {
    const inter = new Intersection()

    if (vec3.dot(ray.direction, this.normal) > 0) return inter

    const hit = rayTriangleIntersect(this.v0, this.v1, this.v2, ray.origin, ray.direction)
    if (!hit) return inter

    // TODO find ray triangle intersection
    const { tNear, u, v } = hit
    inter.happened = true
    inter.coords = vec3.fromValues(tNear, u, v)
    inter.normal = this.normal
    inter.distance = tNear
    inter.obj = this
    inter.material = this.material
    inter.uv = vec2.fromValues(u, v)

    return inter
  }

  evalDiffuseColor() {
    return vec3.fromValues(0.5, 0.5, 0.5)
  }
}

export class Mesh extends Object3D {
  #triangles = []
  #bvh

  constructor(data) {
    super()
    const minVert = vec3.fromValues(Infinity, Infinity, Infinity) // 在比较时，任何实际顶点的坐标都会小于 Infinity，从而更新 minVert。
    const maxVert = vec3.fromValues(-Infinity, -Infinity, -Infinity) // 反之亦然
    const { indices, vertices } = data

    for(let i = 0; i < indices.length; i+=3) {
      const faceVertices = []
      for (let j = 0; j < 3; j++) {
        const vert = vec3.fromValues(
          vertices[indices[i + j] * 3 + 0] * 60,
          vertices[indices[i + j] * 3 + 1] * 60,
          vertices[indices[i + j] * 3 + 2] * 60,
        )
        faceVertices[j] = vert

        vec3.min(minVert, minVert, vert)
        vec3.max(maxVert, maxVert, vert)
      }
      const material = new Material('DIFFUSE_AND_GLOSSY', vec3.fromValues(0.5, 0.5, 0.5), vec3.fromValues(0, 0, 0))
      material.kd = 0.6
      material.ks = 0
      material.specularExponent = 0

      this.#triangles.push(new Triangle(faceVertices[0], faceVertices[1], faceVertices[2], material))
    }

    this.boundingBox = new Bounds3(minVert, maxVert)
  }
  
  buildBVH({ SAH = false }) {
    console.log(" - Generating BVH...")
    this.#bvh = new BVH({
      primitives: this.#triangles.map(triangle => triangle),
      SAH
    })
  }

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

  getBounds() {
    return this.boundingBox
  }

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

  evalDiffuseColor(st) {
    const scale = 5
    const pattern = (Math.floor(st[0] * scale) % 2) ^ (Math.floor(st[1] * scale) % 2)
    const color1 = vec3.fromValues(0.815, 0.235, 0.031)
    const color2 = vec3.fromValues(0.937, 0.937, 0.231)
    return vec3.lerp(vec3.create(), color1, color2, pattern)
  }

  getIntersection(ray) {
    return this.#bvh.intersect(ray)
  }
}
