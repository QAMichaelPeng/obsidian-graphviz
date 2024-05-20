import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from "obsidian";
import type GraphvizPlugin from "src/main";

interface IGraphCompletion {
  label: string;
}

export class Suggesters extends EditorSuggest<IGraphCompletion> {
  app: App;
  private plugin: GraphvizPlugin;

  constructor(app: App, plugin: GraphvizPlugin) {
    super(app);
    this.app = app;
    this.plugin = plugin;

    // @ts-ignore
    this.scope.register(["Shift"], "Enter", (evt: KeyboardEvent) => {
      // @ts-ignore
      this.suggestions.useSelectedItem(evt);
      return false;
    });
  }

  getSuggestions(context: EditorSuggestContext): IGraphCompletion[] {
    const suggestions = this.getGraphSuggestions(context);
    if (suggestions.length) {
      return suggestions;
    }
    return [];
  }

  getGraphSuggestions(context: EditorSuggestContext): IGraphCompletion[] {
    const line = context.editor.getLine(context.end.line);
    return "dot/neato/fdp/sfdp/circo/osage/patchwork"
        .split("/")
        .map((app) => ({ label: `${app}` }));
  }

  renderSuggestion(suggestion: IGraphCompletion, el: HTMLElement): void {
    el.setText("insert " + suggestion.label + " example");
  }

  selectSuggestion(suggestion: IGraphCompletion, event: KeyboardEvent | MouseEvent): void {
    const { editor } = this.context;

    const hints = new Map();
    hints.set("dot", [ "/*", "a -> b -> a;", "a [color=blue];", "*/" ]);
    hints.set("neato", [ `mode="major";  // KK/sgd/hier/ipsep`, "/* a -- b -- c; */" ]);
    hints.set("patchwork", [ `/* "foo" [area=100 fillcolor=gold] */` ]);

    const grouping = (suggestion.label.startsWith("dot")) ? "digraph" : "graph";
    const result = `
${grouping} ${suggestion.label[0]} {
    layout=${suggestion.label};
` + ((hints.get(suggestion.label) || []).map((l) => `    ${l}`).join("\n"));

    editor.replaceRange(result + "\n\n}", this.context.end);
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    file: TFile
  ): EditorSuggestTriggerInfo {
    const triggerPhrase = "```dot";
    const startPos = this.context?.start || {
      line: cursor.line,
      ch: cursor.ch - triggerPhrase.length,
    };

    if (!editor.getRange(startPos, cursor).startsWith(triggerPhrase)) {
      return null;
    }

    console.dir(editor.getLine(cursor.line + 1));

    if (editor.getLine(cursor.line + 1) != "```") {
      return null;
    }

    return {
      start: startPos,
      end: cursor,
      query: editor.getRange(startPos, cursor).substring(triggerPhrase.length),
    };
  }
}
