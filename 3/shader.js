export class FragmentShaderPayload {
  constructor({ texture, color, normal, textureCoords }) {
    this.viewPosition = null
    this.texture = texture
    this.color = color
    this.normal = normal
    this.textureCoords = textureCoords
  }

  getColorBilinear() {}
}

export class VertexShaderPayload {
  constructor({ position }) {
    this.position = position
  }
}