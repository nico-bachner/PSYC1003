import * as Bun from 'bun'
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

export const compilePdf = (source: string, directory: string): void => {
  mkdirSync(directory, { recursive: true })
  const work = mkdtempSync(path.join(directory, '.build-'))
  try {
    const tex = path.join(work, 'essay.tex')
    writeFileSync(tex, source)
    const result = Bun.spawnSync(['tectonic', tex, '--outdir', work], {
      cwd: work,
      stderr: 'inherit',
      stdout: 'inherit',
    })
    if (result.exitCode !== 0) {
      throw new Error(`Tectonic exited with status ${result.exitCode}.`)
    }
    // Preserve the previous PDF if compilation fails.
    const output = path.join(directory, 'essay.pdf')
    renameSync(path.join(work, 'essay.pdf'), output)
    process.stdout.write(`Updated ${output}\n`)
  } finally {
    rmSync(work, { force: true, recursive: true })
  }
}
