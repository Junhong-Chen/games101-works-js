import { vec2, vec3 } from "gl-matrix"

/**
 * Class representing an intersection.
 */
export default class Intersection {
    /**
     * Create an intersection.
     */
    constructor() {
        this.happened = false
        this.coords = vec3.create()
        this.tcoords = vec3.create()
        this.normal = vec3.create()
        this.emit = vec3.create()
        this.uv = vec2.create()
        this.distance = Number.MAX_VALUE
        this.obj = null
        this.material = null
    }
}