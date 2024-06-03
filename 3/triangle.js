import { vec3 } from "gl-matrix"

export default class Triangle {
  constructor() {
    this.v = []
    this.color = []
    this.textureCoords = []
    this.normal = []
  }

  setVertex(i, v) {
    this.v[i] = v
  }
  setVertexs(vertexs) {
    this.v = [...vertexs]
  }
  setNormal(i, n) {
    this.normal[i] = n
  }
  setNormals(normals) {
    this.normal = [...normals]
  }
  setColor(i, r, g, b) {
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
      throw new Error('Invalid color values')
    }
    this.color[i] = vec3.fromValues(r / 255, g / 255, b / 255)
  }
  setColors(colors) {
    const length = Math.min(3, colors.length)
    for (let i = 0; i < length; i++) {
      this.setColor(i, ...colors[i])
    }
  }
  setTextureCoord(i, uv) {
    this.textureCoords[i] = uv
  }
  setTextureCoords(uvs) {
    this.textureCoords = [...uvs]
  }
}