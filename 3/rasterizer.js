import { vec2, vec3, vec4, mat4 } from "gl-matrix"
import { FragmentShaderPayload, VertexShaderPayload } from './shader'

export default class Rasterizer {
  #model
  #view
  #projection
  #positionBuffers = new Map()
  #indicesBuffers = new Map()
  #colorBuffers = new Map()
  #normalBuffers = new Map()
  #frameBuffers = []
  #depthBuffers = []
  #width
  #height
  #nextId = 0
  #texture
  #fragmentShader
  #vertexShader
  #cameraPosition

  get frameBuffers() {
    return this.#frameBuffers
  }

  constructor({ width, height, cameraPosition }) {
    const count = width * height
    this.#width = width
    this.#height = height
    this.#frameBuffers.length = count
    this.#depthBuffers.length = count
    this.#cameraPosition = cameraPosition
  }

  loadPositions(positions) {
    const id = this.#getNextId()
    this.#positionBuffers.set(id, positions)
    return id
  }

  loadIndices(indices) {
    const id = this.#getNextId()
    this.#indicesBuffers.set(id, indices)
    return id
  }

  loadColors(colors) {
    const id = this.#getNextId()
    this.#colorBuffers.set(id, colors)
    return id
  }

  loadNormals(normals) {
    const id = this.#getNextId()
    this.#normalBuffers.set(id, normals)
    return id
  }

  setModel(m) {
    this.#model = m
  }

  setView(v) {
    this.#view = v
  }

  setProjection(p) {
    this.#projection = p
  }

  setPixel(point, color) {
    const [x, y] = point
    if (x >= 0 && x <= this.#width && y >= 0 && y <= this.#height) {
      const i = this.#getIndex(x, y)
      this.#frameBuffers[i] = color
    }
  }

  setTexture(texture) {
    this.#texture = texture
  }

  setVertexShader(shader) {
    this.#vertexShader = shader
  }

  setFragmentShader(shader) {
    this.#fragmentShader = shader
  }

  setDepthBuffer(point, z) {
    const [x, y] = point
    const i = this.#getIndex(x, y)
    if (this.#depthBuffers[i] > z) {
      this.#depthBuffers[i] = z
      return true
    }
  }

  clear({ colorBuffer = false, depthBuffer = false }) {
    if (colorBuffer) {
      this.#frameBuffers.fill(vec3.fromValues(0, 0, 0))
    }
    if (depthBuffer) {
      this.#depthBuffers.fill(Infinity)
    }
  }

