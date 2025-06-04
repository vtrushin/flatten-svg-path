# Flatten SVG Path
Converts lines, arcs, bezier curves to straight-line segments

```ts
import { flattenSvgPath } from 'flatten-svg-path'

const svgPath = [
    { type: 'M', values: [112.54, 110.26] },
    { type: 'l', values: [3.33, 5.44] },
    { type: 'c', values: [-4.79, 5.7, -14.21, 8.83, -26.72, 2.4] },
    { type: 'L', values: [87, 120] },
    { type: 'c', values: [8.23, 11.7, 6.31, 21, 1.31, 27.3] },
    { type: 'l', values: [-6.19, -2.93] },
]

const [result, error] = flattenSvgPath(svgPath, { maxStepSize: 10 })

console.log(result)
// 
```
