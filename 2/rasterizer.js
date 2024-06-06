import { vec3, vec4, mat4 } from "gl-matrix"
import Triangle from "./triangle"

export default class Rasterizer {
  #model
  #view
  #projection
  #positionBuffers = new Map()
  #indicesBuffers = new Map()
  #colorBuffers = new Map()
  #frameBuffers = []
  #depthBuffers = []
  #sampleFrameBuffers = []
  #sampleDepthBuffers = []
  #width
  #height
  #nextId = 0
  #MSAA = false
  #superSamplePoints = [
    new Float32Array([.25, .25]),
    new Float32Array([.75, .25]),
    new Float32Array([.25, .75]),
    new Float32Array([.75, .75])
  ]

  get frameBuffers() {
    return this.#frameBuffers
  }

  constructor({ width, height }) {
    const count = width * height
    this.#width = width
    this.#height = height
    this.#frameBuffers.length = count
    this.#depthBuffers.length = count
    // MSAA 2x
    this.#sampleFrameBuffers.length = count * 4
    this.#sampleDepthBuffers.length = count * 4
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

  setDepthBuffer(point, z) {
    const [x, y] = point
    const i = this.#getIndex(x, y)
    if (this.#depthBuffers[i] > z) {
      this.#depthBuffers[i] = z
      return true
    }
  }

  setSamplePixel(point, color) {
    const [x, y] = point
    if (x >= 0 && x <= this.#width * 2 && y >= 0 && y <= this.#height * 2) {
      const i = this.#getSampleIndex(x, y)
      this.#sampleFrameBuffers[i] = color
    }
  }

  setSampleDepthBuffer(point, z) {
    const [x, y] = point
    const i = this.#getSampleIndex(x, y)
    if (this.#sampleDepthBuffers[i] > z) {
      this.#sampleDepthBuffers[i] = z
      return true
    }
  }

  clear({ colorBuffer = false, depthBuffer = false }) {
    if (colorBuffer) {
      this.#frameBuffers.fill(vec3.create())
      this.#sampleFrameBuffers.fill(vec3.create())
    }
    if (depthBuffer) {
      this.#depthBuffers.fill(Infinity)
      this.#sampleDepthBuffers.fill(Infinity)
    }
  }

  draw(positionBufferId, indicesBufferId, colorBufferId, MSAA) {
    const position = this.#positionBuffers.get(positionBufferId)
    const indices = this.#indicesBuffers.get(indicesBufferId)
    const color = this.#colorBuffers.get(colorBufferId)

    const f1 = (50 - 0.1) / 2
    const f2 = (50 + 0.1) / 2

    const mvp = mat4.multiply(mat4.create(), this.#projection, mat4.multiply(mat4.create(), this.#view, this.#model))

    for (const i of indices) {
      const triangle = new Triangle()
      const v = [
        vec4.transformMat4(vec4.create(), vec4.fromValues(...position[i[0]], 1), mvp),
        vec4.transformMat4(vec4.create(), vec4.fromValues(...position[i[1]], 1), mvp),
        vec4.transformMat4(vec4.create(), vec4.fromValues(...position[i[2]], 1), mvp)
      ]

      // Homogeneous division
      for (const vec of v) {
        if (vec[3] !== 1 && vec[3] !== 0) {
          vec4.scale(vec, vec, 1 / vec[3])
        }
      }

      // Viewport transformation
      for (const vec of v) {
        vec[0] = (1 - vec[0]) * this.#width / 2
        vec[1] = (1 - vec[1]) * this.#height / 2
        vec[2] = vec[2] * f1 + f2
      }

      for (let i = 0; i < 3; i++) {
        triangle.setVertex(i, vec3.fromValues(...v[i].slice(0, 3)))
      }

      triangle.setColor(0, ...color[i[0]])
      triangle.setColor(1, ...color[i[1]])
      triangle.setColor(2, ...color[i[2]])

      this.#rasterizeTriangle(triangle, MSAA)
    }
  }

  #rasterizeTriangle(triangle, MSAA) {
    const v = triangle.vector
    // TODO : Find out the bounding box of current triangle.
    const x1 = v[0][0], x2 = v[1][0], x3 = v[2][0], y1 = v[0][1], y2 = v[1][1], y3 = v[2][1]
    const xMin = Math.floor(Math.max(Math.min(x1, x2, x3), 0))
    const xMax = Math.ceil(Math.min(Math.max(x1, x2, x3), this.#width))
    const yMin = Math.floor(Math.max(Math.min(y1, y2, y3), 0))
    const yMax = Math.ceil(Math.min(Math.max(y1, y2, y3), this.#height))

    // iterate through the pixel and find if the current pixel is inside the triangle
    for (let x = xMin; x < xMax; x++) {
      for (let y = yMin; y < yMax; y++) {
        let inside = false
        if (MSAA) {
          for (const [i, p] of this.#superSamplePoints.entries())  {
            if (this.#insideTriangle(x + p[0], y + p[1], v)) {
              const [alpha, beta, gamma] = this.#computeBarycentric2D(x + p[0], y + p[1], triangle.v)
              const wReciprocal = 1 / (alpha / v[0][3] + beta / v[1][3] + gamma / v[2][3])
              let zInterpolated = alpha * v[0][2] / v[0][3] + beta * v[1][2] / v[1][3] + gamma * v[2][2] / v[2][3]
              zInterpolated *= wReciprocal
              const sp = [x * 2 + i % 2, y * 2 + ~~(i / 2)] // 采样点坐标（左上、右上、左下、右下）
              if (this.setSampleDepthBuffer(sp, zInterpolated)) {
                this.setSamplePixel(sp, triangle.getColor())
                inside = true
              }
            }
          }
          if (inside) {
            const p = [x, y]
            const superSampleIndexs = [
              new Float32Array([x * 2, y * 2]),
              new Float32Array([x * 2 + 1, y * 2]),
              new Float32Array([x * 2, y * 2 + 1]),
              new Float32Array([x * 2 + 1, y * 2 + 1]),
            ]
            let color = vec3.create()
            for (const p of superSampleIndexs) {
              vec3.add(color, color, this.#sampleFrameBuffers[this.#getSampleIndex(...p)])
            }
            vec3.scale(color, color, 1 / 4)
            this.setPixel(p, color)
          }
        } else {
          if (this.#insideTriangle(x + .5, y + .5, v)) {
            // If so, use the following code to get the interpolated z value.
            const [alpha, beta, gamma] = this.#computeBarycentric2D(x + .5, y + .5, triangle.v)
            const wReciprocal = 1 / (alpha / v[0][3] + beta / v[1][3] + gamma / v[2][3])
            let zInterpolated = alpha * v[0][2] / v[0][3] + beta * v[1][2] / v[1][3] + gamma * v[2][2] / v[2][3]
            zInterpolated *= wReciprocal
            const p = [x, y]
            // TODO : set the current pixel (use the set_pixel function) to the color of the triangle (use getColor function) if it should be painted.
            if (this.setDepthBuffer(p, zInterpolated)) {
              this.setPixel(p, triangle.getColor())
            }
          }
        }
      }
    }
  }

  #computeBarycentric2D(x, y, v) {
    const c1 = (x * (v[1][1] - v[2][1]) + (v[2][0] - v[1][0]) * y + v[1][0] * v[2][1] - v[2][0] * v[1][1]) / (v[0][0] * (v[1][1] - v[2][1]) + (v[2][0] - v[1][0]) * v[0][1] + v[1][0] * v[2][1] - v[2][0] * v[1][1])
    const c2 = (x * (v[2][1] - v[0][1]) + (v[0][0] - v[2][0]) * y + v[2][0] * v[0][1] - v[0][0] * v[2][1]) / (v[1][0] * (v[2][1] - v[0][1]) + (v[0][0] - v[2][0]) * v[1][1] + v[2][0] * v[0][1] - v[0][0] * v[2][1])
    const c3 = (x * (v[0][1] - v[1][1]) + (v[1][0] - v[0][0]) * y + v[0][0] * v[1][1] - v[1][0] * v[0][1]) / (v[2][0] * (v[0][1] - v[1][1]) + (v[1][0] - v[0][0]) * v[2][1] + v[0][0] * v[1][1] - v[1][0] * v[0][1])
    return [c1, c2, c3]
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

  #getSampleIndex(x, y) {
    return this.#width * 2 * Math.floor(this.#height * 2 - 1 - y) + Math.floor(x)
  }

  #getNextId() {
    return this.#nextId++
  }
}