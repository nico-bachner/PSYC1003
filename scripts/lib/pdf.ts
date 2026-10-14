import * as Bun from 'bun'
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export const compilePdf = (source: string, outputPath: string): void => {
  const outputDirectory = path.dirname(outputPath)
  mkdirSync(outputDirectory, { recursive: true })
  const temporaryDirectory = mkdtempSync(path.join(outputDirectory, '.build-'))
  try {
    const sourcePath = path.join(temporaryDirectory, 'essay.tex')
    writeFileSync(sourcePath, source)
    const compilation = Bun.spawnSync(['tectonic', sourcePath, '--outdir', temporaryDirectory], {
      cwd: temporaryDirectory,
      stderr: 'inherit',
      stdout: 'inherit',
    })
    if (compilation.exitCode !== 0) {
      throw new Error(`Tectonic exited with status ${compilation.exitCode}.`)
    }
    // Preserve the previous PDF if compilation fails.
    renameSync(path.join(temporaryDirectory, 'essay.pdf'), outputPath)
  } finally {
    rmSync(temporaryDirectory, { force: true, recursive: true })
  }
}
