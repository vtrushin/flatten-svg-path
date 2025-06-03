import { times } from './utils/iterate.js'
import { getLinearLength } from './utils/get-linear-length.js'
import { getPointOnLine } from './utils/get-point-on-line.js'

export const flattenLine = (p0, p1, stepSize) => {
    const length = getLinearLength(p0, p1)
    const steps = Math.ceil(length / stepSize)

    return times(steps, step => {
        return getPointOnLine(p0, p1, step / steps)
    })
}
