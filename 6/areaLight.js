import { vec3 } from "gl-matrix"
import Light from "./light"

export default class AreaLight extends Light {
  constructor({ position, intensity }) {
    super({ position, intensity })

    this.normal = vec3.fromValues(0, -1, 0)
    this.u = vec3.fromValues(1, 0, 0)
    this.v = vec3.fromValues(0, 0, 1)
    this.length = 100
  }

  samplePoint() {
    const u = vec3.scale(vec3.create(), this.u, Math.random())
    const v = vec3.scale(vec3.create(), this.v, Math.random())
    return vec3.add(
      vec3.create(),
      this.position,
      vec3.add(
        vec3.create(),
        u,
        v
      )
    )
  }
}