import { getPointsFromSvgPathData, pathDataToSvgPathData } from './utils.js'
import { flattenSvgPath } from '../flatten-svg-path.js'
import { pathDataToAbsolute } from './utils/path-data-to-absolute.js'

const degToRad = degrees => degrees * Math.PI / 180

const rotatePoint = (rotatingPoint, centerPoint, angle) => {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    // Translate point to origin
    const dx = rotatingPoint.x - centerPoint.x
    const dy = rotatingPoint.y - centerPoint.y

    // Rotate
    const xRot = dx * cos - dy * sin
    const yRot = dx * sin + dy * cos

    // Translate back
    return {
        x: xRot + centerPoint.x,
        y: yRot + centerPoint.y
    }
}

const scaleSize = (x, y, scale) => {
    return {
        x: x * scale,
        y: y * scale,
    }
}

const scalePoint = (point, centerPoint, scale) => {
    return {
        x: centerPoint.x + (point.x - centerPoint.x) * scale,
        y: centerPoint.y + (point.y - centerPoint.y) * scale,
    }
}

const translatePoint = (point, offsetX, offsetY) => {
    return {
        x: point.x + offsetX,
        y: point.y + offsetY
    }
}

const transformPathData = (pathData, transformFn) => {
    return pathData.map(({ type, values }) => {
        const typeUpperCased = type.toUpperCase()
        switch (typeUpperCased) {
            case 'M': case 'L': case 'T': {
                const [endX, endY] = values
                const endPoint = transformFn(endX, endY, 0, 0)
                return { type, values: [endPoint.x, endPoint.y] }
            }
            case 'H': {
                const [endX] = values
                const endPoint = transformFn(endX, 0, 0, 0)
                return { type, values: [endPoint.x] }
            }
            case 'V': {
                const [endY] = values
                const endPoint = transformFn(0, endY, 0, 0)
                return { type, values: [endPoint.y] }
            }
            case 'C': {
                const [controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y, endX, endY] = values
                const controlPoint1 = transformFn(controlPoint1X, controlPoint1Y, 0, 0)
                const controlPoint2 = transformFn(controlPoint2X, controlPoint2Y, 0, 0)
                const endPoint = transformFn(endX, endY, 0, 0)
                return { type, values: [controlPoint1.x, controlPoint1.y, controlPoint2.x, controlPoint2.y, endPoint.x, endPoint.y] }
            }
            case 'S': case 'Q': {
                const [controlPointX, controlPointY, endX, endY] = values
                const controlPoint = transformFn(controlPointX, controlPointY, 0, 0)
                const endPoint = transformFn(endX, endY, 0, 0)
                return { type, values: [controlPoint.x, controlPoint.y, endPoint.x, endPoint.y] }
            }
            case 'A': {
                const [radiusX, radiusY, xAxisRotation, largeArcFlag, sweepFlag, endX, endY] = values
                const radiusSize = transformFn(0, 0, radiusX, radiusY)
                const endPoint = transformFn(endX, endY, 0, 0)
                return { type, values: [radiusSize.sizeX, radiusSize.sizeY, xAxisRotation, largeArcFlag, sweepFlag, endPoint.x, endPoint.y] }
            }
            case 'Z': default: {
                return { type, values }
            }
        }
    })
}