  draw(triangleList) {
    // const position = this.#positionBuffers.get(positionBufferId)
    // const indices = this.#indicesBuffers.get(indicesBufferId)
    // const color = this.#colorBuffers.get(colorBufferId)

    const f1 = (50 - 0.1) / 2
    const f2 = (50 + 0.1) / 2

    const mv = mat4.multiply(mat4.create(), this.#view, this.#model)
    const mvp = mat4.multiply(mat4.create(), this.#projection, mv)
  
    for (const t of triangleList) {
      const mm = [
        vec4.transformMat4(vec4.create(), vec4.fromValues(...t.v[0], 1), mv),
        vec4.transformMat4(vec4.create(), vec4.fromValues(...t.v[1], 1), mv),
        vec4.transformMat4(vec4.create(), vec4.fromValues(...t.v[2], 1), mv)
      ]

      const viewSpacePosition = mm.map(m => {
        return vec3.fromValues(...m)
      })

      const v = [
        vec4.transformMat4(vec4.create(), vec4.fromValues(...t.v[0], 1), mvp),
        vec4.transformMat4(vec4.create(), vec4.fromValues(...t.v[1], 1), mvp),
        vec4.transformMat4(vec4.create(), vec4.fromValues(...t.v[2], 1), mvp)
      ]

      // Homogeneous division
      for (const vec of v) {
        if (vec[3] !== 1 && vec[3] !== 0) {
          vec4.scale(vec, vec, 1 / vec[3])
        }
      }

      const invTrans = mat4.adjoint(
        mat4.create(),
        mat4.invert(
          mat4.create(), mat4.multiply(
            mat4.create(),
            this.#view,
            this.#model
          )
        )
      )

      const n = [
        vec4.transformMat4(vec4.create(), vec4.fromValues(...t.normal[0], 0), invTrans),
        vec4.transformMat4(vec4.create(), vec4.fromValues(...t.normal[1], 0), invTrans),
        vec4.transformMat4(vec4.create(), vec4.fromValues(...t.normal[2], 0), invTrans)
      ]

      // Viewport transformation
      for (const vec of v) {
        vec[0] = (1 - vec[0]) * this.#width / 2
        vec[1] = (1 - vec[1]) * this.#height / 2
        vec[2] = vec[2] * f1 + f2
      }

      for (let i = 0; i < 3; i++) {
        //screen space coordinates
        t.setVertex(i, v[i])
      }

      for (let i = 0; i < 3; i++) {
        //screen space normal
        t.setNormal(i, vec3.fromValues(...n[i]))
      }

      t.setColors([
        vec3.fromValues(148, 121, 92),
        vec3.fromValues(148, 121, 92),
        vec3.fromValues(148, 121, 92)
      ])

      this.#rasterizeTriangle(t, viewSpacePosition)
    }
  }

  #rasterizeTriangle(triangle, viewSpacePosition) {
    const { v, color, textureCoords, normal } = triangle
    // TODO: From your HW3, get the triangle rasterization code.
    const x1 = v[0][0], x2 = v[1][0], x3 = v[2][0], y1 = v[0][1], y2 = v[1][1], y3 = v[2][1]
    const xMin = Math.floor(Math.max(Math.min(x1, x2, x3), 0))
    const xMax = Math.ceil(Math.min(Math.max(x1, x2, x3), this.#width))
    const yMin = Math.floor(Math.max(Math.min(y1, y2, y3), 0))
    const yMax = Math.ceil(Math.min(Math.max(y1, y2, y3), this.#height))

    // iterate through the pixel and find if the current pixel is inside the triangle
    for (let x = xMin; x < xMax; x++) {
      for (let y = yMin; y < yMax; y++) {
        if (this.#insideTriangle(x + .5, y + .5, v)) {
          // TODO: Inside your rasterization loop:
          // * v[i].w() is the vertex view space depth value z.
          // * Z is interpolated view space depth for the current pixel
          // * zp is depth between zNear and zFar, used for z-buffer
          const [alpha, beta, gamma] = this.#computeBarycentric2D(x + .5, y + .5, v)
          const Z = 1 / (alpha / v[0][3] + beta / v[1][3] + gamma / v[2][3])
          let zp = alpha * v[0][2] / v[0][3] + beta * v[1][2] / v[1][3] + gamma * v[2][2] / v[2][3]
          zp *= Z
          
          // TODO: Interpolate the attributes:
          // auto interpolated_color
          // auto interpolated_normal
          // auto interpolated_texcoords
          // auto interpolated_shadingcoords
          const interpolatedColor = this.#interpolateVec3(alpha, beta, gamma, color[0], color[1], color[2])
          const interpolatedNormal = this.#interpolateVec3(alpha, beta, gamma, normal[0], normal[1], normal[2])
          const interpolatedTextureCoords = this.#interpolateVec2(alpha, beta, gamma, textureCoords[0], textureCoords[1], textureCoords[2])
          const interpolatedShadingCoords = this.#interpolateVec3(alpha, beta, gamma, viewSpacePosition[0], viewSpacePosition[1], viewSpacePosition[2])
          const p = [x, y]
          if (this.setDepthBuffer(p, zp)) {
            // Use: fragment_shader_payload payload( interpolated_color, interpolated_normal.normalized(), interpolated_texcoords, texture ? &*texture : nullptr);
            // Use: payload.view_pos = interpolated_shadingcoords;
            // Use: Instead of passing the triangle's color directly to the frame buffer, pass the color to the shaders first to get the final color;
            // Use: auto pixel_color = fragment_shader(payload);
            const payload = new FragmentShaderPayload({
              color: interpolatedColor,
              normal: vec3.normalize(interpolatedNormal, interpolatedNormal),
              textureCoords: interpolatedTextureCoords,
              texture: this.#texture
            })
            payload.position = interpolatedShadingCoords
            payload.cameraPosition = this.#cameraPosition
            const pixelColor = this.#fragmentShader(payload)
            this.setPixel(p, pixelColor)
          }
        }
      }
    }
  }

  #drawLine() {}

  #computeBarycentric2D(x, y, v) {
    const c1 = (x * (v[1][1] - v[2][1]) + (v[2][0] - v[1][0]) * y + v[1][0] * v[2][1] - v[2][0] * v[1][1]) / (v[0][0] * (v[1][1] - v[2][1]) + (v[2][0] - v[1][0]) * v[0][1] + v[1][0] * v[2][1] - v[2][0] * v[1][1])
    const c2 = (x * (v[2][1] - v[0][1]) + (v[0][0] - v[2][0]) * y + v[2][0] * v[0][1] - v[0][0] * v[2][1]) / (v[1][0] * (v[2][1] - v[0][1]) + (v[0][0] - v[2][0]) * v[1][1] + v[2][0] * v[0][1] - v[0][0] * v[2][1])
    const c3 = (x * (v[0][1] - v[1][1]) + (v[1][0] - v[0][0]) * y + v[0][0] * v[1][1] - v[1][0] * v[0][1]) / (v[2][0] * (v[0][1] - v[1][1]) + (v[1][0] - v[0][0]) * v[2][1] + v[0][0] * v[1][1] - v[1][0] * v[0][1])
    return [c1, c2, c3]
  }

  #interpolateVec3(alpha, beta, gamma, vert1, vert2, vert3, weight = 1) {
    const s1 = vec3.scale(vec3.create(), vert1, alpha)
    const s2 = vec3.scale(vec3.create(), vert2, beta)
    const s3 = vec3.scale(vec3.create(), vert3, gamma)
    const sum = vec3.add(vec3.create(), vec3.add(vec3.create(), s1, s2), s3)
    const result = vec3.scale(vec3.create(), sum, weight)

    return result
  }

  #interpolateVec2(alpha, beta, gamma, vert1, vert2, vert3, weight = 1) {
    let u = (alpha * vert1[0] + beta * vert2[0] + gamma * vert3[0])
    let v = (alpha * vert1[1] + beta * vert2[1] + gamma * vert3[1])

    u /= weight
    v /= weight
    return vec2.fromValues(u, v)
  }

  #insideTriangle(x, y, _v) {
    // TODO : Implement this function to check if the point (x, y) is inside the triangle represented by _v[0], _v[1], _v[2]
    function sign(px, py, x1, y1, x2, y2) {
      return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2)
    }
    const [a, b, c] = _v

    const s0 = sign(x, y, a[0], a[1], b[0], b[1])
    const s1 = sign(x, y, b[0], b[1], c[0], c[1])
    const s2 = sign(x, y, c[0], c[1], a[0], a[1])

    return (s0 > 0 && s1 > 0 && s2 > 0) || (s0 < 0 && s1 < 0 && s2 < 0)
  }

  #getIndex(x, y) {
    return this.#width * Math.floor(this.#height - 1 - y) + Math.floor(x) // y 的取值范围是 0 ~ this.#height - 1
  }

  #getNextId() {
    return this.#nextId++
  }
}