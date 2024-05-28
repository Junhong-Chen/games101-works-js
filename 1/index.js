import Rasterizer from "./rasterizer"
import { vec3, mat4 } from "gl-matrix"

// fromValues 方法的入参是按“列”顺序传入的，这里封装下改成按“行”传入
function Matrix4(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  return mat4.fromValues(m00, m10, m20, m30, m01, m11, m21, m31, m02, m12, m22, m32, m03, m13, m23, m33)
}

const rasterizer = new Rasterizer()

const canvasEl = document.querySelector('#canvasEl')
// 作业要求使用 CPU 模拟渲染器，所以这里使用 2d 上下文
const ctx = canvasEl.getContext('2d')
const width = canvasEl.getAttribute('width')
const height = canvasEl.getAttribute('height')
let angle = 0

function getModelMatrix(axis, angle) {
  angle = angle / 180 * Math.PI
  let [x, y, z] = axis
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const t = 1 - cos

  // 规范化旋转轴
  const length = Math.sqrt(x * x + y * y + z * z)
  x /= length
  y /= length
  z /= length

  // Rodrigues 旋转公式
  const rotate = new Matrix4(
    t * x * x + cos,     t * x * y - sin * z, t * x * z + sin * y, 0,
    t * x * y + sin * z, t * y * y + cos,     t * y * z - sin * x, 0,
    t * x * z - sin * y, t * y * z + sin * x, t * z * z + cos,     0,
    0,                   0,                   0,                   1
  )
  return rotate
}

function getViewMatrix(cameraPosition) {
  let view = mat4.create()
  const translate = new Matrix4(
    1, 0, 0, -cameraPosition[0],
    0, 1, 0, -cameraPosition[1],
    0, 0, 1, -cameraPosition[2],
    0, 0, 0, 1
  )
  mat4.multiply(view, view, translate)
  return view
}

function getProjectionMatrix(fov, aspectRatio, near, far) {
  let projection = mat4.create()
  const fovHalfAngle = fov / 180 / 2 * Math.PI
  const t = near * Math.tan(fovHalfAngle)
  const r = t * aspectRatio
  const l = -r
  const b = -r

  const perspective = new Matrix4(
    near, 0, 0, 0,
    0, near, 0, 0,
    0, 0, near + far, -near * far,
    0, 0, 1, 0
  )

  const scale = new Matrix4(
    2 / (r - l), 0, 0, 0,
    0, 2 / (t - b), 0, 0,
    0, 0, 2 / (far - near), 0,
    0, 0, 0, 1
  )

  const translate = new Matrix4(
    1, 0, 0, -(l + r) / 2,
    0, 1, 0, -(b + t) / 2,
    0, 0, 1, -(near + far) / 2,
    0, 0, 0, 1
  )

  const orthographic = mat4.multiply(mat4.create(), scale, translate)

  mat4.multiply(projection, orthographic, perspective)
  return projection
}

function render(angle = 0) {
  rasterizer.rasterizer(700, 700)
  const cameraPosition = vec3.fromValues(0, 0, 5)
  const position = [
    vec3.fromValues(2, 0, -2),
    vec3.fromValues(0, 2, -2),
    vec3.fromValues(-2, 0, -2),
  ]
  const indices = [vec3.fromValues(0, 1, 2)]
  const positionId = rasterizer.loadPositions(position)
  const indicesId = rasterizer.loadIndices(indices)

  rasterizer.clear(true, true)
  rasterizer.setModel(getModelMatrix(vec3.fromValues(0, 0, 1), angle))
  rasterizer.setView(getViewMatrix(cameraPosition))
  rasterizer.setProjection(getProjectionMatrix(45, 1, 0.1, 50))
  rasterizer.draw(positionId, indicesId, 'triangle')

  // 绘制
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = 'white'
  for (let i = rasterizer.frameBuffers.length - 1; i > -1; i--) {
    const pixel = rasterizer.frameBuffers[i]
    if (pixel[0] !== 0) {
      const y = Math.floor(i / width)
      const x = i % width
      ctx.fillRect(x, y, 1, 1)
    }
  }
}

render(angle)

window.addEventListener('keypress', function(e) {
  if (e.code === 'KeyA') {
    angle--
    render(angle)
  }
  if (e.code === 'KeyD') {
    angle++
    render(angle)
  }
})