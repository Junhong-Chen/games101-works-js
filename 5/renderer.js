import { vec3 } from "gl-matrix"
import { MaterialType } from './object'

const EPSILON = 1e-5 // 用于浮点比较，避免计算误差

function vec3SameValue(value) {
  return vec3.fromValues(value, value, value)
}

function clamp(lo, hi, v) {
  return Math.max(lo, Math.min(hi, v))
}

function deg2rad(deg) {
  return deg * Math.PI / 180
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

/**
 * @method trace
 * @param {vec3} orig - the ray origin
 * @param {vec3} dir - the ray direction
 * @param {number} objects - the list of objects the scene contains
 * @returns {Payload|null} payload
 * 
 * @typedef {Object} Payload
 * @property {number} tNear - tNear contains the distance to the cloesest intersected object
 * @property {number} index - index stores the index of the intersect triangle if the interesected object is a mesh
 * @property {vec2} uv - uv stores the u and v barycentric coordinates of the intersected point
 * @property {object} [hitObject] - hitObject stores the pointer to the intersected object (used to retrieve material information, etc.)
 */
function trace(orig, dir, objects) {
  let tNear = Infinity
  let payload = null
  for (const object of objects) {
    const result = object.intersect(orig, dir, tNear)
    if (result && result.tNear < tNear) {
      payload = result
      tNear = result.tNear
    }
  }
  return payload
}

export default class Renderer {
  constructor(canvasEl) {
    this.canvasEl = canvasEl
  }

  // The main render function.
  // This where we iterate over all pixels in the image, generate primary rays and cast these rays into the scene.
  // The content of the framebuffer is saved to a file.
  render(scene) {
    const { width, height, fov } = scene
    const frameBuffer = new Array(width * height)

    const scale = Math.tan(deg2rad(fov * 0.5))
    const imageAspectRatio = scene.width / scene.height

    // Use this variable as the eye position to start your rays.
    const cameraPosition = vec3.create()
    let m = 0
    
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        // generate primary ray direction
        // TODO: Find the x and y positions of the current pixel to get the direction vector that passes through it.
        // Also, don't forget to multiply both of them with the variable *scale*, and x (horizontal) variable with the *imageAspectRatio*
        // 将像素坐标转换为归一化设备坐标
        const x = (2 * (i + 0.5) / width - 1) * imageAspectRatio * scale
        const y = -(2 * (j + 0.5) / height - 1) * scale
        const dir = vec3.normalize(vec3.create(), vec3.fromValues(x, y, -1)) // Don't forget to normalize this direction!

        frameBuffer[m++] = this.castRay(cameraPosition, dir, scene, 0)
      }
      this.updateProgress((j + 1) / height)
    }

    // 绘制
    this.draw(scene, frameBuffer)
  }

  draw(scene, data) {
    const ctx = this.canvasEl.getContext('2d')
    const length = data.length
    const imageData = ctx.createImageData(scene.width, scene.height)
    for (var i = 0; i < length; i++) {
      var index = i * 4
      imageData.data[index] = data[i][0] * 255
      imageData.data[index + 1] = data[i][1] * 255
      imageData.data[index + 2] = data[i][2] * 255
      imageData.data[index + 3] = 255 // alpha
    }
    ctx.putImageData(imageData, 0, 0)
  }

  updateProgress(progress) {
    const percentage = Math.max(0, Math.min(100, progress * 100)) // Clamp the value between 0 and 100
    console.info(`%c${percentage.toFixed(1)}%`, 'color:dodgerblue')
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
   * @param {vec3} orig
   * @param {vec3} dir
   * @param {Scene} scene
   * @param {number} depth
   */
  castRay(orig, dir, scene, depth) {
    if (depth > scene.maxDepth) {
      return vec3.create()
    }

    let hitColor = scene.backgroundColor
    const payload = trace(orig, dir, scene.objects)
    if (payload) {
      const { tNear, index, uv, hitObj } = payload
      const hitPoint = vec3.add(vec3.create(), orig, vec3.scale(vec3.create(), dir, tNear))
      const { normal: N, st } = hitObj.getSurfaceProperties({ index, uv, hitPoint })
      const origA = vec3.add(vec3.create(), hitPoint, vec3.scale(vec3.create(), N, EPSILON))
      const origB = vec3.sub(vec3.create(), hitPoint, vec3.scale(vec3.create(), N, EPSILON))

      switch (hitObj.materialType) {
        case MaterialType.REFLECTION_AND_REFRACTION: {
          const reflectionDirection = vec3.normalize(vec3.create(), reflect(dir, N))
          const refractionDirection = vec3.normalize(vec3.create(), refract(dir, N, hitObj.ior))
          const reflectionRayOrig = (vec3.dot(reflectionDirection, N) < 0) ? origB : origA
          const refractionRayOrig = (vec3.dot(refractionDirection, N) < 0) ? origB : origA
          const reflectionColor = this.castRay(reflectionRayOrig, reflectionDirection, scene, depth + 1)
          const refractionColor = this.castRay(refractionRayOrig, refractionDirection, scene, depth + 1)
          const kr = fresnel(dir, N, hitObj.ior)
          hitColor = vec3.add(
            vec3.create(),
            vec3.scale(vec3.create(), reflectionColor, kr),
            vec3.scale(vec3.create(), refractionColor, (1 - kr))
          )
          break
        }
        case MaterialType.REFLECTION: {
          const kr = fresnel(dir, N, hitObj.ior)
          const reflectionDirection = this.reflect(dir, N)
          const reflectionRayOrig = (vec3.dot(reflectionDirection, N) < 0) ? origA : origB
          const reflectionColor = this.castRay(reflectionRayOrig, reflectionDirection, scene, depth + 1)
          hitColor = vec3.scale(vec3.create(), reflectionColor, kr)
          break
        }
        case MaterialType.DIFFUSE_AND_GLOSSY:
        default: {
          // We use the Phong illumation model int the default case.
          // The phong model is composed of a diffuse and a specular reflection component.
          let lightAmt = vec3.create()
          let specularColor = vec3.create()
          const shadowPointOrig = (vec3.dot(dir, N) < 0) ? origA : origB
          // Loop over all lights in the scene and sum their contribution up
          // We also apply the lambert cosine law
          for (const light of scene.lights) {
            const lightDir = vec3.sub(vec3.create(), light.position, hitPoint)
            // 光源与击中点之间距离的平方
            const lightDistance2 = vec3.dot(lightDir, lightDir)
            vec3.normalize(lightDir, lightDir)
            const LdotN = Math.max(0, vec3.dot(lightDir, N))
            // is the point in shadow, and is the nearest occluding object closer to the object than the light itself?
            const shadowRes = trace(shadowPointOrig, lightDir, scene.objects)
            const inShadow = shadowRes && (shadowRes.tNear * shadowRes.tNear < lightDistance2)

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
                  Math.max(0, -vec3.dot(reflectionDirection, dir)),
                  hitObj.specularExponent
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
                hitObj.evalDiffuseColor(st)
              ),
              hitObj.kd
            ),
            vec3.scale(
              vec3.create(),
              specularColor,
              hitObj.ks
            )
          )
          break
        }
      }
    }

    return hitColor
  }
}