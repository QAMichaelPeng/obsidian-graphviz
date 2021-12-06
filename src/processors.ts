import { MarkdownPostProcessorContext } from 'obsidian';
import * as tmp from 'tmp';
import * as fs from 'fs';
import { spawn } from 'child_process'
import GraphvizPlugin from './main';

export class Processors {
  plugin: GraphvizPlugin;

  constructor(plugin: GraphvizPlugin) {
    this.plugin = plugin;
  }

  private writeDotFile(sourceFile: string,
                       callback: (_: Uint8Array) => void,
                       errback: (_: string) => void) {
    const cmdPath = this.plugin.settings.dotPath;
    const parameters = [ '-Tpng', sourceFile ];

    console.debug(`starting dot process ${cmdPath}, ${parameters}`);
    const dotProcess = spawn(cmdPath, parameters);
    const outData: Array<Uint8Array> = [];
    let errData = '';

    dotProcess.stdout.on('data', function (data) {
      outData.push(data)
    });
    dotProcess.stderr.on('data', function (data) {
      errData += data;
    });
    dotProcess.stdin.end();
    dotProcess.on('exit', function (code) {
      if (code !== 0) {
        if (errback) {
          errback(`"${cmdPath} ${parameters}" failed, error code: ${code}, stderr: ${errData}`);
        }
      } else {
        callback(Buffer.concat(outData));
      }
    });
    dotProcess.on('error', function (err: Error) {
      errback(`"${cmdPath} ${parameters}" failed, ${err}`);
    })
  }

  private convertToPng(source: string,
                       callback: (_: Uint8Array) => void,
                       errback: (_: string) => void) {
    const self = this;
    tmp.file(function (err, tmpPath, fd, _/* cleanupCallback */) {
      if (err) throw err;

      fs.write(fd, source, function (err) {
        if (err) {
          errback(`write to ${tmpPath} error ${err}`);
          return;
        }
        fs.close(fd,
          function (err) {
            if (err) {
              errback(`close ${tmpPath} error ${err}`);
              return;
            }
            self.writeDotFile(tmpPath, callback, errback);
          }
        );
      });

    });

  }

  public imageProcessor(source: string, el: HTMLElement, _: MarkdownPostProcessorContext): void {
    console.debug('Call image processor');
//make sure url is defined. once the setting gets reset to default, an empty string will be returned by settings
    this.convertToPng(source, function (pngData) {
      const mime = 'image/png';
      const encoding = 'base64';
      const base64Image = new Buffer(pngData).toString(encoding);
      const uri = 'data:' + mime + ';' + encoding + ',' + base64Image;
      const img = document.createElement('img');
      img.src = uri
      el.appendChild(img)
    }, function (errMessage: string) {
      console.error('convert to png error', errMessage)
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      pre.appendChild(code);
      code.setText(errMessage);
      el.appendChild(pre);
    });
  }
}
