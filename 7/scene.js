import { vec3 } from "gl-matrix"
import BVHAccel from "./BVH"
import Ray from "./ray"
import Intersection from "./intersection"
import { EPSILON } from "./utils"
import Object3D from "./object"
import Light from "./light"

/**
 * Represents a scene.
 */
export default class Scene {
  #objects = []
  #lights = []
  #bvh

  get object() {
    return this.#objects
  }

  get light() {
    return this.#lights
  }

  /**
   * Creates a scene.
   * @param {number} width - The width of the scene.
   * @param {number} height - The height of the scene.
   */
  constructor({ width, height }) {
    this.width = width
    this.height = height
    this.fov = 40
    this.backgroundColor = vec3.fromValues(0.235294, 0.67451, 0.843137)
    this.RussianRoulette = 0.8
  }

  /**
   * Adds an object to the scene.
   * @param {Object} object - The object to add.
   */
  add(target) {
    if (target instanceof Object3D) {
      this.#objects.push(target)
    } else if (target instanceof Light) {
      this.#lights.push(target)
    }
  }

  /**
   * Builds the BVH acceleration structure for the scene.
   * @param {SplitMethod} splitMethod - Method to split the nodes.
   */
  buildBVH({ splitMethod }) {
    this.#bvh = new BVHAccel({ primitives: this.#objects, splitMethod })
    for (const obj of this.#objects) {
      if (obj instanceof Object3D) obj.buildBVH({ splitMethod })
    }
  }

  /**
   * Computes the intersection of a ray with the scene.
   * @param {Ray} ray - The ray.
   * @returns {Intersection} The intersection information.
   */
  intersect(ray) {
    return this.#bvh ? this.#bvh.intersect(ray) : new Intersection()
  }

  /**
   * Samples a light from the scene.
   * @param {Intersection} pos - The sampled position.
   * @returns {number} pdf - The probability density function.
   */
  sampleLight() {
    let emitAreaSum = 0
    for (const object of this.#objects) {
      if (object.hasEmit()) {
        emitAreaSum += object.getArea()
      }
    }
    let p = Math.random() * emitAreaSum
    emitAreaSum = 0
    for (const object of this.#objects) {
      if (object.hasEmit()) {
        emitAreaSum += object.getArea()
        if (p <= emitAreaSum) {
          return object.sample()
        }
      }
    }
  }

  /**
   * Traces a ray and finds the nearest intersected object.
   * @param {Ray} ray - The ray.
   * @param {Object3D[]} objects - The objects in the scene.
   * @returns {Object3D|null} hitObject - The intersected object.
   */
  trace(ray, objects) {
    let result = null
    for (let k = 0; k < objects.length; ++k) {
      const tNearK = Infinity
      const hitObj = objects[k].intersect(ray)
      if (hitObj && tNearK < hitObj.tNear) {
        result = hitObj
      }
    }
    return result
  }

  /* 伪代码
  shade(p, wo)
    sampleLight(inter , pdf_light)
    Get x, ws, NN, emit from inter
    Shoot a ray from p to x
    If the ray is not blocked in the middle
      L_dir = emit * eval(wo, ws, N) * dot(ws, N) * dot(-ws, NN) / |x-p|^2 / pdf_light

    L_indir = 0.0
    Test Russian Roulette with probability RussianRoulette
    wi = sample(wo, N)
    Trace a ray r(p, wi)
    If ray r hit a non-emitting object at q
      L_indir = shade(q, wi) * eval(wo, wi, N) * dot(wi, N) / pdf(wo, wi, N) / RussianRoulette

    Return L_dir + L_indir
  */
  /**
   * 着色函数
   * @param {vec3} inter - 光线与物体的交点
   * @param {vec3} wo - 光线出射方向
   */
  shade(inter, wo) {
    // 直接光照
    let LDir = vec3.create()
    const { coords: p, normal: N, material: m } = inter
    const { pos: interLight, pdf: pdfLight } = this.sampleLight()
    const { coords: x, normal: NN, emit } = interLight
    const ws = vec3.sub(vec3.create(), x, p) // p点指向光源的方向
    const d = vec3.length(ws) // p点到光源的距离
    vec3.normalize(ws, ws)
    // 判断p点与光源之间是否有遮挡
    const d2 = this.intersect(new Ray(p, ws)).distance
    if (d2 > d - EPSILON) {
      const nws = vec3.negate(vec3.create(), ws)
      vec3.scale(LDir, vec3.mul(vec3.create(), emit, m.eval(ws, wo, N)), vec3.dot(ws, N) * vec3.dot(nws, NN) / Math.pow(d, 2) / pdfLight)
    }

    // 间接光照
    let LIndir = vec3.create()
    // 俄罗斯轮盘赌
    if (Math.random() < this.RussianRoulette) {
      const wi = vec3.normalize(vec3.create(), m.sample(wo, N))
      const r = new Ray(p, wi)
      const inter2 = this.intersect(r)
      const pdf = m.pdf(wi, wo, N)
      if (inter2.happened && !inter2.material.hasEmission() && pdf > EPSILON) { // 在直接光照中，已经计算过光源的贡献，所以不再对光源进行计算
        vec3.scale(LIndir, vec3.mul(vec3.create(), this.shade(inter2, wi), m.eval(wi, wo, N)), vec3.dot(wi, N) / pdf / this.RussianRoulette)
      }
    }

    return vec3.add(vec3.create(), LDir, LIndir)
  }

  /**
   * Implements the path tracing algorithm.
   * @param {Ray} ray - The ray.
   * @returns {vec3} color - The computed color.
   */
  castRay(ray) {
    // TODO: Implement the path tracing algorithm
    const inter = this.intersect(ray)
    if (inter.happened) { // 如果光线打到物体
      if (inter.material.hasEmission()) { // 打到光源
        return inter.material.emission // 光源
      } else {
        return this.shade(inter, ray.direction) // 直接光照 + 间接光照
      }
    } else {
      return vec3.create()
    }
  }
}