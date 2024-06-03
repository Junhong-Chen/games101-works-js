import { vec2, vec3, vec4 } from "gl-matrix"

export default class Triangle {
  get vector() {
    return this.v.map(v => vec4.fromValues(...v, 1))
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
  getColor() {
    return this.color[0]
  }
  setColor(i, r, g, b) {
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
      throw new Error('Invalid color values')
    }
    this.color[i] = vec3.fromValues(r, g, b)
  }
  setTextureCoord(i, s, t) {
    this.textureCoords[i] = vec2.fromValues(s, t)
  }
}