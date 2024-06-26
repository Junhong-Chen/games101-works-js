import { vec2, vec3 } from 'gl-matrix'
import Object3D from './object'

function rayTriangleIntersect(v0, v1, v2, orig, dir) {
  // TODO: Implement this function that tests whether the triangle
  // that's specified bt v0, v1 and v2 intersects with the ray (whose
  // origin is *orig* and direction is *dir*)
  // Also don't forget to update tNear, u and v.
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
  if (tNear >= 0 && u >= 0 && v >= 0 && u + v <= 1) {
    return { tNear, u, v }
  }
}

export default class Triangle extends Object3D {
  constructor({
    vertices,
    vertexIndices,
    numTriangles,
    stCoordinates
  }) {
    super(arguments[0])
    this.vertices = vertices
    this.vertexIndices = vertexIndices
    this.numTriangles = numTriangles
    this.stCoordinates = stCoordinates
  }

  intersect(orig, dir, tNear) {
    let hit = false
    for (let i = 0; i < this.numTriangles; i++) {
      const i3 = i * 3
      const v0 = this.vertices[this.vertexIndices[i3]]
      const v1 = this.vertices[this.vertexIndices[i3 + 1]]
      const v2 = this.vertices[this.vertexIndices[i3 + 2]]

      const intersection = rayTriangleIntersect(v0, v1, v2, orig, dir)
      if (intersection && intersection.tNear < tNear) {
        hit = {
          tNear: intersection.tNear,
          uv: vec2.fromValues(intersection.u, intersection.v),
          index: i,
          hitObj: this
        }
      }
    }
    return hit
  }

  getSurfaceProperties({ index, uv }) {
    const i3 = index * 3
    const v0 = this.vertices[this.vertexIndices[i3]]
    const v1 = this.vertices[this.vertexIndices[i3 + 1]]
    const v2 = this.vertices[this.vertexIndices[i3 + 2]]

    const edge0 = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), v1, v0))
    const edge1 = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), v2, v1))
    const normal = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), edge0, edge1))

    const st0 = this.stCoordinates[this.vertexIndices[i3]]
    const st1 = this.stCoordinates[this.vertexIndices[i3 + 1]]
    const st2 = this.stCoordinates[this.vertexIndices[i3 + 2]]

    const st = vec2.fromValues(
      st0[0] * (1 - uv[0] - uv[1]) + st1[0] * uv[0] + st2[0] * uv[1],
      st0[1] * (1 - uv[0] - uv[1]) + st1[1] * uv[0] + st2[1] * uv[1]
    )

    // 法线、纹理坐标
    return { normal, st }
  }

  // 棋盘格图案
  evalDiffuseColor(st) {
    const scale = 5
    const pattern = Math.round((st[0] * scale) % 1) ^ Math.round((st[1] * scale) % 1)
    return vec3.lerp(vec3.create(), vec3.fromValues(.815, .235, .031), vec3.fromValues(.937, .937, .231), pattern)
  }
}