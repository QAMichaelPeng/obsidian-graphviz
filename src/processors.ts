import { MarkdownPostProcessorContext } from 'obsidian';
import * as tmp from 'tmp';
import * as fs from 'fs';
import { spawn } from 'child_process';
import GraphvizPlugin from './main';

export class Processors {
  plugin: GraphvizPlugin;

  constructor(plugin: GraphvizPlugin) {
    this.plugin = plugin;
  }

  private async writeDotFile(sourceFile: string): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
      const cmdPath = this.plugin.settings.dotPath;
      const parameters = [ '-Tpng', sourceFile ];

      console.debug(`Starting dot process ${cmdPath}, ${parameters}`);
      const dotProcess = spawn(cmdPath, parameters);
      const outData: Array<Uint8Array> = [];
      let errData = '';

      dotProcess.stdout.on('data', function (data) {
        outData.push(data);
      });
      dotProcess.stderr.on('data', function (data) {
        errData += data;
      });
      dotProcess.stdin.end();
      dotProcess.on('exit', function (code) {
        if (code !== 0) {
          reject(`"${cmdPath} ${parameters}" failed, error code: ${code}, stderr: ${errData}`);
        } else {
          resolve(Buffer.concat(outData));
        }
      });
      dotProcess.on('error', function (err: Error) {
        reject(`"${cmdPath} ${parameters}" failed, ${err}`);
      });
    });
  }

  private async convertToPng(source: string): Promise<Uint8Array> {
    const self = this;
    return new Promise<Uint8Array>((resolve, reject) => {
      tmp.file(function (err, tmpPath, fd, _/* cleanupCallback */) {
        if (err) reject(err);

        fs.write(fd, source, function (err) {
          if (err) {
            reject(`write to ${tmpPath} error ${err}`);
            return;
          }
          fs.close(fd,
            function (err) {
              if (err) {
                reject(`close ${tmpPath} error ${err}`);
                return;
              }
              return self.writeDotFile(tmpPath).then(data => resolve(data)).catch(message => reject(message));
            }
          );
        });
      });
    });
  }

  public async imageProcessor(source: string, el: HTMLElement, _: MarkdownPostProcessorContext): Promise<void> {
    try {
      console.debug('Call image processor');
      //make sure url is defined. once the setting gets reset to default, an empty string will be returned by settings
      const pngData = await this.convertToPng(source);
      const blob = new Blob([ pngData ], {'type': 'image/png'});
      const url = window.URL || window.webkitURL;
      const blobUrl = url.createObjectURL(blob);
      const img = document.createElement('img');
      img.src = blobUrl;
      el.appendChild(img);
    } catch (errMessage) {
      console.error('convert to png error', errMessage);
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      pre.appendChild(code);
      code.setText(errMessage);
      el.appendChild(pre);
    }
  }
}