const getBoundingBox = (pathData) => {
    let minX = Number.MAX_VALUE
    let minY = Number.MAX_VALUE
    let maxX = -Number.MAX_VALUE
    let maxY = -Number.MAX_VALUE

    for (const { type, values } of pathData) {
        switch (type) {
            case 'M': case 'L': case 'T': {
                const [endX, endY] = values
                minX = Math.min(minX, endX)
                minY = Math.min(minY, endY)
                maxX = Math.max(maxX, endX)
                maxY = Math.max(maxY, endY)
                break
            }
            case 'H': {
                const [endX] = values
                minX = Math.min(minX, endX)
                maxX = Math.max(maxX, endX)
                break
            }
            case 'V': {
                const [endY] = values
                minY = Math.min(minY, endY)
                maxY = Math.max(maxY, endY)
                break
            }
            case 'C': {
                const [controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y, endX, endY] = values
                minX = Math.min(minX, controlPoint1X, controlPoint2X, endX)
                minY = Math.min(minY, controlPoint1Y, controlPoint2Y, endY)
                maxX = Math.max(maxX, controlPoint1X, controlPoint2X, endX)
                maxY = Math.max(maxY, controlPoint1Y, controlPoint2Y, endY)
                break
            }
            case 'S': case 'Q': {
                const [controlPointX, controlPointY, endX, endY] = values
                minX = Math.min(minX, controlPointX, endX)
                minY = Math.min(minY, controlPointY, endY)
                maxX = Math.max(maxX, controlPointX, endX)
                maxY = Math.max(maxY, controlPointY, endY)
                break
            }
            case 'A': {
                const [radiusX, radiusY, xAxisRotation, largeArcFlag, sweepFlag, endX, endY] = values
                minX = Math.min(minX, endX)
                minY = Math.min(minY, endY)
                maxX = Math.max(maxX, endX)
                maxY = Math.max(maxY, endY)
                break
            }
        }
    }

    return { minX, minY, maxX, maxY }
}

// const rotatePoint = (x, y, cx, cy, angle) => {
//     // const angle = angleDegrees * Math.PI / 180
//     const cos = Math.cos(angle)
//     const sin = Math.sin(angle)
//
//     // Translate point to origin
//     const dx = x - cx
//     const dy = y - cy
//
//     // Rotate
//     const xRot = dx * cos - dy * sin
//     const yRot = dx * sin + dy * cos
//
//     // Translate back
//     return {
//         x: xRot + cx,
//         y: yRot + cy
//     }
// }

const svgEl = document.querySelector('#svg')

const stepSizeEl = document.querySelector('#step-size')
const stepSizeInputEl = stepSizeEl.querySelector('#step-size-input')
const stepSizeOutputEl = stepSizeEl.querySelector('#step-size-output')

let stepSize = Number(stepSizeInputEl.value)
stepSizeOutputEl.value = stepSize

const offsetXEl = document.querySelector('#offset-x')
const offsetXInputEl = offsetXEl.querySelector('#offset-x-input')
const offsetXOutputEl = offsetXEl.querySelector('#offset-x-output')

let offsetX = Number(offsetXInputEl.value)
offsetXOutputEl.value = offsetX

const offsetYEl = document.querySelector('#offset-y')
const offsetYInputEl = offsetYEl.querySelector('#offset-y-input')
const offsetYOutputEl = offsetYEl.querySelector('#offset-y-output')

let offsetY = Number(offsetYInputEl.value)
offsetYOutputEl.value = offsetY

const scaleEl = document.querySelector('#scale')
const scaleInputEl = scaleEl.querySelector('#scale-input')
const scaleOutputEl = scaleEl.querySelector('#scale-output')

let scale = Number(scaleInputEl.value)
scaleOutputEl.value = scale

const rotateEl = document.querySelector('#rotate')
const rotateInputEl = rotateEl.querySelector('#rotate-input')
const rotateOutputEl = rotateEl.querySelector('#rotate-output')

let rotate = Number(rotateInputEl.value)
rotateOutputEl.value = rotate

const { clientWidth: svgWidth, clientHeight: svgHeight } = svgEl

const padding = 20
const centerPoint = { x: svgWidth / 2, y: svgHeight / 2 }

