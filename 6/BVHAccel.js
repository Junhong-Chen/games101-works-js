import Bounds3 from './bounds3'
import { Intersection } from './intersection'

export class BVHBuildNode {
  constructor() {
    this.bounds = new Bounds3()
    this.left = null
    this.right = null
    this.object = null
  }
}

export default class BVHAccel {
  #SAH

  constructor({ primitives, maxPrimsInNode = 1, splitMethod = 'NAIVE', SAH = false }) {
    this.maxPrimsInNode = Math.min(255, maxPrimsInNode)
    this.splitMethod = splitMethod
    // 初始化 primitives 列表
    this.primitives = primitives
    this.#SAH = SAH

    if (primitives.length === 0) {
      this.root = null
      return
    }

    const start = new Date()
    // 并调用 recursiveBuild 函数递归构建 BVH 树
    this.root = this.recursiveBuild(primitives)
    const end = new Date()

    const diff = (end - start) / 1000
    const hrs = Math.floor(diff / 3600)
    const mins = Math.floor((diff % 3600) / 60)
    const secs = diff % 60

    console.log(`BVH Generation complete: \nTime Taken: ${hrs} hrs, ${mins} mins, ${secs} secs\n`)
  }

  recursiveBuild(objects) {
    const node = new BVHBuildNode()

    // Compute bounds of all primitives in BVH node
    let bounds = new Bounds3()
    for (let obj of objects) {
      bounds = bounds.union(obj.getBounds())
    }

    if (objects.length === 1) {
      // Create leaf buildNode
      node.bounds = objects[0].getBounds()
      node.object = objects[0]
      return node
    } else if (objects.length === 2) {
      node.left = this.recursiveBuild([objects[0]])
      node.right = this.recursiveBuild([objects[1]])
      node.bounds = node.left.bounds.union(node.right.bounds)
      return node
    } else {
      let centroidBounds = new Bounds3()
      for (let obj of objects) {
        centroidBounds = centroidBounds.union(obj.getBounds().centroid())
      }

      const dim = centroidBounds.maxExtent()
      let index
      let B // 分割数量
            
      switch (dim) {
        case 0:
          objects.sort((a, b) => a.getBounds().centroid()[0] - b.getBounds().centroid()[0])
          break
        case 1:
          objects.sort((a, b) => a.getBounds().centroid()[1] - b.getBounds().centroid()[1])
          break
        case 2:
          objects.sort((a, b) => a.getBounds().centroid()[2] - b.getBounds().centroid()[2])
          break
      }

      if (this.#SAH) {
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

      } else {
        index = 1
        B = 2
      }

      const middle = Math.floor(objects.length * index / B)
      const leftShapes = objects.slice(0, middle)
      const rightShapes = objects.slice(middle)

      node.left = this.recursiveBuild(leftShapes)
      node.right = this.recursiveBuild(rightShapes)

      node.bounds = node.left.bounds.union(node.right.bounds)
    }

    return node
  }

  recursiveBuildForSAH(objects) {
    const node = new BVHBuildNode()

    // Compute bounds of all primitives in BVH node
    let bounds = new Bounds3()
    objects.forEach(object => bounds = bounds.union(bounds, object.getBounds()))

    if (objects.length === 1) {
      node.bounds = objects[0].getBounds()
      node.object = objects[0]
      node.left = null
      node.right = null
      return node
    } else if (objects.length === 2) {
      node.left = this.recursiveBuildForSAH([objects[0]])
      node.right = this.recursiveBuildForSAH([objects[1]])
      node.bounds = node.left.bounds.union(node.right.bounds)
      return node
    } else {
      let centroidBounds = new Bounds3()
      objects.forEach(object => centroidBounds = centroidBounds.union(object.getBounds().centroid()))

      const dim = centroidBounds.maxExtent() // 最优分割方案选择的轴
      const split = 12
      let minCost = Infinity
      let optIndex = 0 // 最优的分割线索引（分子）

      objects.sort((a, b) => a.getBounds().centroid()[dim] - b.getBounds().centroid()[dim])

      for (let i = 1; i < B; ++i) {
        const mid = Math.floor(objects.length * i / B)
        const leftshapes = objects.slice(0, mid)
        const rightshapes = objects.slice(mid)

        let leftBounds = new Bounds3()
        leftshapes.forEach(object => leftBounds = leftBounds.union(leftBounds, object.getBounds()))

        let rightBounds = new Bounds3()
        rightshapes.forEach(object => rightBounds = leftBounds.union(rightBounds, object.getBounds()))

        const SA = leftBounds.surfaceArea()
        const SB = rightBounds.surfaceArea()
        const cost = (leftshapes.length * SA + rightshapes.length * SB) / bounds.surfaceArea()

        if (cost < minCost) {
          minCost = cost
          optIndex = mid
        }
      }

      const leftshapes = objects.slice(0, optIndex)
      const rightshapes = objects.slice(optIndex)

      node.left = this.recursiveBuildForSAH(leftshapes)
      node.right = this.recursiveBuildForSAH(rightshapes)
      node.bounds = node.left.bounds.union(node.right.bounds)
    }

    return node
  }

  intersect(ray) {
    if (!this.root) {
      return new Intersection()
    }
    return this.getIntersection(this.root, ray)
  }

  getIntersection(node, ray) {
    // TODO: Traverse the BVH to find intersection
    const dirIsNeg = [ray.direction[0] > 0, ray.direction[1] > 0, ray.direction[2] > 0] // 射线方向是否为正

    if (!node.bounds.intersectP(ray, ray.directionInv, dirIsNeg)) { // 射线是否与节点的边界相交
      return new Intersection()
    }


    if (!node.left && !node.right) { // 如果当前节点是叶子节点
      return node.object.getIntersection(ray)
    }

    const hitLeft = this.getIntersection(node.left, ray)
    const hitRight = this.getIntersection(node.right, ray)

    return hitLeft.distance < hitRight.distance ? hitLeft : hitRight;
  }
}
