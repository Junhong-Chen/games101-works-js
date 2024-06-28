import { vec3 } from "gl-matrix"
import Ray from "./ray"

function deg2rad(deg) {
  return deg * Math.PI / 180
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
    const framebuffer = new Array(width * height)

    const scale = Math.tan(deg2rad(fov * 0.5))
    const imageAspectRatio = scene.width / scene.height

    // Use this variable as the eye position to start your rays.
    const cameraPosition = vec3.fromValues(-1, 5, 10)
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
        const ray = new Ray(cameraPosition, dir) // 以相机为原点，到任一屏幕像素的光线

        framebuffer[m++] = scene.castRay(ray, 0)
      }
      this.updateProgress((j + 1) / height)
    }

    // 绘制
    this.draw(scene, framebuffer)
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

  clear(scene) { 
    const ctx = this.canvasEl.getContext('2d')
    ctx.clearRect(0, 0, scene.width, scene.height)
  }

  updateProgress(progress) {
    const percentage = Math.max(0, Math.min(100, progress * 100)) // Clamp the value between 0 and 100
    console.info(`%c${percentage.toFixed(1)}%`, 'color:dodgerblue')
  }
}