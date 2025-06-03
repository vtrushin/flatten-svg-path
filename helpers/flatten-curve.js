import { getLinearLength } from '../utils/get-linear-length.js'
import { times } from '../utils/iterate.js'
import { findRangeIndicesInSortedArray } from '../utils/find-range-indicies-in-sorted-array.js'
import { inverseLerp, lerp } from '../utils/lerp.js'

const createCurveLengthLut = ({ pointOnCurveFn, startPoint, samples }) => {
    let length = 0
    const lengths = new Array(samples)
    lengths[0] = 0
    let prev = startPoint
    for (let i = 1; i <= samples; i++) {
        const t = i / samples
        const point = pointOnCurveFn(t)
        length += getLinearLength(prev, point)
        lengths[i] = length
        prev = point
    }

    return { lengths, totalLength: length }
}

export const flattenCurve = ({ pointOnCurveFn, approxTotalLength, startPoint, maxStepSize }) => {
    const approxSteps = Math.ceil(approxTotalLength / maxStepSize)
    const heuristicSampleValue = 1.2

    const { lengths, totalLength } = createCurveLengthLut({
        pointOnCurveFn,
        startPoint,
        samples: Math.ceil(approxSteps * heuristicSampleValue)
    })

    const steps = Math.ceil(totalLength / maxStepSize)
    const stepSize = totalLength / steps

    return times(steps, stepIndex => {
        const length = stepIndex * stepSize
        const { lowerIndex, upperIndex } = findRangeIndicesInSortedArray(lengths, length)
        const lower = lengths[lowerIndex]
        const lowerBezierStepPoint = lowerIndex / (lengths.length - 1)
        const upper = lengths[upperIndex]
        const upperBezierStepPoint = upperIndex / (lengths.length - 1)
        const rangeRatio = inverseLerp(lower, upper, length)
        const newTimedValue = lerp(lowerBezierStepPoint, upperBezierStepPoint, rangeRatio)
        return pointOnCurveFn(newTimedValue)
    })
}
