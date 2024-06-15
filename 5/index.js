import { vec2, vec3 } from 'gl-matrix'
import Scene from './scene'
import Sphere from './sphere'
import MeshTriangle from './triangle'
import Light from './light'
import Renderer from './renderer'
import { MaterialType } from './constant'

const width = parseInt(canvasEl.getAttribute('width'))
const height = parseInt(canvasEl.getAttribute('height'))

const scene = new Scene({width, height})
const renderer = new Renderer()

const sphere0 = new Sphere({
  center: vec3.fromValues(-1, 0, -12),
  radius: 2,
  diffuseColor: vec3.fromValues(.6, .7, .8),
  materialType: MaterialType.DIFFUSE_AND_GLOSSY,
})

const sphere1 = new Sphere({
  center: vec3.fromValues(0.5, -.5, -8),
  radius: 1.5,
  ior: 1.5,
  materialType: MaterialType.REFLECTION_AND_REFRACTION,
})

scene.add(sphere0)
scene.add(sphere1)

const vertices = [
  vec3.fromValues(-5,-3,-6),
  vec3.fromValues(5,-3,-6),
  vec3.fromValues(5,-3,-16),
  vec3.fromValues(-5,-3,-16),
]
const vertexIndices = [0, 1, 3, 1, 2, 3]
const stCoordinates = [
  vec2.fromValues(0, 0),
  vec2.fromValues(1, 0),
  vec2.fromValues(1, 1),
  vec2.fromValues(0, 1),
]
const mesh = new MeshTriangle({
  vertices,
  vertexIndices,
  numTriangles: 2,
  stCoordinates,
  materialType: MaterialType.DIFFUSE_AND_GLOSSY
})

scene.add(mesh)
scene.add(new Light({ position: vec3.fromValues(-20, 70, 20), intensity: .5 }))
scene.add(new Light({ position: vec3.fromValues(30, 50, -12), intensity: .5 }))

renderer.render(scene)