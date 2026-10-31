import type { RunEvent } from '../types'

/** Shorten a commit SHA to 7 chars */
export function shortSha(sha?: string): string {
  if (!sha) return 'no sha'
  return sha.slice(0, 7)
}

/** Truncate a string with an ellipsis */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 1) + '…'
}

/** Capitalize first letter, lowercase rest */
export function sentenceCase(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/** Format a similarity score as a percentage string */
export function similarityPct(score: number): string {
  return `${Math.round(score * 100)}%`
}

/** One-line summary of an event for lists and the fork track */
export function eventSummary(evt?: RunEvent): string {
  if (!evt) return 'No event'
  switch (evt.type) {
    case 'command_run': {
      const cmd = evt.payload.command as string | undefined
      return cmd ?? 'Command executed'
    }
    case 'tool_call': {
      const tool = evt.payload.tool as string | undefined
      return tool ? `${tool}()` : 'Tool call'
    }
    case 'diff_submitted': {
      const file = evt.payload.file as string | undefined
      const sum = evt.payload.summary as string | undefined
      return sum ?? (file ? `Diff on ${file}` : 'Diff submitted')
    }
    case 'test_result': {
      const suite = evt.payload.suite as string | undefined
      const passed = evt.payload.passed as number | undefined
      const total = evt.payload.total as number | undefined
      if (suite) return `${suite} ${passed ?? '?'}/${total ?? '?'} passed`
      return 'Test result'
    }
    case 'error':
      return evt.error_message ?? 'Error'
    case 'plan_step': {
      const desc = evt.payload.description as string | undefined
      return desc ?? 'Plan step'
    }
    default:
      return evt.type
  }
}
