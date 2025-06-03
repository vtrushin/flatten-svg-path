export const polygonPathToSvgPathData = (path, { closed = false } = {}) => [
    ...path.map(({ x, y }, i) => ({ type: i === 0 ? 'M' : 'L', values: [x, y] })),
    ...(closed ? [{ type: 'Z', values: [] }] : [])
]

export const polygonPathToSvgPath = (points) => points.map(({ x, y }, i) =>
    (i === 0 ? 'M' : 'L') + x + ',' + y).join(' ')

export const pathDataToSvgPathData = (pathData) => pathData.map(({ type, values }) =>
    `${type} ${values.join(',')}`).join(' ')

export const getPointsFromSvgPathData = (path) => path.flatMap(({ type, values }) => {
    if (type === 'Z' || type === 'z') {
        return []
    } else {
        return [{ x: values.at(-2), y: values.at(-1) }]
    }
})
