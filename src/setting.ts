import { PluginSettingTab, Setting } from 'obsidian';
import GraphvizPlugin from './main';

export interface GraphvizSettings {
  dotPath: string;
}

export const DEFAULT_SETTINGS: GraphvizSettings = {
  dotPath: 'dot',
}

export class GraphvizSettingsTab extends PluginSettingTab {
  plugin: GraphvizPlugin;

  constructor(plugin: GraphvizPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const {containerEl} = this;

    containerEl.empty();

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
