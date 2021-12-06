import { MarkdownPostProcessorContext, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, GraphvizSettings, GraphvizSettingsTab } from './setting';
import { Processors } from './processors';

// Remember to rename these classes and interfaces!


export default class GraphvizPlugin extends Plugin {
  settings: GraphvizSettings;

  async onload() {
    console.debug('Load graphviz plugin')
    await this.loadSettings();
    this.addSettingTab(new GraphvizSettingsTab(this));
    const processors = new Processors(this);
    const imageProcessorDebounce = (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      processors.imageProcessor(source, el, ctx);
    }
    console.debug('add processor for dot');
    this.registerMarkdownCodeBlockProcessor('dot', imageProcessorDebounce)

  }

  onunload() {
    console.debug('Unload graphviz plugin')
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }


  async saveSettings() {
    await this.saveData(this.settings);
  }
}
