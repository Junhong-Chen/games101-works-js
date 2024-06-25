import { vec3 } from "gl-matrix"

export class Intersection {
  constructor() {
    this.happened = false
    this.coords = vec3.create()
    this.normal = vec3.create()
    this.distance = Number.MAX_VALUE
    this.obj = null
    this.m = null
  }
}