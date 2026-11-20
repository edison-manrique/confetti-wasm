export type CodeLanguage = 'ts' | 'tsx' | 'bash' | 'sh';

export type TokenKind =
  | 'plain'
  | 'keyword'
  | 'string'
  | 'comment'
  | 'number'
  | 'function'
  | 'type'
  | 'tag'
  | 'flag'
  | 'operator'
  | 'property';

export interface CodeToken {
  kind: TokenKind;
  text: string;
}

const TS_KEYWORDS = new Set([
  'import',
  'from',
  'export',
  'const',
  'let',
  'var',
  'function',
  'async',
  'await',
  'return',
  'if',
  'else',
  'for',
  'of',
  'in',
  'new',
  'type',
  'interface',
  'true',
  'false',
  'null',
  'undefined',
  'void',
  'as',
]);

const TS_TYPES_AND_GLOBALS = new Set([
  'confetti',
  'createConfetti',
  'ConfettiEngine',
  'ConfettiController',
  'loadConfettiWasm',
  'renderSoAParticles',
  'Promise',
  'HTMLCanvasElement',
  'Float32Array',
  'Uint8Array',
  'number',
  'string',
  'boolean',
  'window',
  'document',
  'performance',
  'Math',
  'console',
  'onMount',
  'onCleanup',
  'createSignal',
  'requestAnimationFrame',
  'cancelAnimationFrame',
]);

const BASH_COMMANDS = new Set([
  'npm',
  'npx',
  'git',
  'cd',
  'mkdir',
  'cp',
  'rm',
  'echo',
  'asc',
  'tsx',
]);

function tokenizeBashLine(line: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let i = 0;

  while (i < line.length) {
    const ch = line[i];

    // Comments (# ...)
    if (ch === '#') {
      tokens.push({ kind: 'comment', text: line.slice(i) });
      break;
    }

    // Quoted strings
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === '\\' && j + 1 < line.length) {
          j += 2;
          continue;
        }
        if (line[j] === quote) {
          j++;
          break;
        }
        j++;
      }
      tokens.push({ kind: 'string', text: line.slice(i, j) });
      i = j;
      continue;
    }

    // CLI flags (--access, -m, -u)
    if (ch === '-' && i + 1 < line.length && /[a-zA-Z0-9-]/.test(line[i + 1])) {
      let j = i + 1;
      while (j < line.length && /[a-zA-Z0-9_-]/.test(line[j])) j++;
      tokens.push({ kind: 'flag', text: line.slice(i, j) });
      i = j;
      continue;
    }

    // Operators (&&, ||, |, >, ->)
    if (
      (ch === '&' && line[i + 1] === '&') ||
      (ch === '|' && line[i + 1] === '|') ||
      ch === '|' ||
      ch === '='
    ) {
      const len = ch === '&' || ch === '|' && line[i + 1] === '|' ? 2 : 1;
      tokens.push({ kind: 'operator', text: line.slice(i, i + len) });
      i += len;
      continue;
    }

    // Words
    if (/[a-zA-Z0-9_./:@-]/.test(ch)) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_./:@-]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (BASH_COMMANDS.has(word)) {
        tokens.push({ kind: 'keyword', text: word });
      } else if (/^\d+(\.\d+)?$/.test(word)) {
        tokens.push({ kind: 'number', text: word });
      } else if (word.startsWith('http://') || word.startsWith('https://')) {
        tokens.push({ kind: 'string', text: word });
      } else if (
        word === 'install' ||
        word === 'run' ||
        word === 'publish' ||
        word === 'login' ||
        word === 'version' ||
        word === 'init' ||
        word === 'add' ||
        word === 'commit' ||
        word === 'push' ||
        word === 'branch' ||
        word === 'remote'
      ) {
        tokens.push({ kind: 'function', text: word });
      } else {
        tokens.push({ kind: 'plain', text: word });
      }
      i = j;
      continue;
    }

    // Whitespace or remaining punctuation
    let j = i + 1;
    while (j < line.length && /\s/.test(line[i]) && /\s/.test(line[j])) j++;
    tokens.push({ kind: 'plain', text: line.slice(i, j) });
    i = j;
  }

  return tokens;
}