// const originalPathData = pathDataToAbsolute([
//     { type: 'M', values: [114, 108.89] },
//     { type: 'l', values: [-10.22, -8.39] },
//     { type: 'l', values: [-5, 1.23] },
//     { type: 'l', values: [5.68, 4.39] },
//     { type: 'l', values: [-4.4, 4.46] },
//     { type: 'l', values: [-6.8, -7.48] },
//     { type: 'l', values: [-12.34, 3.06] },
//     { type: 'L', values: [90, 114.72] },
//     { type: 'l', values: [7.5, -2.43] },
//     { type: 'l', values: [2, 5.3] },
//     { type: 'l', values: [-5.41, 1] },
//     { type: 'l', values: [4.21, 4] },
//     { type: 'l', values: [12.78, -2.73] },
//     { type: 'l', values: [4.58, 7.81] },
//     { type: 'l', values: [-2.8, 13.94] },
//     { type: 'L', values: [99, 144.4] },
//     { type: 'l', values: [-8.23, -4.89] },
//     { type: 'l', values: [2.79, -13] },
//     { type: 'l', values: [-3.79, -3.87] },
//     { type: 'l', values: [-1, 5.92] },
//     { type: 'l', values: [-5, -1.27] },
//     { type: 'L', values: [86, 118.77] },
//     { type: 'l', values: [-8.68, -8.88] },
//     { type: 'l', values: [-2.45, 10.63] },
//     { type: 'l', values: [5.74, 6.77] },
//     { type: 'l', values: [-3.13, 4.35] },
//     { type: 'l', values: [-4, -5.17] },
//     { type: 'L', values: [72, 132.72] },
//     { type: 'l', values: [8.85, 9.91] },
//     { type: 'l', values: [-4.45, 7.76] },
//     { type: 'L', values: [63, 154.94] },
//     { type: 'l', values: [-9.41, -10.68] },
//     { type: 'l', values: [-.28, -9.48] },
//     { type: 'l', values: [13, -4.15] },
//     { type: 'l', values: [1.47, -5.35] },
//     { type: 'l', values: [-6.1, 2.61] },
//     { type: 'l', values: [-.69, -5.23] },
//     { type: 'l', values: [8.44, -3.41] },
//     { type: 'l', values: [2.93, -10.72] },
//     { type: 'l', values: [-10.2, 3] },
//     { type: 'L', values: [59, 120.16] },
//     { type: 'l', values: [-5.41, -.94] },
//     { type: 'L', values: [56, 113.31] },
//     { type: 'l', values: [-6.84, 2] },
//     { type: 'l', values: [-4.35, 12.63] },
//     { type: 'l', values: [-8.81, .33] },
//     { type: 'l', values: [-10.68, -9.39] },
//     { type: 'l', values: [4.55, -13.48] },
//     { type: 'l', values: [8.46, -4.63] },
//     { type: 'l', values: [9.43, 8.56] },
//     { type: 'l', values: [6.47, -1.6] },
//     { type: 'L', values: [50.1, 104] },
//     { type: 'l', values: [4.55, -2.87] },
//     { type: 'l', values: [5.49, 5.19] },
//     { type: 'l', values: [10.67, -2.65] },
//     { type: 'l', values: [-8.52, -7.7] },
//     { type: 'l', values: [-10, 1.59] },
//     { type: 'l', values: [-1.24, -6] },
//     { type: 'l', values: [6, -.37] },
//     { type: 'l', values: [-4.33, -3.91] },
//     { type: 'L', values: [41, 89.28] },
//     { type: 'l', values: [-5.37, -7] },
//     { type: 'l', values: [3.62, -12.87] },
//     { type: 'L', values: [52.4, 65.5] },
//     { type: 'L', values: [60.12, 70] },
//     { type: 'L', values: [57.81, 83] },
//     { type: 'l', values: [3.76, 3.81] },
//     { type: 'l', values: [.53, -5.58] },
//     { type: 'l', values: [6.1, .81] },
//     { type: 'L', values: [66.69, 92] },
//     { type: 'L', values: [74.5, 99.9] },
//     { type: 'L', values: [77, 89.11] },
//     { type: 'l', values: [-5.87, -6.84] },
//     { type: 'l', values: [3.44, -4.8] },
//     { type: 'l', values: [3.8, 5.65] },
//     { type: 'L', values: [80, 75.77] },
//     { type: 'l', values: [-7.83, -9.12] },
//     { type: 'l', values: [3.55, -8.29] },
//     { type: 'l', values: [13, -3.3] },
//     { type: 'l', values: [9.91, 9.43] },
//     { type: 'L', values: [99, 73.2] },
//     { type: 'L', values: [86.27, 77.85] },
//     { type: 'l', values: [-2, 7] },
//     { type: 'l', values: [6.15, -3] },
//     { type: 'l', values: [1.83, 5.62] },
//     { type: 'l', values: [-9.65, 3.11] },
//     { type: 'l', values: [-3.08, 10.64] },
//     { type: 'l', values: [12.14, -3.81] },
//     { type: 'l', values: [.84, -7.4] },
//     { type: 'l', values: [6.35, .64] },
//     { type: 'l', values: [-1.42, 5] },
//     { type: 'l', values: [5, -1.57] },
//     { type: 'l', values: [4.07, -11.46] },
//     { type: 'l', values: [8.87, -1] },
//     { type: 'l', values: [9.34, 9.57] },
//     { type: 'l', values: [-3.21, 13.3] },
//     { type: 'Z', values: [] },
//     { type: 'm', values: [-12.24, 29.26] },
//     { type: 'l', values: [5.76, -1.81] },
//     { type: 'l', values: [1.69, -5.8] },
//     { type: 'l', values: [-1.71, -3.07] },
//     { type: 'L', values: [100, 129.09] },
//     { type: 'l', values: [-1.59, 7] },
//     { type: 'Z', values: [] },
//     { type: 'M', values: [67.6, 137.8] },
//     { type: 'L', values: [60.7, 140] },
//     { type: 'l', values: [-.39, 3.67] },
//     { type: 'l', values: [4.75, 4.3] },
//     { type: 'l', values: [6.53, -1.46] },
//     { type: 'l', values: [1.15, -3] },
//     { type: 'Z', values: [] },
//     { type: 'm', values: [-30, -28.62] },
//     { type: 'l', values: [-3.77, 2.07] },
//     { type: 'l', values: [-.95, 5.69] },
//     { type: 'l', values: [4.27, 4.62] },
//     { type: 'l', values: [3.43, -.2] },
//     { type: 'l', values: [2.32, -7.28] },
//     { type: 'Z', values: [] },
//     { type: 'M', values: [50.2, 72] },
//     { type: 'l', values: [-5.83, 2.16] },
//     { type: 'L', values: [41.76, 79.7] },
//     { type: 'l', values: [2.67, 2.61] },
//     { type: 'L', values: [51.53, 81] },
//     { type: 'l', values: [1.34, -7.48] },
//     { type: 'Z', values: [] },
//     { type: 'm', values: [34.67, -.29] },
//     { type: 'L', values: [92, 69.11] },
//     { type: 'L', values: [92.23, 66] },
//     { type: 'l', values: [-5, -3.94] },
//     { type: 'l', values: [-6.07, .76] },
//     { type: 'l', values: [-1, 3.37] },
//     { type: 'Z', values: [] },
//     { type: 'm', values: [29.61, 17.54] },
//     { type: 'l', values: [-3.64, .51] },
//     { type: 'l', values: [-2.4, 6.82] },
//     { type: 'l', values: [5.82, 4.89] },
//     { type: 'l', values: [3.44, -1.74] },
//     { type: 'l', values: [.24, -5.94] },
//     { type: 'Z', values: [] },
// ])

