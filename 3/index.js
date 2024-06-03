import { vec3, vec4, mat3, mat4 } from "gl-matrix"
import { OBJ } from "webgl-obj-loader"
import GUI from "lil-gui"
import Rasterizer from "./rasterizer"
import Triangle from "./triangle"
import Texture from "./texture"

// fromValues 方法的入参是按“列”顺序传入的，这里封装下改成按“行”传入
function Matrix4(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  return mat4.fromValues(m00, m10, m20, m30, m01, m11, m21, m31, m02, m12, m22, m32, m03, m13, m23, m33)
}

function loader(path) {
  return new Promise((resolve, reject) => {
    fetch(path)
      .then(res => res.text())
      .then(data => {
        const mesh = new OBJ.Mesh(data)
        resolve(mesh)
      })
      .catch(error => {
        reject(error)
      })
  })
}

const ctx = canvasEl.getContext('2d')
const width = parseInt(canvasEl.getAttribute('width'))
const height = parseInt(canvasEl.getAttribute('height'))
const cameraPosition = vec3.fromValues(0, 0, 10)
const rasterizer = new Rasterizer({ width, height, cameraPosition })
const SHADERS = {
  TEXTURE: 'texture',
  NORMAL: 'normal',
  PHONG: 'phong',
  BUMP: 'bump',
  DISPLACEMENT: 'displacement'
}
let GETCOLOR = 'getColor'

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
  const rotation = new Matrix4(
    t * x * x + cos, t * x * y - sin * z, t * x * z + sin * y, 0,
    t * x * y + sin * z, t * y * y + cos, t * y * z - sin * x, 0,
    t * x * z - sin * y, t * y * z + sin * x, t * z * z + cos, 0,
    0, 0, 0, 1
  )

  const scale = new Matrix4(
    2.5, 0, 0, 0,
    0, 2.5, 0, 0,
    0, 0, 2.5, 0,
    0, 0, 0, 1
  )

  const translate = new Matrix4(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  )

  return mat4.multiply(mat4.create(), translate, mat4.multiply(mat4.create(), rotation, scale))
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
  // TODO: Use the same projection matrix from the previous assignments
  // 相机向负 Z 轴方向看
  near = -near
  far = -far
  let projection = mat4.create()
  const fovHalfAngle = fov / 180 / 2 * Math.PI
  const t = near * Math.tan(fovHalfAngle)
  const r = t * aspectRatio
  const l = -r
  const b = -t

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

function vertexShader(payload) {
  return payload.position
}

// function reflect(vec, axis) {
//   const costheta = vec3.dot(vec, axis)
//   return vec3.normalize(vec3.create(), 2 * costheta * axis - vec)
// }

function normalFragmentShader(payload) {
  const color = vec3.scale(
    vec3.create(),
    vec3.add(
      vec3.create(),
      vec3.fromValues(1, 1, 1),
      vec3.normalize(vec3.create(), payload.normal)
    ),
    .5
  )
  return vec3.scale(color, color, 255)
}

function textureFragmentShader(payload) {
  const { cameraPosition, position, normal, textureCoords } = payload
  let textureColor = vec3.create()
  if (payload.texture) {
    // TODO: Get the texture value at the texture coordinates of the current fragment
    textureColor = payload.texture[GETCOLOR](...textureCoords)
  }

  const ka = vec3.fromValues(.005, .005, .005)
  const kd = vec3.scale(vec3.create(), textureColor, 1 / 255)
  const ks = vec3.fromValues(.7937, .7937, .7937)

  const l1 = {
    position: vec3.fromValues(20, 20, 20),
    intensity: vec3.fromValues(500, 500, 500)
  }
  const l2 = {
    position: vec3.fromValues(-20, 20, 0),
    intensity: vec3.fromValues(500, 500, 500)
  }

  const lights = [l1, l2]
  const ambientLightintensity = vec3.fromValues(10, 10, 10)
  const p = 150

  const resultColor = vec3.create()

  const ambient = vec3.mul(vec3.create(), ka, ambientLightintensity)
  const diffuse = vec3.create()
  const specular = vec3.create()

  for (const light of lights) {
    // TODO: For each light source in the code, calculate what the *ambient*, *diffuse*, and *specular*
    // components are. Then, accumulate that result on the *result_color* object.
    const r = vec3.dist(light.position, position)
    const l = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), light.position, position)) // 光源方向
    const energyReceived = Math.max(0, vec3.dot(l, normal))
    const attenuationFactor = vec3.scale(vec3.create(), light.intensity, 1 / Math.pow(r, 2))
    const ld = vec3.scale(
      vec3.create(),
      vec3.mul(
        vec3.create(),
        kd,
        attenuationFactor
      ),
      energyReceived
    )
    vec3.add(diffuse, diffuse, ld)

    const v = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), cameraPosition, position)) // 相机观察方向
    const h = vec3.normalize(vec3.create(), vec3.add(vec3.create(), v, l)) // 半程向量
    const eyeReceived = Math.pow(Math.max(0, vec3.dot(h, normal)), p)
    const ls = vec3.scale(
      vec3.create(),
      vec3.mul(
        vec3.create(),
        ks,
        attenuationFactor
      ),
      eyeReceived
    )
    vec3.add(specular, specular, ls)
  }

  vec3.add(resultColor, specular, diffuse)
  vec3.add(resultColor, resultColor, ambient)

  return vec3.scale(resultColor, resultColor, 255)
}

