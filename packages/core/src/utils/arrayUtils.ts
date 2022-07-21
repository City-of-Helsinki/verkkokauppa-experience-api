/**
 * Merge two arrays with objects overriding using prop name
 * Values in second param overrides data in first param
 * @param first Array
 * @param second Overrides data in first param
 * @param prop Property name used to check for duplicates
 */
export const mergeArray = (first: any, second: any, prop: any): any => {
  const reduced = first.filter(
    (aitem: any) => !second.find((bitem: any) => aitem[prop] === bitem[prop])
  )
  return reduced.concat(second)
}
