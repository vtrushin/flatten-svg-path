export const getPointOnLine = (p0, p1, t) => {
    return {
        x: p0.x + t * (p1.x - p0.x),
        y: p0.y + t * (p1.y - p0.y)
    }
}
