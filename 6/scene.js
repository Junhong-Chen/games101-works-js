import { vec3 } from "gl-matrix"
import BVHAccel from "./BVH"
import Ray from "./ray"
import { MaterialType } from './material'
import Object3D from "./object"
import Light from "./light"

function vec3SameValue(value) {
  return vec3.fromValues(value, value, value)
}

function clamp(lo, hi, v) {
  return Math.max(lo, Math.min(hi, v))
}

// Compute refraction direction using Snell's law
//
// We need to handle with care the two possible situations:
//
//    - When the ray is inside the object
//
//    - When the ray is outside.
//
// If the ray is outside, you need to make cosi positive cosi = -N.I
//
// If the ray is inside, you need to invert the refractive indices and negate the normal N
function refract(I, N, ior) {
  let cosi = clamp(-1, 1, vec3.dot(I, N))
  let etai = 1, etat = ior
  let n = vec3.clone(N)
  if (cosi < 0) {
    cosi = -cosi
  } else {
    [etai, etat] = [etat, etai]
    vec3.negate(n, N)
  }
  const eta = etai / etat
  const k = 1 - eta * eta * (1 - cosi * cosi)
  return k < 0 ?
    vec3.create() :
    vec3.add(
      vec3.create(),
      vec3.scale(vec3.create(), I, eta),
      vec3.scale(vec3.create(), n, eta * cosi - Math.sqrt(k))
    )
}

/**
 * @method fresnel - Compute Fresnel equation
 * @param {vec3} I - the incident view direction
 * @param {vec3} N - the normal at the intersection point
 * @param {number} ior - the material refractive index
 */
function fresnel(I, N, ior) {
  let cosi = clamp(-1, 1, vec3.dot(I, N))
  let etai = 1, etat = ior
  if (cosi > 0) {
    [etai, etat] = [etat, etai]
  }
  // Compute sini using Snell's law
  const sint = etai / etat * Math.sqrt(Math.max(0, 1 - cosi * cosi))
  // Total internal reflection
  if (sint >= 1) {
    return 1
  } else {
    const cost = Math.sqrt(Math.max(0, 1 - sint * sint))
    cosi = Math.abs(cosi)
    const Rs = ((etat * cosi) - (etai * cost)) / ((etat * cosi) + (etai * cost))
    const Rp = ((etai * cosi) - (etat * cost)) / ((etai * cosi) + (etat * cost))
    return (Rs * Rs + Rp * Rp) / 2
  }
  // As a consequence of the conservation of energy, transmittance is given by:
  // kt = 1 - kr
}

// Compute reflection direction
function reflect(I, N) {
  return vec3.sub(
    vec3.create(),
    I,
    vec3.scale(
      vec3.create(),
      N,
      2 * vec3.dot(I, N)
    )
  )
}

/**
 * @method trace
 * @param {Ray} ray
 * @param {Array} objects
 */
