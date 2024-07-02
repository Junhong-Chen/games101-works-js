import { vec3 } from "gl-matrix"
import { clamp, reflect } from "./utils"

/**
 * Enum for material types.
 * @enum {number}
 */
export const MaterialType = {
  DIFFUSE: 0,
}

/**
 * Convert the local vector a to world coordinates based on normal N.
 * @param {vec3} a - The local vector.
 * @param {vec3} N - The normal vector.
 * @returns {vec3} The world vector.
 */
function toWorld(a, N) {
  let B, C
  if (Math.abs(N[0]) > Math.abs(N[1])) {
    const invLen = 1 / Math.sqrt(N[0] * N[0] + N[2] * N[2])
    C = vec3.fromValues(N[2] * invLen, 0, -N[0] * invLen)
  } else {
    const invLen = 1 / Math.sqrt(N[1] * N[1] + N[2] * N[2])
    C = vec3.fromValues(0, N[2] * invLen, -N[1] * invLen)
  }
  B = vec3.cross(vec3.create(), C, N)

  const result = vec3.create()
  vec3.scaleAndAdd(result, result, B, a[0])
  vec3.scaleAndAdd(result, result, C, a[1])
  vec3.scaleAndAdd(result, result, N, a[2])
  return result
}

/**
 * Class representing a material.
 */
export default class Material {
  #emission

  static TYPE = {
    DIFFUSE: 'DIFFUSE',
    MICROFACET: 'MICROFACET'
  }

