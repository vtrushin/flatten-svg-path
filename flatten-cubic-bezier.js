import { flattenCurve } from './helpers/flatten-curve.js'
import { getPointOnLine } from './utils/get-point-on-line.js'

const getPointOnCubicBezier = (p0, p1, p2, p3, t) => {
    const q0 = getPointOnLine(p0, p1, t)
    const q1 = getPointOnLine(p1, p2, t)
    const q2 = getPointOnLine(p2, p3, t)
    const r1 = getPointOnLine(q0, q1, t)
    const r2 = getPointOnLine(q1, q2, t)
    return getPointOnLine(r1, r2, t)
}

const cubicBezierApproxArcLength = (p0, p1, p2, p3) => {
    // Weights and points for Gauss–Legendre 5-point quadrature
    const gaussLegendrePoints = [0.90618, 0.53847, 0.0, -0.53847, -0.90618]
    const gaussLegendreWeights = [0.23693, 0.47863, 0.56889, 0.47863, 0.23693]

    let length = 0

    for (let i = 0; i < gaussLegendrePoints.length; i++) {
        // Transform from [-1,1] to [0,1]
        const t = (gaussLegendrePoints[i] + 1) / 2

        const dx = (
            3 * (1 - t) ** 2 * (p1.x - p0.x) +
            6 * (1 - t) * t * (p2.x - p1.x) +
            3 * t ** 2 * (p3.x - p2.x)
        )

        const dy = (
            3 * (1 - t) ** 2 * (p1.y - p0.y) +
            6 * (1 - t) * t * (p2.y - p1.y) +
            3 * t ** 2 * (p3.y - p2.y)
        )

        const derivative = Math.hypot(dx, dy)

        length += gaussLegendreWeights[i] * derivative
    }

    // Scale by interval
    return length / 2
}

export const flattenCubicBezier = (p0, p1, p2, p3, maxStepSize) => {
    return flattenCurve({
        pointOnCurveFn: t => getPointOnCubicBezier(p0, p1, p2, p3, t),
        approxTotalLength: cubicBezierApproxArcLength(p0, p1, p2, p3),
        startPoint: p0,
        maxStepSize,
    })
}
