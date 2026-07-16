/**
 * Parse related_files list items from a task YAML block.
 * Stops at the first non-list sibling field (e.g. description, acceptance_criteria).
 */
function parseRelatedFilesFromBlock(block) {
  const lines = block.split('\n');
  const startIdx = lines.findIndex((l) => /^\s*related_files:\s*$/.test(l));
  if (startIdx === -1) return [];
  const files = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    const listMatch = line.match(/^\s+-\s+(.+)$/);
    if (listMatch) {
      files.push(listMatch[1].trim());
      continue;
    }
    if (line.trim() === '') continue;
    break;
  }
  return files;
}

module.exports = { parseRelatedFilesFromBlock };
