type ResultValue<T> = [T, null]
type ResultError<T> = [null, T]

type SVGCommandType =
    | 'M' | 'm' // move to
    | 'L' | 'l' // line to
    | 'H' | 'h' // horizontal line
    | 'V' | 'v' // vertical line
    | 'C' | 'c' // cubic bezier
    | 'S' | 's' // shorthand cubic
    | 'Q' | 'q' // quadratic bezier
    | 'T' | 't' // shorthand quadratic
    | 'A' | 'a' // arc
    | 'Z' | 'z' // close path

type SVGCommand = {
    type: SVGCommandType
    values: number[]
}

export declare const flattenSvgPath: (commands: SVGCommand[], maxStepSize: number) =>
    ResultValue<SVGCommand[]> | ResultError<{ type: string, message: string }>
