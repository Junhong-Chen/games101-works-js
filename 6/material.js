import { vec3 } from "gl-matrix"

export const MaterialType = {
  DIFFUSE_AND_GLOSSY: 0,
  REFLECTION_AND_REFRACTION: 1,
  REFLECTION: 2
}

export default class Material {
  #type
  #color
  #emission

  get type() {
    return this.#type
  }
  get color() {
    return this.#color
  }
  get emission() {
    return this.#emission
  }
  constructor({
    type = MaterialType.DIFFUSE_AND_GLOSSY,
    color = vec3.fromValues(1, 1, 1),
    emission = vec3.fromValues(0, 0, 0)
  }) {
    this.#type = type
    this.#color = color
    this.#emission = emission
    this.ior = 1 // 默认折射率
    this.kd = 0.8 // 默认漫反射系数
    this.ks = 0.2 // 默认镜面反射系数
    this.specularExponent = 25 // 默认高光指数
  }

  getColorAt(u, v) {
    // 可以根据纹理坐标(u, v)返回特定颜色
    // 这里暂时返回一个默认值
    return vec3.create()
  }
}