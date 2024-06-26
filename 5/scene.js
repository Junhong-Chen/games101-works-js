import { vec3 } from "gl-matrix"

export default class Scene {
  #objects = []
  #lights = []
  #maxDepth = 5 // 最大递归深度，用于光线追踪中的最大反射/折射次数

  get objects() {
    return this.#objects
  }
  get lights() {
    return this.#lights
  }
  get maxDepth() {
    return this.#maxDepth
  }

  constructor({
    width = 1280,
    height = 720,
    fov = 90, 
    backgroundColor = vec3.fromValues(.235294, .67451, .843137),
  }) {
    this.width = width
    this.height = height
    this.fov = fov
    this.backgroundColor = backgroundColor
  }

  add(target) {
    switch(target.constructor.name) {
      case 'Object3D':
      case 'Sphere':
      case 'Triangle':
        this.#objects.push(target)
        break
      case 'Light':
        this.#lights.push(target)
        break
    }
  }
}