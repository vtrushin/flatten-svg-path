import { pathDataToSvgPathData, polygonPathToSvgPath } from './utils.js'
import { flattenCubicBezier} from '../flatten-cubic-bezier.js'
import { flattenQuadraticBezier} from '../flatten-quadratic-bezier.js'
import { flattenLine } from '../flatten-line.js'
import { flattenArc, svgArcToEllipse } from '../flatten-arc.js'

const bezierCurveEl = document.querySelector('#bezier')
const bezierLineGroupEl = bezierCurveEl.querySelector('#group')
const bezierHandlersEl = bezierCurveEl.querySelector('#handlers')

const stepSizeEl = document.querySelector('#step-size')
const stepSizeInputEl = stepSizeEl.querySelector('#step-size-input')
const stepSizeOutputEl = stepSizeEl.querySelector('#step-size-output')

const curveTypesEl = document.querySelector('#curve-types')
const curveTypeEls =  curveTypesEl.querySelectorAll('[name="curve-type"]')

const width = Number(bezierCurveEl.getAttribute('width'))
const height = Number(bezierCurveEl.getAttribute('height'))

let stepSize = Number(stepSizeInputEl.value)
stepSizeOutputEl.value = stepSize

const padding = 10

// const startPoint = { x: 100, y: 200 }
// const radiusX = 200
// const radiusY = 75
// const rotation = -20
// const largeArcFlag = 0
// const sweepFlag = 0
// const endPoint = { x: 500, y: 250 }

const startPoint = { x: 150, y: 250 }
const radiusX = 50
const radiusY = 50
const rotation = 0
const largeArcFlag = 1
const sweepFlag = 1
const endPoint = { x: 200, y: 200 }

// 50, 50, 0, 1, 1, 200, 200

const points = [
    startPoint,
    radiusX,
    radiusY,
    rotation,
    largeArcFlag,
    sweepFlag,
    endPoint
]

// const p0 = { x: padding, y: height - padding }
// const p1 = { x: width - padding, y: height - padding }
// const points = [p0, p1]

// const p0 = { x: padding, y: height - padding }
// const p1 = { x: (width - padding * 2) / 2, y: padding }
// const p2 = { x: width - padding, y: height - padding }
// const points = [p0, p1, p2]

// const p0 = { x: padding, y: height - padding }
// const p1 = { x: (width - padding * 2) * 1/3, y: padding }
// const p2 = { x: (width - padding * 2) * 2/3, y: padding }
// const p3 = { x: width - padding, y: height - padding }
// const points = [p0, p1, p2, p3]

const line = (x1, y1, x2, y2) => `
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="tan" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
`

const render = () => {
    const pathData = [
        { type: 'M', values: [startPoint.x, startPoint.y] },
        { type: 'A', values: [radiusX, radiusY, rotation, largeArcFlag, sweepFlag, endPoint.x, endPoint.y] },
    ]

    const svgPathData = pathDataToSvgPathData(pathData)

    console.log('svgPathData', svgPathData)

    // const pathData = [
    //     { type: 'M', values: [p0.x, p0.y] },
    //     { type: 'L', values: [p1.x, p1.y] },
    // ]
    //
    // const svgPathData = pathDataToSvgPathData(pathData)
    // const balancedPoints = [...flattenLine(p0, p1, stepSize), points.at(-1)]
    // const segmentsPathData = polygonPathToSvgPath(balancedPoints)

    // const pathData = [
    //     { type: 'M', values: [p0.x, p0.y] },
    //     { type: 'Q', values: [p1.x, p1.y, p2.x, p2.y] },
    // ]
    //
    // const svgPathData = pathDataToSvgPathData(pathData)
    // const balancedPoints = [...flattenQuadraticBezier(p0, p1, p2, stepSize), points.at(-1)]
    // const segmentsPathData = polygonPathToSvgPath(balancedPoints)

    // const pathData = [
    //     { type: 'M', values: [p0.x, p0.y] },
    //     { type: 'C', values: [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y,] },
    // ]

    // const svgPathData = pathDataToSvgPathData(pathData)
    // const balancedPoints = [...flattenCubicBezier(...points, stepSize), points.at(-1)]
    // const segmentsPathData = polygonPathToSvgPath(balancedPoints)

    //

    const ellipse = svgArcToEllipse(
        startPoint.x,
        startPoint.y,
        radiusX,
        radiusY,
        rotation,
        largeArcFlag,
        sweepFlag,
        endPoint.x,
        endPoint.y
    )

    const balancedPoints = flattenArc(
        startPoint,
        radiusX,
        radiusY,
        rotation,
        largeArcFlag,
        sweepFlag,
        endPoint,
        stepSize,
    )

    console.log('balancedPoints', balancedPoints)

    bezierLineGroupEl.innerHTML = `
        <ellipse cx="${ellipse.centerX}" cy="${ellipse.centerY}" rx="${ellipse.radiusX}" ry="${ellipse.radiusY}" transform="rotate(${ellipse.rotation * 180 / Math.PI} ${ellipse.centerX} ${ellipse.centerY})" stroke="tan" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <path d="${svgPathData}" stroke="#ddd" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        ${balancedPoints.map(({ x, y }) => `
            <circle cx="${x}" cy="${y}" r="1.5" fill="#000" stroke="none" stroke-width="1" />
        `).join('')}
    `

    // bezierLineGroupEl.innerHTML = `
    //     <line x1="${p0.x}" y1="${p0.y}" x2="${p1.x}" y2="${p1.y}" stroke="tan" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    //     <line x1="${p2.x}" y1="${p2.y}" x2="${p1.x}" y2="${p1.y}" stroke="tan" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    //
    //     <path d="${svgPathData}" stroke="#ddd" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    //     <path d="${segmentsPathData}" stroke="#000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    //     ${balancedPoints.map(({ x, y }) => `
    //         <circle cx="${x}" cy="${y}" r="1.5" fill="#000" stroke="none" stroke-width="1" />
    //     `).join('')}
    // `
}

// bezierHandlersEl.innerHTML = `
//     ${points.map(({ x, y }) => `
//         <circle cx="${x}" cy="${y}" r="4" fill="tan" stroke="none" stroke-width="3" id="point1" />
//     `).join('')}
// `

render()

const mouseMoveHandler = (el, callback) => {
    el.addEventListener('mousedown', (e) => {
        const moveHandler = e => {
            callback({ x: e.offsetX, y: e.offsetY })
        }
        callback({ x: e.offsetX, y: e.offsetY })
        document.addEventListener('mousemove', moveHandler)
        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', moveHandler)
        }, { once: true })
    })
}

for (const [index, handlerEl] of Array.from(bezierHandlersEl.children).entries()) {
    mouseMoveHandler(handlerEl, ({ x, y }) => {
        handlerEl.setAttribute('cx', String(x))
        handlerEl.setAttribute('cy', String(y))
        Object.assign(points[index], { x, y })
        render()
    })
}

for (const el of curveTypeEls) {
    el.addEventListener('click', (e) => {
        console.log('e', e.target.value)
    })
}

stepSizeInputEl.addEventListener('input', e => {
    stepSize = e.target.value
    stepSizeOutputEl.value = stepSize
    render()
})
