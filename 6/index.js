import { vec3 } from "gl-matrix"
import { OBJ } from "webgl-obj-loader"
import GUI from "lil-gui"
import Light from "./light"
import Scene from "./scene"
import { Mesh } from "./triangle"
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

const canvasEl = document.querySelector('#canvas-el')
const width = parseInt(canvasEl.getAttribute('width'))
const height = parseInt(canvasEl.getAttribute('height'))

const scene = new Scene({ width, height })
const renderer = new Renderer(canvasEl)

const gui = new GUI()
const guiParams = {
  splitMethod: BVHAccel.SplitMethod.NAIVE,
}

scene.add(new Light({ position: vec3.fromValues(-20, 70, 20), intensity: 1 }))
scene.add(new Light({ position: vec3.fromValues(20, 70, 20), intensity: 1 }))

loader('/models/bunny/bunny.obj').then(bunnyData => {
  const bunny = new Mesh(bunnyData)
  scene.add(bunny)
  scene.buildBVH({ splitMethod: BVHAccel.SplitMethod.NAIVE })
  render()
})

function render() {
  const start = new Date()
  renderer.render(scene)
  const end = new Date()
  
  const diff = (end - start) / 1000
  const hrs = Math.floor(diff / 3600)
  const mins = Math.floor((diff % 3600) / 60)
  const secs = diff % 60
  console.log(`Render complete: \nTime Taken: ${hrs} hrs, ${mins} mins, ${secs} secs\n`)
}

gui.add(guiParams, 'splitMethod', BVHAccel.SplitMethod).onChange(splitMethod => {
  renderer.clear(scene)

  scene.buildBVH({ splitMethod })

  setTimeout(() => render(), null)
})
