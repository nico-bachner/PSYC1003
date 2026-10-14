import * as Bun from 'bun'
import { z } from 'zod'

// Validate nonblank fields after converting numeric YAML scalars to strings.
const metadataValue = z.string().refine((value) => value.trim().length > 0, 'Must not be blank')

// Conventional fields have defaults; other fields are chosen by each essay.
const metadataKey = z
  .string()
  .regex(/^[A-Za-z_][A-Za-z0-9_]*$/u, 'Use a field name such as title or student_id')
  .refine((key) => key !== 'body', 'body is reserved for the rendered essay')

const metadataSchema = z
  .record(
    metadataKey,
    z.union([z.string(), z.number(), z.literal(false)]).transform((value) => {
      if (value === false) return value
      return String(value)
    }),
  )
  .pipe(
    z
      .object({
        author: z.string().default(''),
        date: z.union([z.string(), z.literal(false)]).optional(),
        title: metadataValue.default('Untitled essay'),
      })
      .catchall(metadataValue),
  )

export type Metadata = Readonly<z.infer<typeof metadataSchema>>
export type Essay = Readonly<{ metadata: Metadata; markdown: string }>

export const parseEssay = (source: string): Essay => {
  // Frontmatter is the YAML between the first two standalone --- lines.
  const frontmatterPattern = /^---\r?\n(?<yaml>[\s\S]*?)\r?\n---(?:\r?\n|$)(?<markdown>[\s\S]*)$/u
  const withoutByteOrderMark = source.replace(/^\uFEFF/u, '')
  const match = withoutByteOrderMark.match(frontmatterPattern)

  if (!match) {
    throw new Error('essay.md must begin with YAML frontmatter between --- lines.')
  }

  const [, yaml, markdown] = match
  const result = metadataSchema.safeParse(Bun.YAML.parse(yaml))

  if (!result.success) {
    throw new Error(`Invalid essay metadata:\n${z.prettifyError(result.error)}`)
  }

  return { markdown, metadata: result.data }
}