  get emission() {
    return vec3.clone(this.#emission)
  }

  /**
   * Create a material.
   * @param {MaterialType} [type=Material.TYPE.DIFFUSE] - The material TYPE.
   * @param {vec3} [emission=vec3(0,0,0)] - The emission vector.
   * @param {number} [ior=1] - 折射率
   * @param {vec3} [kd=vec3(0.8,0.8,0.8)] - 漫反射系数
   * @param {vec3} [ks=vec3(0.2,0.2,0.2)] - 镜面反射系数
   * @param {number} [specularExponent=25] - 高光指数
   * @param {number} [roughness=0] - 粗糙度
   * @param {number} [metalness=0] - 金属度
   */
  constructor({
    type = Material.TYPE.DIFFUSE,
    emission = vec3.fromValues(0, 0, 0),
    ior = 1,
    kd = vec3.fromValues(0.8, 0.8, 0.8),
    ks = vec3.fromValues(0.2, 0.2, 0.2),
    specularExponent = 25,
    roughness = 0,
    metalness = 0
  }) {
    this.type = type
    this.#emission = emission
    this.ior = ior
    this.kd = kd
    this.ks = ks
    this.specularExponent = specularExponent
    this.roughness = roughness
    this.metalness = metalness
    this.a2 = roughness * roughness
  }

  /**
   * Get the color at the given UV coordinates.
   * @param {number} u - The U coordinate.
   * @param {number} v - The V coordinate.
   * @returns {vec3} The color vector.
   */
  getColorAt(u, v) {
    return vec3.create()
  }

  /**
   * Check if the material has emission.
   * @returns {boolean} True if the material has emission, false otherwise.
   */
  hasEmission() {
    return vec3.length(this.#emission) > Number.EPSILON
  }

  /**
   * Sample a direction based on the material properties.
   * @param {vec3} wi - The incident direction.
   * @param {vec3} N - The normal vector.
   * @returns {vec3} The sampled direction.
   */
  sample(wi, N) {
    let result
    const r0 = Math.random()
    const r1 = Math.random()
    const phi = 2 * Math.PI * r1
    switch (this.type) {
      case Material.TYPE.DIFFUSE: {
        // Uniform sample on the hemisphere
        const z = Math.abs(1 - 2 * r0)
        const r = Math.sqrt(1 - z * z)
        const localRay = vec3.fromValues(r * Math.cos(phi), r * Math.sin(phi), z)

        result = toWorld(localRay, N)
        break
      }
      case Material.TYPE.MICROFACET: {
        // 重要性采样
        const a2 = this.a2
        const theta = Math.acos(Math.sqrt((1 - r0) / (r0 * (a2 - 1) + 1)))
        const r = Math.sin(theta)

        result = reflect(wi, toWorld(vec3.fromValues(r * Math.cos(phi), r * Math.sin(phi), Math.cos(theta)), N))
        break
      }
    }
    return result
  }

  /**
   * Calculate the probability density function (PDF) for the given directions.
   * @param {vec3} wi - The incident direction.
   * @param {vec3} wo - The outgoing direction.
   * @param {vec3} N - The normal vector.
   * @returns {number} The PDF value.
   */
  pdf(wi, wo, N) {
    let result = 0
    switch (this.type) {
      case Material.TYPE.DIFFUSE:
        // Uniform sample probability 1 / (2 * PI)
        if (vec3.dot(wi, N) > 0)
          result = 0.5 / Math.PI
        break
      case Material.TYPE.MICROFACET:
        const H = vec3.sub(vec3.create(), wi, wo) // 半程向量
        vec3.normalize(H, H)
        const NdotH = vec3.dot(N, H)
        const a2 = this.a2
        const exp = (a2 - 1) * NdotH * NdotH + 1
        const D = a2 / (Math.PI * exp * exp)

        result = D * NdotH / (4 * vec3.dot(wi, H))
        break
    }
    return result
  }

  /**
  * Calculate the contribution of the given directions.
  * @param {vec3} wi - The incident direction.
  * @param {vec3} wo - The outgoing direction.
  * @param {vec3} N - The normal vector.
  * @returns {vec3} BSDF
  */
  eval(wi, wo, N) {
    const result = vec3.create()
    switch (this.type) {
      case Material.TYPE.DIFFUSE:
        // Calculate the contribution of diffuse model
        const cosalpha = vec3.dot(wi, N)
        if (cosalpha > 0) {
          vec3.scale(result, this.kd, 1 / Math.PI)
        }
        break
      case Material.TYPE.MICROFACET:
        const cosTheta = vec3.dot(wi, N)
        if (cosTheta > 0) {
          let F0 = vec3.fromValues(0.04, 0.04, 0.04) // 菲涅尔基础反射率，最常见的电解质表面的平均值
          const V = vec3.negate(vec3.create(), wo)
          const L = wi
          const H = vec3.add(vec3.create(), V, L) // 半程向量
          vec3.normalize(H, H)
          const NdotV = Math.max(0, vec3.dot(N, V))
          const NdotL = cosTheta
  
          const D = this.distributionGGX(N, H)
          const G = this.geometrySmith(NdotV, NdotL)
          vec3.lerp(F0, F0, this.kd, this.metalness)
          const F = this.fresnelSchlick(vec3.dot(H, V), F0)

          const fs = vec3.scale(vec3.create(), F, D * G / (4 * NdotV * NdotL)) // 镜面反射
          const fr = vec3.scale(vec3.create(), this.kd, (1 - this.metalness) * (1 / Math.PI)) // 漫反射，未定义 Albedo 反射率，用 kd 代替

          vec3.add(result, fs, fr)
        }
        break
    }
    return result
  }

  /**
   * 菲涅尔反射
   * @param {number} cosTheta - 入射角度
   * @param {vec3} F0 - 反射率
   * @returns {vec3}
   */
  fresnelSchlick(cosTheta, F0) {
    const reflectance = vec3.create()
    const oneMinusF0 = vec3.sub(vec3.create(), vec3.fromValues(1, 1, 1), F0)

    vec3.scaleAndAdd(
      reflectance,
      F0,
      oneMinusF0,
      Math.pow(clamp(1 - cosTheta), 5)
    )
    return reflectance
  }

  /**
   * 基于 GGX 分布的微表面法线分布
   * @param {vec3} N - 法线
   * @param {vec3} H - 半角向量 
   * @returns {number}
   */
  distributionGGX(N, H) {
    const a2 = Math.pow(this.roughness, 2)
    const NdotH = Math.max(0, vec3.dot(N, H))
    const num = a2
    let denom = Math.PI * Math.pow(NdotH * NdotH * (a2 - 1) + 1, 2)

    return num / denom
  }

  /**
   * 基于 GGX 分布的几何遮蔽
   * @param {number} NdotV - 视角方向与表面法线的点积
   * @returns {number}
   */
  geometrySchlickGGX(NdotV) {
    if (NdotV <= 0) return 0
    if (NdotV >= 1) return 1
    const k = this.a2 / 2
    const num = NdotV
    const denom = NdotV * (1 - k) + k

    return num / denom
  }

  /**
   * 基于 Schlick-GGX 的几何遮蔽函数的史密斯法
   * @param {number} NdotV - 视角方向与表面法线的点积
   * @param {number} NdotL - 光线方向与表面法线的点积
   * @returns {number}
   */
  geometrySmith(NdotV, NdotL) {
    const ggx1 = this.geometrySchlickGGX(NdotV)
    const ggx2 = this.geometrySchlickGGX(NdotL)

    return ggx1 * ggx2
  }
}