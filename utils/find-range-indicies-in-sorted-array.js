export const findRangeIndicesInSortedArray = (arr, target) => {
    let lowIndex = 0
    let highIndex = arr.length - 1

    if (target < arr[lowIndex]) {
        return { lowerIndex: -1, upperIndex: lowIndex }
    }

    if (target > arr[highIndex]) {
        return { lowerIndex: highIndex, upperIndex: -1 }
    }

    while (lowIndex <= highIndex) {
        const mid = Math.floor((lowIndex + highIndex) / 2)
        const midVal = arr[mid]

        if (midVal === target) {
            return { lowerIndex: mid, upperIndex: mid }
        } else if (midVal < target) {
            lowIndex = mid + 1
        } else {
            highIndex = mid - 1
        }
    }

    return { lowerIndex: highIndex, upperIndex: lowIndex }
}
