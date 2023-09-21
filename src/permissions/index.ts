import dictionary from './dictionary'

export function getFunctionNameForSelector(selector: string): string {
  const name = dictionary[selector]
  return name || 'Unknown'
}
