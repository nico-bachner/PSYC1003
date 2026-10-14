import type { Metadata } from './metadata'
import { escapeTex } from './tex'

export const fillTemplate = (template: string, metadata: Metadata, body: string): string => {
  const values: Record<string, string> = Object.fromEntries([
    // This trusted default is LaTeX; explicit metadata is always escaped.
    ['date', String.raw`\today`],
    ...Object.entries(metadata).map(([field, value]) => {
      if (field === 'author') {
        const lines = (value ?? '').split(/\r?\n/u).map((line) => escapeTex(line))
        return [field, lines.join(String.raw`\\`)]
      }
      return [field, escapeTex(value ?? '')]
    }),
    ['body', body],
  ])

  if (template.split('{{body}}').length - 1 !== 1) {
    throw new Error('template.tex needs exactly one {{body}} placeholder.')
  }

  // A single replacement pass keeps inserted text from becoming a placeholder.
  return template.replaceAll(/\{\{(?<key>\w+)\}\}/gu, (_placeholder, key) => {
    if (!Object.hasOwn(values, key)) {
      throw new Error(`Missing metadata for template placeholder: ${key}`)
    }
    return values[key]
  })
}
