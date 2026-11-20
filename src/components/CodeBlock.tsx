import { For, createMemo } from 'solid-js';
import { tokenizeCode, type CodeLanguage, type TokenKind } from '../utils/highlightCode';

interface CodeBlockProps {
  code: string;
  language?: CodeLanguage;
  showLineNumbers?: boolean;
}

const TOKEN_CLASSES: Record<TokenKind, string> = {
  plain: 'text-slate-200',
  keyword: 'text-violet-400 font-medium',
  string: 'text-emerald-400',
  comment: 'text-slate-500 italic',
  number: 'text-amber-300',
  function: 'text-cyan-300',
  type: 'text-sky-400 font-medium',
  tag: 'text-pink-400',
  flag: 'text-amber-300',
  operator: 'text-slate-400',
  property: 'text-blue-300',
};

export function CodeBlock(props: CodeBlockProps) {
  const lines = createMemo(() => tokenizeCode(props.code, props.language ?? 'ts'));

  return (
    <pre
      data-testid="syntax-code-block"
      class="overflow-x-auto p-4 font-mono text-xs leading-6 bg-[#07090E] text-slate-200"
    >
      <code>
        <For each={lines()}>
          {(tokens, lineIdx) => (
            <div class="flex min-w-max">
              {props.showLineNumbers !== false && (
                <span
                  aria-hidden="true"
                  class="w-7 shrink-0 select-none pr-3 text-right text-slate-600 tabular-nums"
                >
                  {lineIdx() + 1}
                </span>
              )}
              <span class="whitespace-pre">
                <For each={tokens}>
                  {(token) => (
                    <span data-token={token.kind} class={TOKEN_CLASSES[token.kind]}>
                      {token.text}
                    </span>
                  )}
                </For>
              </span>
            </div>
          )}
        </For>
      </code>
    </pre>
  );
}
