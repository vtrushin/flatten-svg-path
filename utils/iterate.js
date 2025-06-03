const interpolate = (from, to, fraction) => from * (1 - fraction) + to * fraction

export const times = (count, callback = undefined) => {
    const arr = new Array(count)
    for (let i = 0; i < count; i++) {
        arr[i] = callback ? callback(i, arr) : i
    }
    return arr
}

export const range = (from, to, stepSize, callback = undefined, { endExclusive = false } = {}) => {
    const size = Math.abs(to - from)
    const steps = size / stepSize + (endExclusive ? 1 : 0)
    return times(steps, step => {
        const value = interpolate(from, to, step * stepSize / size)
        return callback ? callback(value, step) : value
    })
}
