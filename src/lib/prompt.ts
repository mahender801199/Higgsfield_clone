/**
 * Renders a preset prompt template. Supports `{{subject}}` (and a few common
 * aliases) placeholder substitution. If the template has no placeholder, the
 * subject is appended so presets without an explicit slot still incorporate
 * the user's input.
 */
export function renderPromptTemplate(template: string, subject: string): string {
  const cleanSubject = subject.trim();
  const placeholder = /\{\{\s*(subject|prompt|input)\s*\}\}/gi;

  if (placeholder.test(template)) {
    return template.replace(placeholder, cleanSubject).trim();
  }
  if (!cleanSubject) return template.trim();
  return `${template.trim()}, ${cleanSubject}`;
}