function phongFragmentShader(payload) {
  const ka = vec3.fromValues(.005, .005, .005)
  const kd = payload.color
  const ks = vec3.fromValues(.7937, .7937, .7937)

  const l1 = {
    position: vec3.fromValues(20, 20, 20),
    intensity: vec3.fromValues(500, 500, 500)
  }
  const l2 = {
    position: vec3.fromValues(-20, 20, 0),
    intensity: vec3.fromValues(500, 500, 500)
  }

  const lights = [l1, l2]
  const ambientLightintensity = vec3.fromValues(10, 10, 10)
  const p = 150

  const { cameraPosition, position, normal } = payload

  let resultColor = vec3.create()

  const ambient = vec3.mul(vec3.create(), ka, ambientLightintensity)
  const diffuse = vec3.create()
  const specular = vec3.create()

  for (const light of lights) {
    // TODO: For each light source in the code, calculate what the *ambient*, *diffuse*, and *specular*
    // components are. Then, accumulate that result on the *result_color* object.
    const r = vec3.dist(light.position, position)
    const l = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), light.position, position)) // 光源方向
    const energyReceived = Math.max(0, vec3.dot(l, normal))
    const attenuationFactor = vec3.scale(vec3.create(), light.intensity, 1 / Math.pow(r, 2))
    const ld = vec3.scale(
      vec3.create(),
      vec3.mul(
        vec3.create(),
        kd,
        attenuationFactor
      ),
      energyReceived
    )
    vec3.add(diffuse, diffuse, ld)

    const v = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), cameraPosition, position)) // 相机观察方向
    const h = vec3.normalize(vec3.create(), vec3.add(vec3.create(), v, l)) // 半程向量
    const eyeReceived = Math.pow(Math.max(0, vec3.dot(h, normal)), p)
    const ls = vec3.scale(
      vec3.create(),
      vec3.mul(
        vec3.create(),
        ks,
        attenuationFactor
      ),
      eyeReceived
    )
    vec3.add(specular, specular, ls)
  }

  vec3.add(resultColor, specular, diffuse)
  vec3.add(resultColor, resultColor, ambient)

  return vec3.scale(resultColor, resultColor, 255)
}

function bumpFragmentShader(payload) {
  const { normal: n, texture, textureCoords } = payload

  const kh = 0.2, kn = 0.1;

  // TODO: Implement displacement mapping here
  // Let n = normal = (x, y, z)
  // Vector t = (x*y/sqrt(x*x+z*z),sqrt(x*x+z*z),z*y/sqrt(x*x+z*z))
  // Vector b = n cross product t
  // Matrix TBN = [t b n]
  // dU = kh * kn * (h(u+1/w,v)-h(u,v))
  // dV = kh * kn * (h(u,v+1/h)-h(u,v))
  // Vector ln = (-dU, -dV, 1)
  // Position p = p + kn * n * h(u,v) <= 这一行在 displacement 中才会用到，对顶点进行位移
  // Normal n = normalize(TBN * ln)
  const [x, y, z] = n
  const [u, v] = textureCoords
  const { width: w, height: h } = texture
  const t = vec3.fromValues(x * y / Math.sqrt(x * x + z * z), Math.sqrt(x * x + z * z), z * y / Math.sqrt(x * x + z * z))
  const b = vec3.cross(vec3.create(), n, t)
  const TBN = mat3.fromValues(...t, ...b, ...n)
  const dU = kh * kn * (texture.h(u + 1 / w, v) - texture.h(u, v))
  const dV = kh * kn * (texture.h(u, v + 1 / h) - texture.h(u, v))
  const ln = vec3.fromValues(-dU, -dV, 1)
  const normal = vec3.normalize(vec3.create(), vec3.transformMat3(ln, ln, TBN))
  
  const resultColor = normal
  return vec3.scale(resultColor, resultColor, 255)
}