const originalPathData = pathDataToAbsolute([
    { type: 'M', values: [112.54, 110.26] },
    { type: 'l', values: [3.33, 5.44] },
    { type: 'c', values: [-4.79, 5.7, -14.21, 8.83, -26.72, 2.4] },
    { type: 'L', values: [87, 120] },
    { type: 'c', values: [8.23, 11.7, 6.31, 21, 1.31, 27.3] },
    { type: 'l', values: [-6.19, -2.93] },
    { type: 'L', values: [78, 149.21] },
    { type: 'c', values: [-6.92, -2.81, -12.82, -10.83, -10.52, -24.78] },
    { type: 'l', values: [-2.63, -1.13] },
    { type: 'c', values: [-8.55, 11.26, -18, 12.29, -25.41, 9.48] },
    { type: 'l', values: [.86, -6.79] },
    { type: 'l', values: [-5.89, -2.45] },
    { type: 'c', values: [.53, -7.38, 6.24, -15.39, 19.94, -17.6] },
    { type: 'l', values: [0, -3.14] },
    { type: 'c', values: [-12.82, -4.7, -16.56, -13.19, -16.2, -21] },
    { type: 'l', values: [6.73, -1.27] },
    { type: 'l', values: [.5, -6.37] },
    { type: 'C', values: [52.84, 72.31, 62.71, 75.58, 69, 89.28] },
    { type: 'l', values: [2.2, -.7] },
    { type: 'c', values: [-0.08, -14.94, 7.09, -21.63, 15, -23.79] },
    { type: 'l', values: [3.29, 6] },
    { type: 'l', values: [6.21, -1.49] },
    { type: 'c', values: [4.07, 6.55, 4, 17, -7.06, 27.19] },
    { type: 'l', values: [1, 2] },
    { type: 'c', values: [14.4, -4.9, 23.07, -.09, 27.6, 6.79] },
    { type: 'Z', values: [] },
    { type: 'm', values: [-32.18, -3.42] },
    { type: 'l', values: [9.09, -2.12] },
    { type: 'l', values: [-1, -3.63] },
    { type: 'l', values: [-9, 1.9] },
    { type: 'l', values: [7.66, -15] },
    { type: 'l', values: [-3.77, -2.24] },
    { type: 'l', values: [-7.87, 15.15] },
    { type: 'l', values: [1, -10.08] },
    { type: 'l', values: [-3.89, .24] },
    { type: 'L', values: [71, 100.83] },
    { type: 'l', values: [-9.8, -11.61] },
    { type: 'L', values: [58, 92.39] },
    { type: 'l', values: [9.78, 11.84] },
    { type: 'l', values: [-9.18, -4.07] },
    { type: 'L', values: [57, 103.88] },
    { type: 'l', values: [8.86, 3.42] },
    { type: 'l', values: [-14, 4.93] },
    { type: 'l', values: [1.66, 4.47] },
    { type: 'l', values: [14.33, -4.89] },
    { type: 'l', values: [-6.23, 6.06] },
    { type: 'L', values: [64, 121] },
    { type: 'l', values: [7.41, -5.78] },
    { type: 'L', values: [73.25, 129] },
    { type: 'l', values: [5.16, -1.08] },
    { type: 'l', values: [-2.17, -13.77] },
    { type: 'l', values: [5.07, 7] },
    { type: 'l', values: [3.45, -3.1] },
    { type: 'l', values: [-5.23, -7] },
    { type: 'L', values: [94, 113.84] },
    { type: 'l', values: [.65, -4] },
    { type: 'Z', values: [] },
    { type: 'M', values: [96.28, 93.09] },
    { type: 'a', values: [34.37, 34.37, 0, 0, 0, 6, -11.06] },
    { type: 'A', values: [83, 83, 0, 0, 1, 113.7, 83] },
    { type: 'A', values: [76.14, 76.14, 0, 0, 1, 109, 93.35] },
    { type: 'A', values: [32.66, 32.66, 0, 0, 0, 96.28, 93.09] },
    { type: 'Z', values: [] },
    { type: 'M', values: [59.54, 71.86] },
    { type: 'A', values: [81.77, 81.77, 0, 0, 1, 64, 61.19] },
    { type: 'a', values: [75.24, 75.24, 0, 0, 1, 8.31, 7.53] },
    { type: 'a', values: [33.47, 33.47, 0, 0, 0, -4, 12.09] },
    { type: 'A', values: [33.63, 33.63, 0, 0, 0, 59.54, 71.86] },
    { type: 'Z', values: [] },
    { type: 'M', values: [47.35, 103.63] },
    { type: 'a', values: [32, 32, 0, 0, 0, -10.91, 6] },
    { type: 'a', values: [83.92, 83.92, 0, 0, 1, -8.81, -7.55] },
    { type: 'a', values: [73.59, 73.59, 0, 0, 1, 10.16, -5.77] },
    { type: 'A', values: [32.67, 32.67, 0, 0, 0, 47.35, 103.63] },
    { type: 'Z', values: [] },
    { type: 'M', values: [65.18, 142.7] },
    { type: 'a', values: [82.08, 82.08, 0, 0, 1, -10.12, 6.21] },
    { type: 'a', values: [72.8, 72.8, 0, 0, 1, -2.34, -11.38] },
    { type: 'a', values: [30.76, 30.76, 0, 0, 0, 10.22, -6.44] },
    { type: 'A', values: [32, 32, 0, 0, 0, 65.18, 142.7] },
    { type: 'Z', values: [] },
    { type: 'm', values: [40.55, -16.83] },
    { type: 'a', values: [82.35, 82.35, 0, 0, 1, 2.63, 11.1] },
    { type: 'a', values: [75.2, 75.2, 0, 0, 1, -11.53, -1.29] },
    { type: 'A', values: [31.28, 31.28, 0, 0, 0, 93.68, 124] },
    { type: 'A', values: [33.21, 33.21, 0, 0, 0, 105.73, 125.87] },
    { type: 'Z', values: [] },
])

