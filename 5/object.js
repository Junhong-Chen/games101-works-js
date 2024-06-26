import { vec3 } from 'gl-matrix'

export const MaterialType = {
  DIFFUSE_AND_GLOSSY: 0,
  REFLECTION_AND_REFRACTION: 1,
  REFLECTION: 2
}

export default class Object3D {
  constructor ({
    materialType = MaterialType.DIFFUSE_AND_GLOSSY, // 材质类型
    ior = 1.3, // 折射率
    kd = .8, // 漫反射系数
    ks = .2, // 镜面反射系数
    diffuseColor = vec3.fromValues(.2, .2, .2), // 漫反射颜色
    specularExponent = 25 // 镜面反射指数
  }) {
    this.materialType = materialType
    this.ior = ior
    this.kd = kd
    this.ks = ks
    this.diffuseColor = diffuseColor
    this.specularExponent = specularExponent
  }

  intersect() {}

  getSurfaceProperties() {}

  evalDiffuseColor() {
    return this.diffuseColor
  }
}