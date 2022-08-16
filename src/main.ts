import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, GraphvizSettings, GraphvizSettingsTab } from './setting';
import { Processors } from './processors';

// Remember to rename these classes and interfaces!


export default class GraphvizPlugin extends Plugin {
  settings: GraphvizSettings;

  async onload() {
    console.debug('Load graphviz plugin');
    await this.loadSettings();
    this.addSettingTab(new GraphvizSettingsTab(this));
    const processors = new Processors(this);
    const d3Sources = ['https://d3js.org/d3.v5.min.js',
      'https://unpkg.com/@hpcc-js/wasm@0.3.11/dist/index.min.js',
      'https://unpkg.com/d3-graphviz@3.0.5/build/d3-graphviz.js'];


    this.app.workspace.onLayoutReady(() => {
      switch (this.settings.renderer) {
        case 'd3_graphviz':
          for (const src of d3Sources) {
            const script = document.createElement('script');
            script.src = src;
            (document.head || document.documentElement).appendChild(script);
          }
          this.registerMarkdownCodeBlockProcessor('dot', processors.d3graphvizProcessor.bind(processors));
          break;
        default:
          this.registerMarkdownCodeBlockProcessor('dot', processors.imageProcessor.bind(processors));
      }
    });
  }



  onunload() {
    console.debug('Unload graphviz plugin');
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    return Promise.resolve();
  }


  async saveSettings() {
    await this.saveData(this.settings);
  }
}
