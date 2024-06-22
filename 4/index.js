import GUI from "lil-gui"

const canvasEl = document.querySelector('#canvas-el')
const width = parseInt(canvasEl.getAttribute('width'))
const height = parseInt(canvasEl.getAttribute('height'))
const controlPoints = []
const gui = new GUI()
const guiParams = {
  controlPointsCount: 4,
  naiveBezier: true
}
let mat

gui.add(guiParams, 'controlPointsCount', 3, 10, 1).onFinishChange(function() {
  clearBezier()
  if (mat) {
    cv.imshow(canvasEl, mat)
  }
})
gui.add(guiParams, 'naiveBezier')

cv.onRuntimeInitialized = function() {
  mat = new cv.Mat(height, width, cv.CV_8UC3)
  cv.imshow(canvasEl, mat)
}

canvasEl.addEventListener('mousedown', function(event) {
  const rect = canvasEl.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  console.log(`Left button of the mouse is clicked - position (${x}, ${y})`)
  if (controlPoints.length >= guiParams.controlPointsCount) {
    clearBezier()
  }
  controlPoints.push(new cv.Point(x, y))

  if (controlPoints.length === guiParams.controlPointsCount) {
    if (guiParams.naiveBezier && controlPoints.length === 4) {
      naiveBezier(controlPoints, mat) // 作业框架提供参考的函数，仅限 4 个控制点
    }
    bezier(controlPoints, mat) // 要求实现绘制贝塞尔曲线的函数，不限制控制点数量
  }
  for(const point of controlPoints) {
    cv.circle(mat, point, 3, new cv.Scalar(255, 255, 255, 255), 3)
  }
  if (mat) {
    cv.imshow(canvasEl, mat)
  }
}, false)

// 简易的高斯加权算法
function getWeight(distance) {
  return Math.exp(-distance * distance / 2)
}

function clearBezier() {
  controlPoints.length = 0
  mat.setTo(new cv.Scalar(0, 0, 0, 0))
}

function naiveBezier(points, mat) {
  const [p0, p1, p2, p3] = points

  for (let t = 0; t <= 1; t += .001) {
    let x = Math.pow(1 - t, 3) * p0.x
            + 3 * t * Math.pow(1 - t, 2) * p1.x
            + 3 * Math.pow(t, 2) * (1 - t) * p2.x
            + Math.pow(t, 3) * p3.x
    let y = Math.pow(1 - t, 3) * p0.y
            + 3 * t * Math.pow(1 - t, 2) * p1.y
            + 3 * Math.pow(t, 2) * (1 - t) * p2.y
            + Math.pow(t, 3) * p3.y

    mat.ucharPtr(Math.round(y), Math.round(x))[0] = 255
  }
}

function recursiveBezier(points, t) {
  // TODO: Implement de Casteljau's algorithm
  if (points.length === 1) {
    return points[0]
  }
  const _points = []
  for (let i = 0; i < points.length - 1; i++) {
    const point = points[i]
    const nextPoint = points[i + 1]
    const _x = point.x * (1 - t) + nextPoint.x * t
    const _y = point.y * (1 - t) + nextPoint.y * t
    _points.push(new cv.Point(_x, _y))
  }
  return recursiveBezier(_points, t)
}

function bezier(points, mat) {
  // TODO: Iterate through all t = 0 to t = 1 with small steps, and call de Casteljau's
  // recursive Bezier algorithm.
  for (let t = 0; t <= 1; t += .001) {
    const point = recursiveBezier(points, t)
    const ix = Math.round(point.x)
    const iy = Math.round(point.y)

    // 计算当前像素点周围 4 个像素点的加权颜色
    for (let dy = 0; dy <= 1; dy++) {
      for (let dx = 0; dx <= 1; dx++) {
        const nx = ix + dx
        const ny = iy + dy
        const d = Math.sqrt(Math.pow(point.x - nx, 2) + Math.pow(point.y - ny, 2))
        const w = getWeight(d)
        if (nx >= 0 && nx <= width && ny >= 0 && ny <= height) {
          const pixel = mat.ucharPtr(ny, nx)
          pixel[1] = Math.max(pixel[1], w * 255) // 像素点的颜色有可能存在多次计算，取最大值
        }
      }
    }
  }
}