#!/usr/bin/env bun
import { cancel, isCancel, log, multiselect } from '@clack/prompts'
import { discoverDocuments, outputPath, repositoryRoot, validateOutputNames } from './lib/inputs'
import { readFileSync } from 'node:fs'
import { compilePdf } from './lib/pdf'
import path from 'node:path'
import { prepareDocument } from './lib/document'
import process from 'node:process'

type BuildResult = Readonly<{
  sourcePath: string
  outputPath: string
  wordCount: number
}>

type BuildOutcome =
  | Readonly<{ ok: true; result: BuildResult }>
  | Readonly<{ ok: false; sourcePath: string; error: unknown }>

const buildDocument = (sourcePath: string, template: string): BuildResult => {
  const document = prepareDocument(readFileSync(sourcePath, 'utf8'), template)
  const destination = outputPath(sourcePath)
  compilePdf(document.latex, destination)
  return { outputPath: destination, sourcePath, wordCount: document.wordCount }
}

const tryBuildDocument = (sourcePath: string, template: string): BuildOutcome => {
  try {
    return { ok: true, result: buildDocument(sourcePath, template) }
  } catch (error) {
    return { error, ok: false, sourcePath }
  }
}

const displayPath = (filename: string): string => path.relative(repositoryRoot, filename)

const selectDocuments = (inputs: readonly string[]): Promise<string[]> => {
  if (inputs.length > 0) {
    return Promise.resolve(discoverDocuments(inputs))
  }
  const documents = discoverDocuments([repositoryRoot])
  if (!process.stdin.isTTY) {
    return Promise.resolve(documents)
  }
  return multiselect({
    message: 'Choose documents to build',
    options: documents.map((filename) => ({ label: displayPath(filename), value: filename })),
    required: true,
  }).then((selection) => {
    if (isCancel(selection)) {
      cancel('Build cancelled')
      return []
    }
    return selection
  })
}

const reportOutcome = (outcome: BuildOutcome): void => {
  if (outcome.ok) {
    const { outputPath: destination, wordCount } = outcome.result
    log.success(`${displayPath(destination)} · ${wordCount} words`)
    return
  }
  log.error(`${displayPath(outcome.sourcePath)}: ${String(outcome.error)}`)
}

const buildSelectedDocuments = (files: readonly string[]): void => {
  if (files.length === 0) {
    return
  }
  validateOutputNames(files)
  const template = readFileSync(path.join(repositoryRoot, 'scripts/templates/essay.tex'), 'utf8')
  const outcomes = files.map((filename) => {
    const outcome = tryBuildDocument(filename, template)
    reportOutcome(outcome)
    return outcome
  })
  const failures = outcomes.filter((outcome) => !outcome.ok)
  if (failures.length > 0) {
    throw new Error(`${failures.length} document(s) failed to build.`)
  }
}

const runBuild = (inputs: readonly string[]): Promise<void> =>
  Promise.resolve()
    .then(() => selectDocuments(inputs))
    .then((files) => buildSelectedDocuments(files))

if (import.meta.main) {
  await runBuild(process.argv.slice(2)).catch((error) => {
    log.error(`Build failed: ${String(error)}`)
    process.exitCode = 1
  })
}
