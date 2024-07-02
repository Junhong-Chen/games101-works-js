import { vec3 } from "gl-matrix"
import { OBJ } from "webgl-obj-loader"
import GUI from "lil-gui"
import Scene from "./scene"
import Material from './material'
import Mesh from "./triangle"
import Renderer from "./renderer"
import BVHAccel from "./BVH"

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

const $ = document.querySelector.bind(document)
const canvasEl = $('#canvas-el')
const imgEl = $('#img-el')
const width = parseInt(canvasEl.getAttribute('width'))
const height = parseInt(canvasEl.getAttribute('height'))

const scene = new Scene({ width, height })
const renderer = new Renderer(canvasEl)

// 材质
const red = new Material({ type: Material.TYPE.DIFFUSE, kd: vec3.fromValues(0.63, 0.065, 0.05), roughness: 0.7, metalness: 0.3 })
const green = new Material({ type: Material.TYPE.DIFFUSE, kd: vec3.fromValues(0.14, 0.45, 0.091), roughness: 0.5, metalness: 0.5 })
const white = new Material({ type: Material.TYPE.DIFFUSE, kd: vec3.fromValues(0.725, 0.71, 0.68), roughness: 0.7, metalness: 0.3 })
const microfacet0 = new Material({ type: Material.TYPE.DIFFUSE, kd: vec3.fromValues(1, 0.77, 0.33), roughness: 0.2, metalness: 0.8 })
const microfacet1 = new Material({ type: Material.TYPE.DIFFUSE, kd: vec3.fromValues(0.95, 0.95, 0.95), roughness: 0.01, metalness: 1 })

const v1 = vec3.fromValues(0.747 + 0.058, 0.747 + 0.258, 0.747)
const v2 = vec3.fromValues(0.740 + 0.287, 0.740 + 0.160, 0.740)
const v3 = vec3.fromValues(0.737 + 0.642, 0.737 + 0.159, 0.737)
const lightEmission = vec3.create()
vec3.add(lightEmission, vec3.scale(vec3.create(), v1, 8), vec3.scale(vec3.create(), v2, 15.6))
vec3.add(lightEmission, lightEmission, vec3.scale(vec3.create(), v3, 18.4))
const lightMaterial = new Material({
  type: Material.TYPE.DIFFUSE,
  emission: lightEmission,
  kd: vec3.fromValues(0.65, 0.65, 0.65)
})

// 模型数据
const floorLoader = loader(`/${import.meta.env.VITE_BASE_PATH}/models/cornellbox/floor.obj`)
const shortboxLoader = loader(`/${import.meta.env.VITE_BASE_PATH}/models/cornellbox/shortbox.obj`)
const tallboxLoader = loader(`/${import.meta.env.VITE_BASE_PATH}/models/cornellbox/tallbox.obj`)
const leftLoader = loader(`/${import.meta.env.VITE_BASE_PATH}/models/cornellbox/left.obj`)
const rightLoader = loader(`/${import.meta.env.VITE_BASE_PATH}/models/cornellbox/right.obj`)
const lightLoader = loader(`/${import.meta.env.VITE_BASE_PATH}/models/cornellbox/light.obj`)

let floor, shortbox, tallbox, left, right, light

Promise.all([floorLoader, shortboxLoader, tallboxLoader, leftLoader, rightLoader, lightLoader]).then(models => {
  floor = new Mesh({ data: models[0], material: white })
  shortbox = new Mesh({ data: models[1], material: microfacet0 })
  tallbox = new Mesh({ data: models[2], material: microfacet1 })
  left = new Mesh({ data: models[3], material: red })
  right = new Mesh({ data: models[4], material: green })
  light = new Mesh({ data: models[5], material: lightMaterial })

  scene.add(floor)
  scene.add(shortbox)
  scene.add(tallbox)
  scene.add(left)
  scene.add(right)
  scene.add(light)
  scene.buildBVH({ splitMethod: BVHAccel.SplitMethod.SAH })
})

const gui = new GUI()
const guiParams = {
  render,
  material: Material.TYPE.DIFFUSE,
  spp: 1
}
let btn
function render(spp = guiParams.spp) {
  if (!btn._disabled) {
    btn.disable()
    imgEl.style.display = 'none'
    canvasEl.style.display = 'block'
    const start = new Date()
    setTimeout(() => {
      renderer.render(scene, spp)
      const end = new Date()

      const diff = (end - start) / 1000
      const hrs = Math.floor(diff / 3600)
      const mins = Math.floor((diff % 3600) / 60)
      const secs = diff % 60
      console.log(`Render complete: \nTime Taken: ${hrs} hrs, ${mins} mins, ${secs} secs\n`)
      setTimeout(() => {
        btn.enable()
      }, null)
    }, null)
  }
}

btn = gui.add(guiParams, 'render')
gui.add(guiParams, 'spp', 1, 1024, 1)
gui.add(guiParams, 'material', Material.TYPE).onFinishChange(material => {
  red.type = material
  green.type = material
  white.type = material
  microfacet0.type = material
  microfacet1.type = material
  if (material === Material.TYPE.DIFFUSE) {
    shortbox.material = white
    tallbox.material = white
  } else {
    shortbox.material = microfacet0
    tallbox.material = microfacet1
  }
  if (imgEl.style.display !== 'none') {
    imgEl.src = `/${import.meta.env.VITE_BASE_PATH}/images/cornellbox-${material.toLowerCase()}.png`
  }
})