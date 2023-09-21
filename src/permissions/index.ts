import dictionary from './dictionary.json'

export function getFunctionNameForSelector(selector: string): string {
  const data = dictionary.find(fn => fn.selector == selector)
  return data ? data.function : 'Unknown'
}
