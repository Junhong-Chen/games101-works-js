import { vec3 } from "gl-matrix"
import Light from "./light"

/**
 * Class representing an area light.
 * @extends Light
 */
export default class AreaLight extends Light {
  /**
   * Create an area light.
   * @param {vec3} position - The position of the light.
   * @param {vec3} intensity - The intensity of the light.
   */
  constructor({ position, intensity }) {
    super({ position, intensity })

    this.normal = vec3.fromValues(0, -1, 0)
    this.u = vec3.fromValues(1, 0, 0)
    this.v = vec3.fromValues(0, 0, 1)
    this.length = 100
  }

  /**
   * Sample a point on the area light.
   * @returns {vec3} The sampled point.
   */
  samplePoint() {
    const random_u = Math.random()
    const random_v = Math.random()
    const sampledPoint = vec3.create()
    vec3.scaleAndAdd(sampledPoint, this.position, this.u, random_u)
    vec3.scaleAndAdd(sampledPoint, sampledPoint, this.v, random_v)
    return sampledPoint
  }
}