import Bounds3 from "./bounds3"
import Ray from "./ray"
import Intersection from "./intersection"
import Object3D from "./object"

/**
 * Build node structure for BVH.
 */
export class BVHBuildNode {
  /**
   * Constructor for BVHBuildNode.
   */
  constructor() {
    this.bounds = new Bounds3()
    this.left = null
    this.right = null
    this.object = null
    this.area = 0
    this.splitAxis = 0
    this.firstPrimOffset = 0
    this.nPrimitives = 0
  }
}

/**
 * BVH Accelerator class.
 */
export default class BVHAccel {
  /**
   * @enum {string}
   */
  static SplitMethod = {
    NAIVE: 'NAIVE',
    SAH: 'SAH'
  }

  /**
   * Constructor for BVHAccel.
   * @param {Object3D[]} primitives - List of primitives.
   * @param {number} [maxPrimsInNode=1] - Maximum number of primitives in a node.
   * @param {string} [splitMethod=BVHAccel.SplitMethod.NAIVE] - Method to split the nodes.
   */
  constructor({ primitives, maxPrimsInNode = 1, splitMethod = BVHAccel.SplitMethod.NAIVE }) {
    this.maxPrimsInNode = Math.min(255, maxPrimsInNode)
    this.splitMethod = splitMethod
    this.primitives = primitives

    if (!primitives.length) {
      this.root = null
    } else {
      // 并调用 recursiveBuild 函数递归构建 BVH 树
      this.root = this.recursiveBuild(primitives)
    }
  }

  /**
   * Get the world bound of the BVH.
   * @returns {Bounds3} - The bounding box of the world.
   */
  worldBound() {
    return this.root ? this.root.bounds : new Bounds3()
  }

  /**
   * Recursively build the BVH tree.
   * @param {Object3D[]} objects - List of objects to build the tree with.
   * @returns {BVHBuildNode} - The root node of the BVH tree.
   */
  recursiveBuild(objects) {
    const node = new BVHBuildNode()

    let bounds = new Bounds3()
    for (let obj of objects) {
      bounds = Bounds3.union(bounds, obj.getBounds())
    }

    if (objects.length === 1) {
      node.bounds = objects[0].getBounds()
      node.object = objects[0]
      node.left = null
      node.right = null
      node.area = objects[0].getArea()
      return node
    } else if (objects.length === 2) {
      node.left = this.recursiveBuild([objects[0]])
      node.right = this.recursiveBuild([objects[1]])

      node.bounds = Bounds3.union(node.left.bounds, node.right.bounds)
      node.area = node.left.area + node.right.area
      return node
    } else {
      let centroidBounds = new Bounds3()
      for (let obj of objects) {
        centroidBounds = Bounds3.union(centroidBounds, obj.getBounds().centroid())
      }
      const dim = centroidBounds.maxExtent()
      let index
      let B // 分割数量

      objects.sort((a, b) => a.getBounds().centroid()[dim] - b.getBounds().centroid()[dim])

      switch (this.splitMethod) {
        case BVHAccel.SplitMethod.SAH:
          B = 12
          const SN = centroidBounds.surfaceArea()
          let minCost = Infinity

          for (let i = 1; i < B; ++i) {
            const mid = Math.floor(objects.length * i / B)
            const leftshapes = objects.slice(0, mid)
            const rightshapes = objects.slice(mid)

            let leftBounds = new Bounds3()
            leftshapes.forEach(object => leftBounds = leftBounds.union(object.getBounds().centroid()))

            let rightBounds = new Bounds3()
            rightshapes.forEach(object => rightBounds = rightBounds.union(object.getBounds().centroid()))

            const SA = leftBounds.surfaceArea()
            const SB = rightBounds.surfaceArea()
            const cost = (leftshapes.length * SA + rightshapes.length * SB) / SN

            if (cost < minCost) {
              index = i
              minCost = cost
            }
          }
          break
        case BVHAccel.SplitMethod.NAIVE:
          index = 1
          B = 2
          break
      }

      const middle = Math.floor(objects.length * index / B)
      const leftshapes = objects.slice(0, middle)
      const rightshapes = objects.slice(middle)

      node.left = this.recursiveBuild(leftshapes)
      node.right = this.recursiveBuild(rightshapes)

      node.bounds = Bounds3.union(node.left.bounds, node.right.bounds)
      node.area = node.left.area + node.right.area
    }

    return node
  }

  /**
   * Intersect a ray with the BVH.
   * @param {Ray} ray - The ray to intersect.
   * @returns {Intersection} - The intersection result.
   */
  intersect(ray) {
    if (!this.root) {
      return new Intersection()
    }
    return this.getIntersection(this.root, ray)
  }

  /**
   * Get the intersection of a ray with a node.
   * @param {BVHBuildNode} node - The node to intersect.
   * @param {Ray} ray - The ray to intersect.
   * @returns {Intersection} - The intersection result.
   */
  getIntersection(node, ray) {
    // TODO: Traverse the BVH to find intersection
    const dirIsNeg = [ray.direction[0] > 0, ray.direction[1] > 0, ray.direction[2] > 0] // 射线方向是否为正

    if (!node.bounds.intersectP(ray, ray.directionInv, dirIsNeg)) { // 射线是否与包围盒相交
      return new Intersection()
    }

    if (!node.left && !node.right) { // 如果当前节点是叶子节点
      return node.object.getIntersection(ray)
    }

    const hitLeft = this.getIntersection(node.left, ray)
    const hitRight = this.getIntersection(node.right, ray)

    return hitLeft.distance < hitRight.distance ? hitLeft : hitRight
  }

  /**
   * Get a sample from the BVH node.
   * @param {BVHBuildNode} node - The node to sample from.
   * @param {number} p - The probability.
   * @param {Intersection} pos - The intersection result.
   * @param {number} pdf - The probability density function.
   * @returns {number} pdf
   */
  getSample(node, p, pos, pdf) {
    if (!node.left || !node.right) {
      pdf = node.object.sample(pos, pdf).pdf
      pdf *= node.area
    } else if (p < node.left.area) {
      pdf = this.getSample(node.left, p, pos, pdf)
    } else {
      pdf = this.getSample(node.right, p - node.left.area, pos, pdf)
    }
      
    return pdf
  }

  /**
   * Sample the BVH.
   * @param {Intersection} pos - The intersection result.
   * @param {number} pdf - The probability density function.
   * @returns {number} pdf
   */
  sample(pos, pdf) {
    const p = Math.sqrt(Math.random()) * this.root.area
    pdf = this.getSample(this.root, p, pos, pdf)
    pdf /= this.root.area
    return pdf
  }
}
