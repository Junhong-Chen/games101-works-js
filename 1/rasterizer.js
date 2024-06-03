import { vec3, vec4, mat4 } from "gl-matrix"
import Triangle from "./triangle"

export default class Rasterizer {
  #model
  #view
  #projection
  #positionBuffers = new Map()
  #indicesBuffers = new Map()
  #frameBuffers = []
  #depthBuffers = []
  #width
  #height
  #nextId = 0

  get frameBuffers() {
    return this.#frameBuffers
  }

  constructor() {
  }

  rasterizer(w, h) {
    this.#width = w
    this.#height = h
    this.#frameBuffers.length = (w * h)
    this.#depthBuffers.length = (w * h)
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

  clear(colorBuffer = false, depthBuffer = false) {
    if (colorBuffer) {
      this.#frameBuffers.fill(vec3.create())
    }
    if (depthBuffer) {
      this.#depthBuffers.fill(Infinity)
    }
  }

  draw(positionBufferId, indicesBufferId, type) {
    if (type !== 'triangle') {
      throw new Error('Drawing primitives other than triangle is not implemented yet!')
    }
    const position = this.#positionBuffers.get(positionBufferId)
    const indices = this.#indicesBuffers.get(indicesBufferId)

    const f1 = (100 - 0.1) / 2
    const f2 = (100 + 0.1) / 2

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
        vec4.scale(vec, vec, 1 / vec[3])
      }

      // Viewport transformation
      for (const vec of v) {
        vec[0] = (1 - vec[0]) * this.#width / 2
        vec[1] =  (1 - vec[1]) * this.#height / 2
        vec[2] = vec[2] * f1 + f2
      }

      for (let i = 0; i < 3; i++) {
        triangle.setVertex(i, vec3.fromValues(...v[i].slice(0, 3)))
      }

      triangle.setColor(0, 255, 0, 0)
      triangle.setColor(1, 0, 255, 0)
      triangle.setColor(2, 0, 0, 255)

      this.#rasterizeWireframe(triangle)
    }
  }

  // Bresenham's line drawing algorithm
  // Code taken from a stack overflow answer: https://stackoverflow.com/a/16405254
  #drawLine(begin, end) {
    const x1 = begin[0]
    const y1 = begin[1]
    const x2 = end[0]
    const y2 = end[1]
    const lineColor = vec3.fromValues(255, 255, 255)
    let x, y, dx, dy, dx1, dy1, px, py, xe, ye, i
    dx = x2 - x1
    dy = y2 - y1
    dx1 = Math.abs(dx)
    dy1 = Math.abs(dy)
    px = 2 * dy1 - dx1
    py = 2 * dx1 - dy1

    if (dy1 <= dx1) {
      if (dx >= 0) {
        x = x1
        y = y1
        xe = x2
      } else {
        x = x2
        y = y2
        xe = x1
      }
      const point = vec3.fromValues(x, y, 1)
      this.setPixel(point, lineColor)
      for (i = 0; x < xe; i++) {
        x++
        if (px < 0) {
          px = px + 2 * dy1
        } else {
          if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
            y++
          } else {
            y--
          }
          px = px + 2 * (dy1 - dx1)
        }
        const point = vec3.fromValues(x, y, 1)
        this.setPixel(point, lineColor)
      }
    } else {
      if (dy >= 0) {
        x = x1
        y = y1
        ye = y2
      } else {
        x = x2
        y = y2
        ye = y1
      }
      const point = vec3.fromValues(x, y, 1)
      this.setPixel(point, lineColor)
      for (i = 0; y < ye; i++) {
        y++
        if (py <= 0) {
          py = py + 2 * dx1
        } else {
          if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
            x++
          } else {
            x--
          }
          py = py + 2 * (dx1 - dy1)
        }
        const point = vec3.fromValues(x, y, 1)
        this.setPixel(point, lineColor)
      }
    }
  }

  #rasterizeWireframe(t) {
    this.#drawLine(t.a, t.b)
    this.#drawLine(t.b, t.c)
    this.#drawLine(t.c, t.a)
  }

  #getIndex(x, y) {
    return this.#width * Math.floor(this.#height - 1 - y) + Math.floor(x)
  }

  #getNextId() {
    return this.#nextId++
  }
}