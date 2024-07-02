import { vec3 } from "gl-matrix"

function lerp(x, v0, v1) {
  return vec3.add(
    vec3.create(),
    v0,
    vec3.scale(
      vec3.create(),
      vec3.sub(vec3.create(), v1, v0),
      x,
    )
  )
}

export default class Texture {
  #width
  #height
  #imageData

  get width() {
    return this.#width
  }
  get height() {
    return this.#height
  }

  constructor(img) {
    this.#imageData = cv.imread(img)
    this.#width = this.#imageData.cols
    this.#height = this.#imageData.rows
  }
  
  getColor(u, v) {
    const uImg = u * this.#width
    const vImg = (1 - v) * this.#height
    const color = this.#imageData.ucharPtr(vImg, uImg)
    return vec3.fromValues(...color)
  }

  getColorBilinear(u, v) {
    // uv 坐标以左下角为起始点
    const uImg = u * this.#width
    const vImg = (1 - v) * this.#height
    const u0 = ~~uImg
    const u1 = u0 + 1
    const v0 = ~~vImg
    const v1 = v0 + 1
    const s = uImg - u0
    const t = vImg - v0
    // 临近四个点的颜色值
    const u00 = this.#imageData.ucharPtr(v0, u0)
    const u10 = this.#imageData.ucharPtr(v0, u1)
    const u01 = this.#imageData.ucharPtr(v1, u0)
    const u11 = this.#imageData.ucharPtr(v1, u1)

    // 上面返回的颜色值是 vec4（RBGA），但在 vec3 计算中传入 vec4 会自动忽略最后一个值 Alpha，所以这里就不再转换了
    const c0 = lerp(s, u00, u10)
    const c1 = lerp(s, u01, u11)
    const color = lerp(t, c0, c1)
    return color
  }

  h(u, v) {
    const color = this.getColor(u, v)
    return vec3.len(color)
  }
}