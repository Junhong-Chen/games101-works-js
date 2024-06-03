import { vec2, vec3 } from "gl-matrix"

export default class Triangle {
  get a() {
    return this.v[0]
  }
  get b() {
    return this.v[1]
  }
  get c() {
    return this.v[2]
  }
  constructor() {
    this.v = []
    this.color = []
    this.textureCoords = []
    this.normal = []
  }

  setVertex(i, v) {
    this.v[i] = v
  }
  setNormal(i, n) {
    this.normal[i] = n
  }
  setColor(i, r, g, b) {
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
      throw new Error('Invalid color values')
    }
    this.color[i] = vec3.fromValues(r / 255, g / 255, b / 255)
  }
  setTextureCoord(i, s, t) {
    this.textureCoords[i] = vec2.fromValues(s, t)
  }
}