function displacementFragmentShader(payload) {
  const ka = vec3.fromValues(.005, .005, .005)
  const kd = payload.color
  const ks = vec3.fromValues(.7937, .7937, .7937)

  const l1 = {
    position: vec3.fromValues(20, 20, 20),
    intensity: vec3.fromValues(500, 500, 500)
  }
  const l2 = {
    position: vec3.fromValues(-20, 20, 0),
    intensity: vec3.fromValues(500, 500, 500)
  }

  const lights = [l1, l2]
  const ambientLightintensity = vec3.fromValues(10, 10, 10)

  const { cameraPosition, position, normal: n, texture, textureCoords } = payload

  const p = 150
  const kh = 0.2, kn = 0.1;

  // TODO: Implement displacement mapping here
  // Let n = normal = (x, y, z)
  // Vector t = (x*y/sqrt(x*x+z*z),sqrt(x*x+z*z),z*y/sqrt(x*x+z*z))
  // Vector b = n cross product t
  // Matrix TBN = [t b n]
  // dU = kh * kn * (h(u+1/w,v)-h(u,v))
  // dV = kh * kn * (h(u,v+1/h)-h(u,v))
  // Vector ln = (-dU, -dV, 1)
  // Position p = p + kn * n * h(u,v)
  // Normal n = normalize(TBN * ln)
  const [x, y, z] = n
  const [u, v] = textureCoords
  const { width: w, height: h } = texture
  const t = vec3.fromValues(x * y / Math.sqrt(x * x + z * z), Math.sqrt(x * x + z * z), z * y / Math.sqrt(x * x + z * z))
  const b = vec3.cross(vec3.create(), n, t)
  const TBN = mat3.fromValues(...t, ...b, ...n)
  const th = texture.h(u, v)
  const dU = kh * kn * (texture.h(u + 1 / w, v) - th)
  const dV = kh * kn * (texture.h(u, v + 1 / h) - th)
  const ln = vec3.fromValues(-dU, -dV, 1)
  vec3.add(position, position, vec3.scale(vec3.create(), n, th * kn))
  const normal = vec3.normalize(vec3.create(), vec3.transformMat3(ln, ln, TBN))

  const resultColor = vec3.create()
  const ambient = vec3.mul(vec3.create(), ka, ambientLightintensity)
  const diffuse = vec3.create()
  const specular = vec3.create()

  for (const light of lights) {
    // TODO: For each light source in the code, calculate what the *ambient*, *diffuse*, and *specular* 
    // components are. Then, accumulate that result on the *result_color* object. 
    const r = vec3.dist(light.position, position)
    const l = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), light.position, position)) // 光源方向
    const energyReceived = Math.max(0, vec3.dot(l, normal))
    const attenuationFactor = vec3.scale(vec3.create(), light.intensity, 1 / Math.pow(r, 2))
    const ld = vec3.scale(
      vec3.create(),
      vec3.mul(
        vec3.create(),
        kd,
        attenuationFactor
      ),
      energyReceived
    )
    vec3.add(diffuse, diffuse, ld)

    const v = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), cameraPosition, position)) // 相机观察方向
    const h = vec3.normalize(vec3.create(), vec3.add(vec3.create(), v, l)) // 半程向量
    const eyeReceived = Math.pow(Math.max(0, vec3.dot(h, normal)), p)
    const ls = vec3.scale(
      vec3.create(),
      vec3.mul(
        vec3.create(),
        ks,
        attenuationFactor
      ),
      eyeReceived
    )
    vec3.add(specular, specular, ls)
  }

  vec3.add(resultColor, specular, diffuse)
  vec3.add(resultColor, resultColor, ambient)

  return vec3.scale(resultColor, resultColor, 255)
}

let angle = 140
const gui = new GUI()
const guiParams = {
  shaderType: SHADERS.TEXTURE,
  bilinearInterpolation: false
}

const mesh = await loader('/models/spot/spot_triangulated_good.obj')

