import { flattenCurve } from './helpers/flatten-curve.js'
import { getPointOnLine } from './utils/get-point-on-line.js'

const getPointOnQuadraticBezier = (p0, p1, p2, t) => {
    const q0 = getPointOnLine(p0, p1, t)
    const q1 = getPointOnLine(p1, p2, t)
    return getPointOnLine(q0, q1, t)
}

const quadraticBezierApproxArcLength = (p0, p1, p2) => {
    // Weights and points for Gauss–Legendre 5-point quadrature
    const weights = [0.118,  0.239, 0.284, 0.239, 0.118]
    const tValues = [0.0469, 0.2308, 0.5, 0.7692, 0.9531]

    let length = 0

    for (let i = 0; i < 5; i++) {
        const t = tValues[i]

        const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x)
        const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y)
        const speed = Math.sqrt(dx * dx + dy * dy)

        length += weights[i] * speed
    }

    return length
}

export const flattenQuadraticBezier = (p0, p1, p2, maxStepSize) => {
    return flattenCurve({
        pointOnCurveFn: t => getPointOnQuadraticBezier(p0, p1, p2, t),
        approxTotalLength: quadraticBezierApproxArcLength(p0, p1, p2),
        startPoint: p0,
        maxStepSize
    })
}
