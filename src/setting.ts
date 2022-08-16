import { PluginSettingTab, Setting } from 'obsidian';
import GraphvizPlugin from './main';

export interface GraphvizSettings {
  dotPath: string;
  renderer: string;
}

export const DEFAULT_SETTINGS: GraphvizSettings = {
  dotPath: 'dot',
  renderer: 'dot'
};

export class GraphvizSettingsTab extends PluginSettingTab {
  plugin: GraphvizPlugin;

  constructor(plugin: GraphvizPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const {containerEl} = this;

    containerEl.empty();

    new Setting(containerEl)
    .setName('Graphviz renderer')
    .setDesc('Please choose the Graphviz renderer, after that, you will need to restart obsidian.')
    .addDropdown(dropdown => dropdown
      .addOption('dot', 'dot')
      .addOption('d3_graphviz', 'D3 Graphviz (experimental)')
      .setValue(this.plugin.settings.renderer)
      .onChange(async (value) => {
        this.plugin.settings.renderer = value;
        await this.plugin.saveSettings();
      }));

    new Setting(containerEl).setName('Dot Path')
      .setDesc('Dot executable path')
      .addText(text => text.setPlaceholder(DEFAULT_SETTINGS.dotPath)
        .setValue(this.plugin.settings.dotPath)
        .onChange(async (value) => {
            this.plugin.settings.dotPath = value;
            await this.plugin.saveSettings();
          }
        )
      );
  }
}
