import { vec3 } from "gl-matrix"
import Scene from "./scene"
import Ray from "./ray"
import { deg2rad, clamp } from "./utils"

/**
 * @typedef {Object} HitPayload
 * @property {number} tNear - The nearest intersection distance.
 * @property {number} index - The index of the intersected object.
 * @property {vec2} uv - The UV coordinates of the intersection point.
 * @property {Object} hitObj - The intersected object.
 */

/**
 * Renders a scene.
 */
export default class Renderer {
  /**
   * Create the renderer.
   * @param {HTMLElement} canvasEl - The canvas element.
   */
  constructor(canvasEl) {
    this.canvasEl = canvasEl
  }

  /**
   * Renders the given scene.
   * @param {Scene} scene - The scene to render.
   * @param {number} spp - Samples per pixel.
   */
  render(scene, spp = 1) {
    const { width, height, fov } = scene
    const framebuffer = new Array(width * height)

    const scale = Math.tan(deg2rad(fov * 0.5))
    const imageAspectRatio = width / height
    const cameraPosition = vec3.fromValues(278, 273, -800)
    let m = 0

    // Change the spp value to change sample amount
    console.log(`SPP: ${spp}`)

    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        // Generate primary ray direction
        const x = (2 * (i + 0.5) / width - 1) * imageAspectRatio * scale
        const y = -(2 * (j + 0.5) / height - 1) * scale

        const dir = vec3.fromValues(-x, y, 1)
        vec3.normalize(dir, dir)
        const ray = new Ray(cameraPosition, dir)

        framebuffer[m] = new vec3.create()
        for (let k = 0; k < spp; k++) {
          const color = scene.castRay(ray)
          vec3.add(framebuffer[m], framebuffer[m], color)
        }
        vec3.scale(framebuffer[m], framebuffer[m], 1 / spp)
        m++
      }
      this.updateProgress((j + 1) / scene.height)
    }

    this.draw(scene, framebuffer)
  }

  /**
   * Updates the rendering progress.
   * @param {number} progress - The current progress, between 0 and 1.
   */
  updateProgress(progress) {
    console.log(`%c${(progress * 100).toFixed(2)}%`, 'color:dodgerblue')
  }

  /**
   * Saves the framebuffer to a PPM file.
   * @param {Scene} scene - The Scene.
   * @param {Array} data - The framebuffer data.
   */
  draw(scene, data) {
    const ctx = this.canvasEl.getContext('2d')
    const length = data.length
    const imageData = ctx.createImageData(scene.width, scene.height)
    for (var i = 0; i < length; i++) {
      var index = i * 4
      imageData.data[index] = Math.pow(clamp(data[i][0]), 0.6) * 255
      imageData.data[index + 1] = Math.pow(clamp(data[i][1]), 0.6) * 255
      imageData.data[index + 2] = Math.pow(clamp(data[i][2]), 0.6) * 255
      imageData.data[index + 3] = 255 // alpha
    }
    ctx.putImageData(imageData, 0, 0)
  }
}