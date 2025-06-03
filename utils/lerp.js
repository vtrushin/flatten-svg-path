export const lerp = (start, end, value) => {
    return start + (end - start) * value
}

export const inverseLerp = (start, end, value) => {
    return start !== end ? (value - start) / (end - start) : 0
}
