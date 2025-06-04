import { flattenLine } from './flatten-line.js'
import { flattenCubicBezier } from './flatten-cubic-bezier.js'
import { flattenQuadraticBezier } from './flatten-quadratic-bezier.js'
import { flattenArc } from './flatten-arc.js'

const reflectControlPoint = (originPoint, controlPoint) => ({
    x: 2 * originPoint.x - controlPoint.x,
    y: 2 * originPoint.y - controlPoint.y
})

const moveToCommand = point => ({ type: 'M', values: [point.x, point.y] })
const lineToCommand = point => ({ type: 'L', values: [point.x, point.y] })

export const flattenSvgPath = (commands, { maxStepSize }) => {
    if (commands.length === 0) {
        return [null, { type: 'NO_COMMANDS', message: 'No commands provided' }]
    }

    if (commands[0].type !== 'M' && commands[0].type !== 'm') {
        return [null, { type: 'NO_FIRST_MOVE_TO', message: '"moveTo" should be first command' }]
    }

    let initPoint = { x: 0, y: 0 }
    let prevPoint = initPoint


    let prevCubicBezierControlPoint = null
    let prevQuadraticBezierControlPoint = null

    const resultPoints = []

    for (const [index, command] of commands.entries()) {
        const isRelativeCoordinate = command.type === command.type.toLowerCase()
        const getPoint = (x, y) => isRelativeCoordinate
            ? { x: prevPoint.x + x, y: prevPoint.y + y }
            : { x, y }
        const commandTypeUpperCased = command.type.toUpperCase()

        switch (commandTypeUpperCased) {
            case 'M': {
                const endPoint = getPoint(command.values[0], command.values[1])
                if (index > 0) {
                    resultPoints.push(lineToCommand(prevPoint))
                }
                resultPoints.push(moveToCommand(endPoint))
                initPoint = endPoint
                prevPoint = endPoint
                break
            }

            case 'L':
            case 'H':
            case 'V': {
                const endPoint = {
                    'L': getPoint(command.values[0], command.values[1]),
                    'H': getPoint(command.values[0], prevPoint.y),
                    'V': getPoint(prevPoint.x, command.values[0]),
                }[commandTypeUpperCased]
                const points = flattenLine(prevPoint, endPoint, maxStepSize)
                prevPoint = endPoint
                resultPoints.push(...points.map(lineToCommand))
                break
            }

            case 'C':
            case 'S': {
                if (commandTypeUpperCased === 'S' && !prevCubicBezierControlPoint) {
                    return 1
                }

                const [startControlPoint, endControlPoint, endPoint] = {
                    'C': () => [
                        getPoint(command.values[0], command.values[1]),
                        getPoint(command.values[2], command.values[3]),
                        getPoint(command.values[4], command.values[5]),
                    ],
                    'S': () => [
                        reflectControlPoint(prevPoint, prevCubicBezierControlPoint),
                        getPoint(command.values[0], command.values[1]),
                        getPoint(command.values[2], command.values[3]),
                    ]
                }[commandTypeUpperCased]()
                const points = flattenCubicBezier(
                    prevPoint,
                    startControlPoint,
                    endControlPoint,
                    endPoint,
                    maxStepSize
                )
                prevPoint = endPoint
                prevCubicBezierControlPoint = endControlPoint
                resultPoints.push(...points.map(lineToCommand))
                break
            }

            case 'Q':
            case 'T': {
                if (commandTypeUpperCased === 'T' && !prevQuadraticBezierControlPoint) {
                    return 1
                }

                const [controlPoint, endPoint] = {
                    'Q': () => [
                        getPoint(command.values[0], command.values[1]),
                        getPoint(command.values[2], command.values[3]),
                    ],
                    'T': () => [
                        reflectControlPoint(prevPoint, prevQuadraticBezierControlPoint),
                        getPoint(command.values[0], command.values[1]),
                    ]
                }[commandTypeUpperCased]()
                const points = flattenQuadraticBezier(
                    prevPoint,
                    controlPoint,
                    endPoint,
                    maxStepSize
                )
                prevPoint = endPoint
                prevQuadraticBezierControlPoint = controlPoint
                resultPoints.push(...points.map(lineToCommand))
                break
            }

            case 'A': {
                const [radiusX, radiusY, xAxisRotationDeg, largeArcFlag, sweepFlag, endPointX, endPointY] = command.values
                const endPoint = getPoint(endPointX, endPointY)
                const points = flattenArc(
                    prevPoint,
                    radiusX,
                    radiusY,
                    xAxisRotationDeg,
                    largeArcFlag,
                    sweepFlag,
                    endPoint,
                    maxStepSize
                )
                prevPoint = endPoint
                resultPoints.push(...points.map(lineToCommand))
                break
            }

            case 'Z': {
                const points = flattenLine(prevPoint, initPoint, maxStepSize)
                prevPoint = initPoint
                resultPoints.push(...points.map(lineToCommand))
                break
            }

            default: {
                return [null, { type: 'UNKNOWN_COMMAND', message: 'Unknown command' }]
            }
        }

        if (commandTypeUpperCased !== 'C' && commandTypeUpperCased !== 'S') {
            prevCubicBezierControlPoint = null
        }

        if (commandTypeUpperCased !== 'Q' && commandTypeUpperCased !== 'T') {
            prevQuadraticBezierControlPoint = null
        }
    }

    resultPoints.push(lineToCommand(prevPoint))

    return [resultPoints, null]
}
