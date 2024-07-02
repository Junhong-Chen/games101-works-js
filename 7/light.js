/**
 * Class representing a light.
 */
export default class Light {
  /**
   * Create a light.
   * @param {vec3} position - The position of the light.
   * @param {vec3} intensity - The intensity of the light.
   */
  constructor({ position, intensity }) {
    this.position = position
    this.intensity = intensity
  }
}