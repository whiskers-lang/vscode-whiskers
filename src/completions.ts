import * as vscode from 'vscode';
import {
    METADATA_COMPLETIONS,
    SIGIL_COMPLETIONS,
    shouldOfferMetadataCompletions,
    shouldOfferSigilCompletions,
} from './completionData';

export class WhiskersCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): vscode.CompletionItem[] | undefined {
        const offset = document.offsetAt(position);
        const text = document.getText();

        if (shouldOfferMetadataCompletions(text, offset)) {
            return METADATA_COMPLETIONS.map((completion, index) => {
                const item = new vscode.CompletionItem(
                    {
                        label: completion.label,
                        detail: ` ${completion.description}`,
                        description: 'Whiskers',
                    },
                    vscode.CompletionItemKind.Variable,
                );
                item.insertText = completion.name;
                item.detail = completion.name === 'root'
                    ? 'Whiskers root context'
                    : 'Whiskers iteration metadata';
                item.documentation = completion.description;
                item.sortText = index.toString().padStart(2, '0');
                item.filterText = `${completion.name} ${completion.label}`;
                return item;
            });
        }

        if (!shouldOfferSigilCompletions(text, offset)) return undefined;

        return SIGIL_COMPLETIONS.map((completion, index) => {
            const item = new vscode.CompletionItem(
                {
                    label: completion.sigil,
                    detail: ` ${completion.label}`,
                    description: 'Whiskers',
                },
                vscode.CompletionItemKind.Operator,
            );
            item.insertText = completion.sigil;
            item.detail = 'Whiskers sigil';
            item.documentation = completion.description;
            item.sortText = index.toString().padStart(2, '0');
            item.filterText = `${completion.sigil} ${completion.label}`;
            return item;
        });
    }
}