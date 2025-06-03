export const pathDataToAbsolute = pathData => {
    let currentX = 0
    let currentY = 0
    let subpathStartX = 0
    let subpathStartY = 0

    return pathData.map(({ type, values }) => {
        const typeUpperCased = type.toUpperCase()
        const isRelative = type === type.toLowerCase()
        const offsetX = isRelative ? currentX : 0
        const offsetY = isRelative ? currentY : 0

        switch (typeUpperCased) {
            case 'M': {
                const [endX, endY] = values
                const newEndX = offsetX + endX
                const newEndY = offsetY + endY
                currentX = newEndX
                currentY = newEndY
                subpathStartX = newEndX
                subpathStartY = newEndY
                return { type: type.toUpperCase(), values: [newEndX, newEndY] }
            }
            case 'L': case 'T': {
                const [endX, endY] = values
                const newEndX = offsetX + endX
                const newEndY = offsetY + endY
                currentX = newEndX
                currentY = newEndY
                return { type: type.toUpperCase(), values: [newEndX, newEndY] }
            }
            case 'H': {
                const [endX] = values
                const newEndX = offsetX + endX
                currentX = newEndX
                return { type: type.toUpperCase(), values: [newEndX] }
            }
            case 'V': {
                const [endY] = values
                const newEndY = offsetY + endY
                currentY = newEndY
                return { type: type.toUpperCase(), values: [newEndY] }
            }
            case 'C': {
                const [controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y, endX, endY] = values
                const newControlPoint1X = offsetX + controlPoint1X
                const newControlPoint1Y = offsetY + controlPoint1Y
                const newControlPoint2X = offsetX + controlPoint2X
                const newControlPoint2Y = offsetY + controlPoint2Y
                const newEndX = offsetX + endX
                const newEndY = offsetY + endY
                currentX = newEndX
                currentY = newEndY
                return {
                    type: type.toUpperCase(),
                    values: [newControlPoint1X, newControlPoint1Y, newControlPoint2X, newControlPoint2Y, newEndX, newEndY]
                }
            }
            case 'S': case 'Q': {
                const [controlPointX, controlPointY, endX, endY] = values
                const newControlPointX = offsetX + controlPointX
                const newControlPointY = offsetY + controlPointY
                const newEndX = offsetX + endX
                const newEndY = offsetY + endY
                currentX = newEndX
                currentY = newEndY
                return {
                    type: type.toUpperCase(),
                    values: [newControlPointX, newControlPointY, newEndX, newEndY]
                }
            }
            case 'A': {
                const [radiusX, radiusY, xAxisRotation, largeArcFlag, sweepFlag, endX, endY] = values
                const newEndX = offsetX + endX
                const newEndY = offsetY + endY
                currentX = newEndX
                currentY = newEndY
                return {
                    type: type.toUpperCase(),
                    values: [radiusX, radiusY, xAxisRotation, largeArcFlag, sweepFlag, newEndX, newEndY]
                }
            }
            case 'Z': {
                currentX = subpathStartX
                currentY = subpathStartY
                return { type, values }
            }
            default: {
                return { type, values }
            }
        }
    })
}
