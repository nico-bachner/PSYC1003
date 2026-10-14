import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs'
import path from 'node:path'

export const repositoryRoot = path.resolve(import.meta.dir, '../..')
const excludedDirectories = new Set(['.git', 'node_modules', 'generated', 'materials', 'sources'])
const frontmatterStart = /^(?:\uFEFF)?---\r?\n/u

const resolveInput = (input: string): string => {
  const resolved = realpathSync(input)
  const relative = path.relative(repositoryRoot, resolved)
  if (path.isAbsolute(relative) || relative.split(path.sep).includes('..')) {
    throw new Error(`Input must be inside the repository: ${input}`)
  }
  return resolved
}

const discoverDirectory = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true })
    .filter((entry) => !entry.isSymbolicLink() && !excludedDirectories.has(entry.name))
    .flatMap((entry) => {
      const filename = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        return discoverDirectory(filename)
      }
      if (
        entry.isFile() &&
        entry.name.endsWith('.md') &&
        frontmatterStart.test(readFileSync(filename, 'utf8'))
      ) {
        return [filename]
      }
      return []
    })

const discoverInput = (input: string): string[] => {
  const resolved = resolveInput(input)
  if (statSync(resolved).isDirectory()) {
    return discoverDirectory(resolved)
  }
  if (path.extname(resolved) !== '.md') {
    throw new Error(`Expected a Markdown file: ${input}`)
  }
  return [resolved]
}

export const discoverDocuments = (inputs: readonly string[]): string[] => {
  const documents = [...new Set(inputs.flatMap((input) => discoverInput(input)))].toSorted()
  if (documents.length === 0) {
    throw new Error('No Markdown documents with frontmatter found.')
  }
  return documents
}

export const outputPath = (sourcePath: string): string =>
  path.join(repositoryRoot, 'generated', `${path.basename(sourcePath, '.md')}.pdf`)

export const validateOutputNames = (files: readonly string[]): void => {
  const outputs = files.map((file) => outputPath(file).toLowerCase())
  if (new Set(outputs).size !== outputs.length) {
    throw new Error('Choose documents with unique filenames; generated PDFs share one folder.')
  }
}