function trace(ray, objects) {
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

export default class Scene {
  #objects = []
  #lights = []
  #maxDepth = 5 // 最大递归深度，用于光线追踪中的最大反射/折射次数
  #bvh

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
    if (target instanceof Object3D) {
      this.#objects.push(target)
    } else if (target instanceof Light) {
      this.#lights.push(target)
    }
  }

  buildBVH({ splitMethod }) {
    console.log(" - Generating BVH...")
    this.#bvh = new BVHAccel({ primitives: this.#objects, splitMethod })
    for (const obj of this.#objects) {
      if (obj instanceof Object3D) obj.buildBVH({ splitMethod })
    }
  }
  
  intersect(ray) {
    return this.#bvh.intersect(ray)
  }

  // Implementation of the Whitted-style light transport algorithm (E [S*] (D|G) L)
  //
  // This function is the function that compute the color at the intersection point
  // of a ray defined by a position and a direction. Note that thus function is recursive (it calls itself).
  //
  // If the material of the intersected object is either reflective or reflective and refractive,
  // then we compute the reflection/refraction direction and cast two new rays into the scene
  // by calling the castRay() function recursively. When the surface is transparent, we mix
  // the reflection and refraction color using the result of the fresnel equations (it computes
  // the amount of reflection and refraction depending on the surface normal, incident view direction
  // and surface refractive index).
  //d
  // If the surface is diffuse/glossy we use the Phong illumation model to compute the color
  // at the intersection point.
  /**
   * @method castRay
   * @param {Ray} ray
   * @param {number} depth
   */
  castRay(ray, depth) {
    if (depth > this.#maxDepth) {
      return vec3.create()
    }

    const intersection = this.intersect(ray)
    const { happened, material, obj: hitObject, coords, uv } = intersection
    const index = 0
    let hitColor = vec3.clone(this.backgroundColor)

    if (happened) {
      const hitPoint = vec3.clone(coords)
      const { normal: N, st } = hitObject.getSurfaceProperties({ index, uv, hitPoint })
      const origA = vec3.add(vec3.create(), hitPoint, vec3.scale(vec3.create(), N, Number.EPSILON))
      const origB = vec3.sub(vec3.create(), hitPoint, vec3.scale(vec3.create(), N, Number.EPSILON))
  
      switch (material.type) {
        case MaterialType.REFLECTION_AND_REFRACTION: {
          const reflectionDirection = vec3.normalize(vec3.create(), reflect(ray.direction, N))
          const refractionDirection = vec3.normalize(vec3.create(), refract(ray.direction, N, material.ior))
          const reflectionRayOrig = (vec3.dot(reflectionDirection, N) < 0) ? origB : origA
          const refractionRayOrig = (vec3.dot(refractionDirection, N) < 0) ? origB : origA
          const reflectionColor = this.castRay(new Ray(reflectionRayOrig, reflectionDirection), depth + 1)
          const refractionColor = this.castRay(new Ray(refractionRayOrig, refractionDirection), depth + 1)
          const kr = fresnel(ray.dir, N, material.ior)
          hitColor = vec3.add(
            vec3.create(),
            vec3.scale(vec3.create(), reflectionColor, kr),
            vec3.scale(vec3.create(), refractionColor, (1 - kr))
          )
          break
        }
        case MaterialType.REFLECTION: {
          const kr = fresnel(ray.direction, N, material.ior)
          const reflectionDirection = this.reflect(ray.direction, N)
          const reflectionRayOrig = (vec3.dot(reflectionDirection, N) < 0) ? origA : origB
          const reflectionColor = this.castRay(new Ray(reflectionRayOrig, reflectionDirection), depth + 1)
          hitColor = vec3.scale(vec3.create(), reflectionColor, kr)
          break
        }
        case MaterialType.DIFFUSE_AND_GLOSSY:
        default: {
          // We use the Phong illumation model int the default case.
          // The phong model is composed of a diffuse and a specular reflection component.
          let lightAmt = vec3.create()
          let specularColor = vec3.create()
          const shadowPointOrig = (vec3.dot(ray.direction, N) < 0) ? origA : origB
          // Loop over all lights in the scene and sum their contribution up
          // We also apply the lambert cosine law
          for (const light of this.#lights) {
            const lightDir = vec3.sub(vec3.create(), light.position, hitPoint)
            // 光源与击中点之间距离的平方
            const lightDistance2 = vec3.dot(lightDir, lightDir)
            vec3.normalize(lightDir, lightDir)
            const LdotN = Math.max(0, vec3.dot(lightDir, N))
            // is the point in shadow, and is the nearest occluding object closer to the object than the light itself?
            const inShadow = this.#bvh.intersect(new Ray(shadowPointOrig, lightDir)).happened

            if (!inShadow) vec3.add(lightAmt, lightAmt, vec3SameValue(light.intensity * LdotN))
            const reflectionDirection = reflect(
              vec3.negate(vec3.create(), lightDir),
              N
            )

            vec3.add(
              specularColor,
              specularColor,
              vec3SameValue(
                Math.pow(
                  Math.max(0, -vec3.dot(reflectionDirection, ray.direction)),
                  material.specularExponent
                ) * light.intensity
              )
            )
          }
          // 漫反射 + 镜面反射
          hitColor = vec3.add(
            vec3.create(),
            vec3.scale(
              vec3.create(),
              vec3.mul(
                vec3.create(),
                lightAmt,
                hitObject.evalDiffuseColor(st)
              ),
              material.kd
            ),
            vec3.scale(
              vec3.create(),
              specularColor,
              material.ks
            )
          )
          break
        }
      }
    }

    return hitColor
  }
}