// Улитка
// M111.67,147.2l-35.92.17c5.91-4.59,8.67-11.25,7-22.06,18.92-2.65,29.49-28.23,28.71-57.27l4.9.1a98.22,98.22,0,0,1,0,29.35c-.73,4.11,4.87,4.61,6.19,1.1,1.75-4.66,4.75-20.41,4.75-30l5.54-.16c0,33.8-8.49,57.93-22.22,72.47ZM59.86,110.74c-9.37,2.56-12.51,10.45-10.73,17.47,2.16,8.57,8.74,10.28,14,8.79,4.3-1.23,6.49-5.37,5.28-10.19s-5.13-5-7.27-4.38c-5.11,1.45-.73,7.9,2,3.89,1.3.17,3.07,5.59-.84,6.7-2.79.8-7.25.07-8.79-6-1.38-5.49,2.14-10.11,7.76-11.72,7-2,14.57,3.34,16.31,10.24,3.61,14.32-8.06,23.26-20.06,22.7L21,147.67l17.61-11.79A30.53,30.53,0,0,1,36,128.44c-8.89-41,50.53-51.3,62.31-19.71-4.33,6.66-10.15,10.5-17,11.68C77.6,112.15,67.81,108.57,59.86,110.74Z

// const originalPathData = [
//     ...range(0, Math.PI * 2, (Math.PI * 2) / 9, angle => {
//         const rotate = point => rotatePoint(point, centerPoint, angle)
//
//         const centerP = rotate({ x: centerPoint.x, y: centerPoint.y - 20 })
//         const p1 = rotate({ x: centerPoint.x, y: centerPoint.y - 200 })
//         const p1Control = rotate({ x: centerPoint.x - 60, y: centerPoint.y - 200 })
//         const p2 = rotate({ x: centerPoint.x + 10, y: centerPoint.y - 200 })
//         const p2Control = rotate({ x: centerPoint.x + 60, y: centerPoint.y - 200 })
//
//         return [
//             { type: 'M', values: [centerP.x, centerP.y] },
//             { type: 'Q', values: [p1Control.x, p1Control.y, p1.x, p1.y] },
//             { type: 'Q', values: [p2Control.x, p2Control.y, centerP.x, centerP.y] },
//         ]
//     }).flat(Infinity)
// ]