const textureImg = document.createElement('img')
const hmapImg = document.createElement('img')
textureImg.style.display = 'none'
hmapImg.style.display = 'none'
textureImg.src = '/models/spot/spot_texture.svg' // 这里为了查看双线性插值效果，使用了更低分辨率的贴图
hmapImg.src = '/models/spot/hmap.jpg'
document.body.append(textureImg)
document.body.append(hmapImg)
textureImg.onload = function() {
  render(angle, guiParams.shaderType)
}

window.addEventListener('keypress', function (e) {
  if (e.code === 'KeyA') {
    angle -= 10
    render(angle, guiParams.shaderType)
  }
  if (e.code === 'KeyD') {
    angle += 10
    render(angle, guiParams.shaderType)
  }
})

gui.add(guiParams, 'shaderType', SHADERS).onChange((type) => {
  render(angle, type)
})
gui.add(guiParams, 'bilinearInterpolation').onChange((value) => {
  if (value) {
    GETCOLOR = 'getColorBilinear'
  } else {
    GETCOLOR = 'getColor'
  }
  if (guiParams.shaderType === SHADERS.TEXTURE) render(angle, guiParams.shaderType)
})

async function render(angle = 0, shaderType = SHADERS.NORMAL) {
  const textures = mesh.textures
  const vertices = mesh.vertices
  const normals = mesh.vertexNormals
  const indices = mesh.indices

  const triangleList = []
  for (let i = 0; i < indices.length; i += 3) {
    const t = new Triangle()
    // 三角形的三个顶点索引
    const a = indices[i]
    const b = indices[i + 1]
    const c = indices[i + 2]

    t.setTextureCoords([
      vec3.fromValues(textures[a * 2 + 0], textures[a * 2 + 1]),
      vec3.fromValues(textures[b * 2 + 0], textures[b * 2 + 1]),
      vec3.fromValues(textures[c * 2 + 0], textures[c * 2 + 1]),
    ])
    t.setNormals([
      vec3.fromValues(normals[a * 3 + 0], normals[a * 3 + 1], normals[a * 3 + 2]),
      vec3.fromValues(normals[b * 3 + 0], normals[b * 3 + 1], normals[b * 3 + 2]),
      vec3.fromValues(normals[c * 3 + 0], normals[c * 3 + 1], normals[c * 3 + 2]),
    ])
    t.setVertexs([
      vec4.fromValues(vertices[a * 3 + 0], vertices[a * 3 + 1], vertices[a * 3 + 2], 1),
      vec4.fromValues(vertices[b * 3 + 0], vertices[b * 3 + 1], vertices[b * 3 + 2], 1),
      vec4.fromValues(vertices[c * 3 + 0], vertices[c * 3 + 1], vertices[c * 3 + 2], 1),
    ])
    triangleList.push(t)
  }

  let activeShader
  switch (shaderType) {
    case SHADERS.TEXTURE:
      activeShader = textureFragmentShader
      rasterizer.setTexture(new Texture(textureImg))
      break
    case SHADERS.NORMAL:
      activeShader = normalFragmentShader
      break
    case SHADERS.PHONG:
      activeShader = phongFragmentShader
      break
    case SHADERS.BUMP:
      activeShader = bumpFragmentShader
      rasterizer.setTexture(new Texture(hmapImg))
      break
    case SHADERS.DISPLACEMENT:
      activeShader = displacementFragmentShader
      rasterizer.setTexture(new Texture(hmapImg))
      break
  }

  rasterizer.setVertexShader(vertexShader)
  rasterizer.setFragmentShader(activeShader)

  rasterizer.clear({ colorBuffer: true, depthBuffer: true })
  rasterizer.setModel(getModelMatrix(vec3.fromValues(0, 1, 0), angle))
  rasterizer.setView(getViewMatrix(cameraPosition))
  rasterizer.setProjection(getProjectionMatrix(45, 1, 0.1, 50))
  rasterizer.draw(triangleList)

  canvasDraw(rasterizer.frameBuffers)
}

function canvasDraw(data) {
  const length = data.length
  const imageData = ctx.createImageData(width, height)
  for (var i = 0; i < length; i++) {
    var index = i * 4
    imageData.data[index] = data[i][0]
    imageData.data[index + 1] = data[i][1]
    imageData.data[index + 2] = data[i][2]
    imageData.data[index + 3] = 255 // alpha
  }
  ctx.putImageData(imageData, 0, 0)
}