function tokenizeTsLine(line: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let i = 0;

  while (i < line.length) {
    const ch = line[i];

    // Single-line comment
    if (ch === '/' && line[i + 1] === '/') {
      tokens.push({ kind: 'comment', text: line.slice(i) });
      break;
    }

    // Strings ('...', "...", `...`)
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === '\\' && j + 1 < line.length) {
          j += 2;
          continue;
        }
        if (line[j] === quote) {
          j++;
          break;
        }
        j++;
      }
      tokens.push({ kind: 'string', text: line.slice(i, j) });
      i = j;
      continue;
    }

    // JSX closing or opening tag (<div, </div, <button, /> etc.)
    if (ch === '<' && (line[i + 1] === '/' || /[a-zA-Z]/.test(line[i + 1] ?? ''))) {
      let j = i + 1;
      if (line[j] === '/') j++;
      if (/[a-zA-Z]/.test(line[j] ?? '')) {
        while (j < line.length && /[a-zA-Z0-9_.-]/.test(line[j])) j++;
        tokens.push({ kind: 'operator', text: line.slice(i, line[i + 1] === '/' ? i + 2 : i + 1) });
        const tagName = line.slice(line[i + 1] === '/' ? i + 2 : i + 1, j);
        tokens.push({
          kind: /^[A-Z]/.test(tagName) ? 'type' : 'tag',
          text: tagName,
        });
        i = j;
        continue;
      }
    }

    // Numbers
    if (/[0-9]/.test(ch) && (i === 0 || !/[a-zA-Z_$]/.test(line[i - 1]))) {
      let j = i + 1;
      while (j < line.length && /[0-9._xXa-fA-F]/.test(line[j])) j++;
      tokens.push({ kind: 'number', text: line.slice(i, j) });
      i = j;
      continue;
    }

    // Identifiers / keywords / functions / properties
    if (/[a-zA-Z_$]/.test(ch)) {
      let j = i + 1;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const ident = line.slice(i, j);
      const prevChar = i > 0 ? line[i - 1] : '';
      const nextChar = line[j] ?? '';

      // Object key (`origin:`, `count:`) or JSX attribute (`onClick=`, `class=`)
      if (nextChar === ':' || nextChar === '=') {
        tokens.push({ kind: 'property', text: ident });
      } else if (TS_KEYWORDS.has(ident) && prevChar !== '.') {
        tokens.push({ kind: 'keyword', text: ident });
      } else if (TS_TYPES_AND_GLOBALS.has(ident) || (/^[A-Z]/.test(ident) && prevChar !== '.')) {
        tokens.push({ kind: 'type', text: ident });
      } else if (nextChar === '(') {
        tokens.push({ kind: 'function', text: ident });
      } else if (prevChar === '.') {
        tokens.push({ kind: 'property', text: ident });
      } else {
        tokens.push({ kind: 'plain', text: ident });
      }
      i = j;
      continue;
    }

    // Operators
    if ('=<>!+-*/%&|?:.'.includes(ch)) {
      let j = i + 1;
      while (j < line.length && '=<>!&|?:.'.includes(line[j]) && j - i < 3) j++;
      tokens.push({ kind: 'operator', text: line.slice(i, j) });
      i = j;
      continue;
    }

    // Punctuation or whitespace
    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < line.length && /\s/.test(line[j])) j++;
      tokens.push({ kind: 'plain', text: line.slice(i, j) });
      i = j;
      continue;
    }

    tokens.push({ kind: 'operator', text: ch });
    i++;
  }

  return tokens;
}

/**
 * Tokeniza código línea a línea preservando exactamente el texto original (lossless).
 */
export function tokenizeCode(code: string, lang: CodeLanguage = 'ts'): CodeToken[][] {
  const lines = code.split('\n');
  if (lang === 'bash' || lang === 'sh') {
    return lines.map(tokenizeBashLine);
  }
  return lines.map(tokenizeTsLine);
}
