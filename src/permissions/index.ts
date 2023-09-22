import dictionary from './dictionary'

export function getFunctionNameForSelector(selector: string): string {
  const functionName = dictionary.has(selector) ? dictionary.get(selector) : 'Unknown'
  return functionName
}
