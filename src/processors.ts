import { MarkdownPostProcessorContext } from 'obsidian';
import * as tmp from 'tmp';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { createHash } from 'crypto';
import GraphvizPlugin from './main';
// import {graphviz} from 'd3-graphviz'; => does not work, ideas how to embed d3 into the plugin?

export class Processors {
  plugin: GraphvizPlugin;

  constructor(plugin: GraphvizPlugin) {
    this.plugin = plugin;
  }
  
  imageMimeType = new Map<string, string>([
        ['png', 'image/png'],
        ['svg', 'image/svg+xml']
    ]);

  private async writeDotFile(sourceFile: string): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
      const cmdPath = this.plugin.settings.dotPath;
      const imageFormat = this.plugin.settings.imageFormat;
      const parameters = [ `-T${imageFormat}`, `-Gbgcolor=transparent`, `-Gstylesheet=obs-gviz.css`, sourceFile ];

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

  private async convertToImage(source: string): Promise<Uint8Array> {
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
    const stringBeforeBrace = source.split("{", 1)[0]?.trim() || "";
    const wordsBeforeBrace = stringBeforeBrace.split();

    try {
      console.debug('Call image processor');
      //make sure url is defined. once the setting gets reset to default, an empty string will be returned by settings
      const imageData = await this.convertToImage(source);
      const blob = new Blob([ imageData ], {'type': this.imageMimeType.get(this.plugin.settings.imageFormat)});
      const url = window.URL || window.webkitURL;
      const blobUrl = url.createObjectURL(blob);
      const img = document.createElement('img');
      img.setAttribute("class", "graphviz " + wordsBeforeBrace.join(" "));
      img.setAttribute("src", blobUrl);
      el.appendChild(img);
    } catch (errMessage) {
      console.error('convert to image error', errMessage);
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      pre.appendChild(code);
      code.setText(errMessage);
      el.appendChild(pre);
    }
  }
  
  public async d3graphvizProcessor(source: string, el: HTMLElement, _: MarkdownPostProcessorContext): Promise<void> {
    console.debug('Call d3graphvizProcessor');

    const stringBeforeBrace = source.split("{", 1)[0]?.trim() || "";
    const wordsBeforeBrace = stringBeforeBrace.split();

    const div = document.createElement('div');
    const graphId = 'd3graph_' + createHash('md5').update(source).digest('hex').substring(0, 6);
    div.setAttr('id', graphId);
    div.setAttr('style', 'text-align: center');
    div.setAttr('class', 'graphviz ' + wordsBeforeBrace.join(" "));
    el.appendChild(div);
    const script = document.createElement('script');
    // graphviz(graphId).renderDot(source); => does not work, ideas how to use it?
    // Besides, sometimes d3 is undefined, so there must be a proper way to integrate d3.
    const escapedSource = source.replaceAll('\\', '\\\\').replaceAll('`','\\`');
    script.text =
      `if( typeof d3 != 'undefined') { 
        d3.select("#${graphId}").graphviz()
        .onerror(d3error)
       .renderDot(\`${escapedSource}\`);
    }
    function d3error (err) {
        d3.select("#${graphId}").html(\`<div class="d3graphvizError"> d3.graphviz(): \`+err.toString()+\`</div>\`);
        console.error('Caught error on ${graphId}: ', err);
    }`;
    el.appendChild(script);
  }
}
