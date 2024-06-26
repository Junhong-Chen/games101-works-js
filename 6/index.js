import { vec3 } from "gl-matrix"
import { OBJ } from "webgl-obj-loader"
import GUI from "lil-gui"
import Light from "./light"
import Scene from "./scene"
import { Mesh } from "./triangle"
import Renderer from "./renderer"

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
const bunnyData = await loader('/models/bunny/bunny.obj')
const bunny = new Mesh(bunnyData)

const scene = new Scene({ width, height })
const renderer = new Renderer(canvasEl)

const gui = new GUI()
const guiParams = {
  SAH: false,
}

scene.add(bunny)
scene.add(new Light({ position: vec3.fromValues(-20, 70, 20), intensity: 1 }))
scene.add(new Light({ position: vec3.fromValues(20, 70, 20), intensity: 1 }))

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

scene.buildBVH({ SAH: false })
render()

gui.add(guiParams, 'SAH').onChange(SAH => {
  renderer.clear(scene)

  scene.buildBVH({ SAH })

  setTimeout(() => render(), null)
})