const render = () => {
    // const pathData = originalPathData

    const boundingBox = getBoundingBox(originalPathData)

    const getBoundingBoxCenterPoint = boundingBox => ({
        x: boundingBox.minX + (boundingBox.maxX - boundingBox.minX) / 2,
        y: boundingBox.minY + (boundingBox.maxY - boundingBox.minY) / 2,
    })

    const pathData = transformPathData(originalPathData, (x, y, sizeX, sizeY) => {
        const translatedPoint = translatePoint({ x, y }, offsetX, offsetY)

        const rotatedMinPoint = translatePoint({ x: boundingBox.minX, y: boundingBox.minY }, offsetX, offsetY)
        const rotatedMaxPoint = translatePoint({ x: boundingBox.maxX, y: boundingBox.maxY }, offsetX, offsetY)
        const rotatedBoundingBox = {
            minX: rotatedMinPoint.x,
            minY: rotatedMinPoint.y,
            maxX: rotatedMaxPoint.x,
            maxY: rotatedMaxPoint.y,
        }
        const rotatedPoint = rotatePoint(translatedPoint, getBoundingBoxCenterPoint(rotatedBoundingBox), degToRad(rotate))
        const scaledPoint = scalePoint(rotatedPoint, getBoundingBoxCenterPoint(rotatedBoundingBox), scale)
        const scaledSize = scaleSize(sizeX, sizeY, scale)

        return {
            x: scaledPoint.x,
            y: scaledPoint.y,
            sizeX: scaledSize.x,
            sizeY: scaledSize.y
        }
    })

    // console.log('pathData', pathData)

    const svgPathData = pathDataToSvgPathData(pathData)

    // console.time('render')
    const segmentsPathData = flattenSvgPath(pathData, stepSize)
    // console.timeEnd('render')

    const points = getPointsFromSvgPathData(segmentsPathData)

    // console.log('points', points)

    const segmentsSvgPathData = pathDataToSvgPathData(segmentsPathData)

    // console.log('segmentsSvgPathData', segmentsSvgPathData)

    svgEl.innerHTML = `
    <rect
        x="${boundingBox.minX}"
        y="${boundingBox.minY}"
        width="${boundingBox.maxX - boundingBox.minX}"
        height="${boundingBox.maxY - boundingBox.minY}"
        stroke-width="1"
        stroke="#ddd"
        fill="none"
    />
    <path
        d="${svgPathData}"
        stroke="#fefefe"
        stroke-width="0"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill-rule="evenodd"
        style="fill: color-mix(in srgb, tan 30%, white)"
    />
    <path d="${segmentsSvgPathData}" stroke="#000" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    ${points.map(({ x, y }) => `
        <circle cx="${x}" cy="${y}" r="1" fill="#000" stroke="none" stroke-width="1" />
    `).join('')}
`
}

render()

stepSizeInputEl.addEventListener('input', e => {
    stepSize = e.target.value
    stepSizeOutputEl.value = stepSize
    render()
})

offsetXInputEl.addEventListener('input', e => {
    offsetX = Number(e.target.value)
    offsetXOutputEl.value = offsetX
    render()
})

offsetYInputEl.addEventListener('input', e => {
    offsetY = Number(e.target.value)
    offsetYOutputEl.value = offsetY
    render()
})

scaleInputEl.addEventListener('input', e => {
    scale = Number(e.target.value)
    scaleOutputEl.value = scale
    render()
})

rotateInputEl.addEventListener('input', e => {
    rotate = Number(e.target.value)
    rotateOutputEl.value = rotate
    render()
})
