export function getSequence(arr) {
    const len = arr.length;
    const result = [0];
    const p = arr.slice(0);
    let start;
    let end;
    let middle;
    let resultLastIndex
    for (let i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            resultLastIndex = result[result.length - 1];
            if (arr[resultLastIndex] < arrI) {
                p[i] = resultLastIndex;
                result.push(i);
                continue;
            }
        }

        start = 0;
        end = result.length - 1;
        while (start < end) {
            middle = ((start + end) / 2) | 0;
            if (arr[result[middle]] < arrI) {
                start = middle + 1;
            } else {
                end = middle;
            }
        }
        if (arrI === 0) {
            p[i] = -1;
        } else {
            p[i] = result[end - 1];
        }
    }
    resultLastIndex = result.length - 1;
    start = result[resultLastIndex];
    end = resultLastIndex;
    while (start !== end) {
        result[end] = start;
        end--;
        start = p[start];
    }
    return result;
}