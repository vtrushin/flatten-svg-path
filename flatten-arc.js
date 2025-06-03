import { flattenCurve } from './helpers/flatten-curve.js'

const degToRad = angle => angle * Math.PI / 180

// Compute angles
const vectorAngle = (ux, uy, vx, vy) => {
    const dotProduct = ux * vx + uy * vy
    const magnitude = Math.sqrt((ux ** 2 + uy ** 2) * (vx ** 2 + vy ** 2))
    const angle = Math.acos(Math.min(Math.max(dotProduct / magnitude, -1), 1))
    return (ux * vy - uy * vx) < 0 ? -angle : angle
}

export const svgArcToEllipse = (startX, startY, radiusX, radiusY, xAxisRotationDeg, largeArcFlag, sweepFlag, endX, endY) => {
    const rotation = degToRad(xAxisRotationDeg)
    const cosPhi = Math.cos(rotation)
    const sinPhi = Math.sin(rotation)

    // Translate start and end points into an ellipse aligned coordinate system
    const dx = (startX - endX) / 2
    const dy = (startY - endY) / 2

    const x1Prime = cosPhi * dx + sinPhi * dy
    const y1Prime = -sinPhi * dx + cosPhi * dy

    // Ensure radii are large enough
    let radiiCheck = (x1Prime ** 2) / (radiusX ** 2) + (y1Prime ** 2) / (radiusY ** 2)
    if (radiiCheck > 1) {
        const scale = Math.sqrt(radiiCheck)
        radiusX *= scale
        radiusY *= scale
    }

    // Calculate the ellipse center in transformed coordinates
    const rx2 = radiusX ** 2
    const ry2 = radiusY ** 2
    const x1p2 = x1Prime ** 2
    const y1p2 = y1Prime ** 2

    const numerator = rx2 * ry2 - rx2 * y1p2 - ry2 * x1p2
    const denominator = rx2 * y1p2 + ry2 * x1p2
    let centerFactor = Math.sqrt(Math.max(0, numerator / denominator))
    if (largeArcFlag === sweepFlag) centerFactor *= -1

    const cxPrime = centerFactor * (radiusX * y1Prime) / radiusY
    const cyPrime = centerFactor * -(radiusY * x1Prime) / radiusX

    // Convert center back to an original coordinate system
    const centerX = cosPhi * cxPrime - sinPhi * cyPrime + (startX + endX) / 2
    const centerY = sinPhi * cxPrime + cosPhi * cyPrime + (startY + endY) / 2

    const unitVectorStartX = (x1Prime - cxPrime) / radiusX
    const unitVectorStartY = (y1Prime - cyPrime) / radiusY
    const unitVectorEndX = (-x1Prime - cxPrime) / radiusX
    const unitVectorEndY = (-y1Prime - cyPrime) / radiusY

    const startAngle = vectorAngle(1, 0, unitVectorStartX, unitVectorStartY)
    let sweepAngle = vectorAngle(unitVectorStartX, unitVectorStartY, unitVectorEndX, unitVectorEndY)

    if (!sweepFlag && sweepAngle > 0) sweepAngle -= 2 * Math.PI
    if (sweepFlag && sweepAngle < 0) sweepAngle += 2 * Math.PI

    return {
        centerX,
        centerY,
        radiusX,
        radiusY,
        rotation,
        startAngle,
        endAngle: startAngle + sweepAngle,
        counterclockwise: !sweepFlag
    }
}

const ellipseApproxArcLength = (radiusX, radiusY) => {
    const a = Math.max(radiusX, radiusY)
    const b = Math.min(radiusX, radiusY)
    const h = ((a - b) ** 2) / ((a + b) ** 2)
    return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)))
}

const getPointOnEllipse = (centerX, centerY, radiusX, radiusY, startAngle, endAngle, rotation, t) => {
    const paramAngle = startAngle + t * (endAngle - startAngle)

    // Parametric ellipse point (before rotation/translation)
    const x0 = radiusX * Math.cos(paramAngle)
    const y0 = radiusY * Math.sin(paramAngle)

    // Rotate the point
    const xRot = x0 * Math.cos(rotation) - y0 * Math.sin(rotation)
    const yRot = x0 * Math.sin(rotation) + y0 * Math.cos(rotation)

    // Translate to center (cx, cy)
    const x = xRot + centerX
    const y = yRot + centerY

    return { x, y }
}

export const flattenArc = (startPoint, radiusX, radiusY, xAxisRotationDeg, largeArcFlag, sweepFlag, endPoint, maxStepSize) => {
    const { centerX, centerY, radiusX: newRadiusX, radiusY: newRadiusY, rotation, startAngle, endAngle } = svgArcToEllipse(
        startPoint.x,
        startPoint.y,
        radiusX,
        radiusY,
        xAxisRotationDeg,
        largeArcFlag,
        sweepFlag,
        endPoint.x,
        endPoint.y
    )

    return flattenCurve({
        pointOnCurveFn: t => getPointOnEllipse(centerX, centerY, newRadiusX, newRadiusY, startAngle, endAngle, rotation, t),
        approxTotalLength: ellipseApproxArcLength(newRadiusX, newRadiusY),
        startPoint,
        maxStepSize,
    })
}
