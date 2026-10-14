import * as Bun from 'bun'
import { escapeTex } from './tex'

const renderLink = (label: string, url: string): string => {
  const isWebUrl = /^https?:\/\//u.test(url)
  const hasUnsafeTexCharacters = /[\\{}%#\r\n]/u.test(url)

  if (!isWebUrl || hasUnsafeTexCharacters) {
    throw new Error(`Unsupported URL: ${url}`)
  }

  if (label === escapeTex(url)) {
    return `\\url{${url}}`
  }
  return `\\href{${url}}{${label}}`
}

const wrapEnvironment = (name: string, content: string): string =>
  `\\begin{${name}}\n${content}\\end{${name}}\n\n`

const rejectMarkdown = (feature: string): never => {
  throw new Error(`Unsupported Markdown: ${feature}`)
}

// Internal markers let Markdown rendering stay independent of section context.
const ordinarySection = '\0section\0'
const paragraphStart = '\0paragraph\0'
const referenceSection = '\0references\0'
const hangingIndent = String.raw`\noindent\hangindent=0.5in\hangafter=1 `

type SectionState = Readonly<{ inReferences: boolean; latex: string }>

const renderHeading = (content: string, level: number): string => {
  const headingCommands: Readonly<Record<number, string>> = {
    2: 'section',
    3: 'subsection',
    4: 'subsubsection',
  }
  const command = headingCommands[level]

  if (!command) {
    throw new Error('Use ## through #### headings; put the title in frontmatter.')
  }

  const heading = `\\${command}*{${content}}\n\n`
  if (content.toLowerCase() === 'references') {
    return `${referenceSection}\\newpage\n\n${heading}`
  }
  return `${ordinarySection}${heading}`
}

const appendPart = (state: SectionState, part: string): SectionState => {
  if (part === referenceSection) {
    return { inReferences: true, latex: state.latex }
  }
  if (part === ordinarySection) {
    return { inReferences: false, latex: state.latex }
  }
  if (part === paragraphStart) {
    if (state.inReferences) {
      return { inReferences: state.inReferences, latex: state.latex + hangingIndent }
    }
    return state
  }
  return { inReferences: state.inReferences, latex: state.latex + part }
}

// Recursively fold the section markers into immutable state.
const formatParts = (parts: readonly string[], state: SectionState): string => {
  if (parts.length === 0) {
    return state.latex
  }
  const [part, ...remaining] = parts
  return formatParts(remaining, appendPart(state, part))
}

const applySectionFormatting = (rendered: string): string =>
  formatParts(rendered.split(/(?<marker>\0(?:references|section|paragraph)\0)/u), {
    inReferences: false,
    latex: '',
  })

export const renderMarkdown = (markdown: string): string => {
  // Reserve NUL for internal markers so essay text cannot impersonate them.
  if (markdown.includes('\0')) {
    throw new Error('Markdown must not contain NUL characters.')
  }

  // Escape only plain text; parent callbacks receive already-rendered LaTeX.
  const rendered = Bun.markdown.render(markdown, {
    blockquote: (content) => wrapEnvironment('quote', content),
    code: () => rejectMarkdown('code blocks'),
    codespan: (content) => `\\texttt{${escapeTex(content)}}`,
    emphasis: (content) => `\\textit{${content}}`,
    heading: (content, { level }) => renderHeading(content, level),
    hr: () => '\\par\\noindent\\rule{\\linewidth}{0.4pt}\\par\n\n',
    html: () => rejectMarkdown('raw HTML'),
    image: () => rejectMarkdown('images'),
    link: (label, { href }) => renderLink(label, href),
    list: (content, { ordered }) => {
      if (ordered) {
        return wrapEnvironment('enumerate', content)
      }
      return wrapEnvironment('itemize', content)
    },
    listItem: (content, { checked = 'not-task', ordered, start = 1 }) => {
      const isTask = checked !== 'not-task'
      const startsAfterOne = ordered && start !== 1

      if (isTask || startsAfterOne) {
        throw new Error('Task lists and ordered lists starting after 1 are unsupported.')
      }
      return `\\item ${content}\n`
    },
    paragraph: (content) => `${paragraphStart}${content}\\par\n\n`,
    strikethrough: () => rejectMarkdown('strikethrough'),
    strong: (content) => `\\textbf{${content}}`,
    table: () => rejectMarkdown('tables'),
    text: escapeTex,
  })

  return applySectionFormatting(rendered)
}
