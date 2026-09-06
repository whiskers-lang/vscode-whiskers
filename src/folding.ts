import * as vscode from 'vscode';
import { parse } from './parser';

export class WhiskersFoldingProvider implements vscode.FoldingRangeProvider {
    provideFoldingRanges(document: vscode.TextDocument): vscode.FoldingRange[] {
        const text = document.getText();
        const tags = parse(text);
        const ranges: vscode.FoldingRange[] = [];
        const stack: Array<{ name: string; line: number }> = [];

        for (const tag of tags) {
            if (tag.kind === 'section-open') {
                stack.push({
                    name: tag.name,
                    line: document.positionAt(tag.tagOffset).line,
                });
            } else if (tag.kind === 'section-close') {
                // Match nearest open with the same name (handles same-name nesting correctly)
                for (let i = stack.length - 1; i >= 0; i--) {
                    if (stack[i].name === tag.name) {
                        const endLine = document.positionAt(tag.tagOffset).line;
                        if (endLine > stack[i].line) {
                            ranges.push(new vscode.FoldingRange(stack[i].line, endLine));
                        }
                        stack.splice(i, 1);
                        break;
                    }
                }
            }
        }

        return ranges;
    }
}
