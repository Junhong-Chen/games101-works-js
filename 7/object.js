import { vec3 } from "gl-matrix"
import Ray from "./ray"
import Intersection from "./intersection"

/**
 * Abstract class representing an object3D.
 */

export default class Object3D {
  constructor() {
    if (this.constructor === Object3D) {
      throw new Error("Cannot instantiate abstract class")
    }
  }

  /**
   * Abstract method to check intersection with a ray.
   * @param {Ray} ray - The ray to check intersection with.
   * @throws Will throw an error if the method is not implemented.
   */
  intersect(ray) {
    throw new Error("Abstract method 'intersect' must be implemented")
  }

  /**
   * Abstract method to check intersection with a ray.
   * @param {Ray} ray - The ray to check intersection with.
   * @param {number} t - Intersection distance.
   * @param {number} index - Index of intersection.
   * @throws Will throw an error if the method is not implemented.
   */
  intersectWithDetails(ray, t, index) {
    throw new Error("Abstract method 'intersectWithDetails' must be implemented")
  }

  /**
   * Abstract method to get intersection with a ray.
   * @param {Ray} ray - The ray to get intersection with.
   * @throws Will throw an error if the method is not implemented.
   */
  getIntersection(ray) {
    throw new Error("Abstract method 'getIntersection' must be implemented")
  }

  /**
   * Abstract method to get surface properties.
   * @param {vec3} hitPoint - Hit point.
   * @param {vec3} normal - Normal at hit point.
   * @param {number} index - Index of intersection.
   * @param {vec2} uv - UV coordinates.
   * @param {vec3} tangent - Tangent vector.
   * @param {vec2} texCoords - Texture coordinates.
   * @throws Will throw an error if the method is not implemented.
   */
  getSurfaceProperties(hitPoint, normal, index, uv, tangent, texCoords) {
    throw new Error("Abstract method 'getSurfaceProperties' must be implemented")
  }

  /**
   * Abstract method to evaluate diffuse color.
   * @param {vec2} uv - UV coordinates.
   * @throws Will throw an error if the method is not implemented.
   */
  evalDiffuseColor(uv) {
    throw new Error("Abstract method 'evalDiffuseColor' must be implemented")
  }

  /**
   * Abstract method to get the bounds of the object.
   * @throws Will throw an error if the method is not implemented.
   */
  getBounds() {
    throw new Error("Abstract method 'getBounds' must be implemented")
  }

  /**
   * Abstract method to get the area of the object.
   * @throws Will throw an error if the method is not implemented.
   */
  getArea() {
    throw new Error("Abstract method 'getArea' must be implemented")
  }

  /**
   * Abstract method to sample the object.
   * @param {Intersection} pos - Position of the intersection.
   * @param {number} pdf - Probability density function.
   * @throws Will throw an error if the method is not implemented.
   */
  Sample(pos, pdf) {
    throw new Error("Abstract method 'Sample' must be implemented")
  }

  /**
   * Abstract method to check if the object emits light.
   * @throws Will throw an error if the method is not implemented.
   */
  hasEmit() {
    throw new Error("Abstract method 'hasEmit' must be implemented")
  }
}