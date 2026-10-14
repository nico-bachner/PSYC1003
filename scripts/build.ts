#!/usr/bin/env bun
import * as Bun from 'bun'
import { existsSync, readFileSync } from 'node:fs'
import { compilePdf } from './lib/pdf'
import { fillTemplate } from './lib/template'
import { parseEssay } from './lib/metadata'
import path from 'node:path'
import process from 'node:process'
import { renderMarkdown } from './lib/markdown'

const root = path.resolve(import.meta.dir, '..')

export const createLatex = (source: string, template: string): string => {
  const { metadata, markdown } = parseEssay(source)
  return fillTemplate(template, metadata, renderMarkdown(markdown))
}

const build = (directory: string): void => {
  const essay = [directory, path.join(directory, 'essay')]
    .map((candidate) => path.resolve(candidate))
    .find((candidate) => existsSync(path.join(candidate, 'essay.md')))
  if (!essay) {
    throw new Error(`No essay.md found in ${directory} or its essay/ subdirectory.`)
  }
  const relative = path.relative(root, essay)
  if (path.isAbsolute(relative) || relative.split(path.sep).includes('..')) {
    throw new Error('The essay directory must be inside the repository.')
  }
  const source = createLatex(
    readFileSync(path.join(essay, 'essay.md'), 'utf8'),
    readFileSync(path.join(import.meta.dir, 'templates', 'essay.tex'), 'utf8'),
  )
  compilePdf(source, path.join(root, 'generated', relative))
}

if (import.meta.main) {
  try {
    const [directory, ...extra] = Bun.argv.slice(2)
    if (!directory || extra.length > 0) {
      throw new Error('Usage: bun run build <essay-directory>')
    }
    build(directory)
  } catch (error) {
    process.stderr.write(`Build failed: ${String(error)}\n`)
    process.exitCode = 1
  }
}
