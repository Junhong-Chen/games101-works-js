import { mat3, vec3 } from 'gl-matrix'

// fromValues 方法的入参是按“列”顺序传入的，这里封装下改成按“行”传入
function Matrix3(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
  return mat3.fromValues(m00, m10, m20, m01, m11, m21, m02, m12, m22)
}

const p = [2, 1] // p 点
const angle = Math.PI / 4 // 45 degrees in radians
const cos = Math.cos(angle)
const sin = Math.sin(angle)

// 旋转矩阵
const R = new Matrix3(
  cos, -sin, 0,
  sin, cos, 0,
  0, 0, 1
)

// 平移矩阵
const T = new Matrix3(
  1, 0, 1,
  0, 1, 2,
  0, 0, 1
)

// 初始点的齐次坐标
const P = vec3.fromValues(...p, 1)

// 组合变换矩阵
// const M = new Matrix3(
//   cos, -sin, 1,
//   sin, cos, 2,
//   0, 0, 1
// )
const M = mat3.multiply(mat3.create(), T, R)
const pTransformed = vec3.transformMat3(vec3.create(), P, M)

console.log('变换后点的坐标:', pTransformed)
