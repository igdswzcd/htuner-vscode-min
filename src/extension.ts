// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ProxyManager } from './proxy-manager';
import { Utils } from './utils';
const fs = require('fs');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // 注册主题修改监听
  Utils.registerVSCThemeChangeListener();
  Utils.initVscodeCache(context, true);
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "vsc-ext-iframe" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    'vsc-ext-iframe.helloWorld',
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage('Hello World from vsc-ext-iframe!');
    }
  );

  context.subscriptions.push(disposable);

  context.subscriptions.push(
    vscode.commands.registerCommand('vsc-ext-iframe.open', async () => {
      const tuningConfigObj = Utils.getConfigJson(context).tuningConfig[0];
      context.globalState.update('tuningIp', tuningConfigObj.ip);
      context.globalState.update('tuningPort', tuningConfigObj.port);
      const { proxyServerPort, proxy } = await ProxyManager.createProxyServer(
        context,
        tuningConfigObj.ip,
        tuningConfigObj.port
      );
      Utils.navToIFrame(context, proxyServerPort, proxy);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'vsc-ext-iframe.address',
      async (address?: string) => {
        if (!address) {
          address = await vscode.window.showInputBox({
            placeHolder: 'Please input a valid address like x.x.x.x:8086',
            prompt: 'Enter ip:port to update',
          });
        }
        if (address) {
          const resourcePath = Utils.getExtensionFileAbsolutePath(
            context,
            'out/assets/config.json'
          );
          let data = [
            {
              ip: address.split(':')[0],
              port: address.split(':')[1],
            },
          ];
          context.globalState.update('tuningIp', data[0].ip);
          context.globalState.update('tuningPort', data[0].port);
          let config = Utils.getConfigJson(context);
          config.tuningConfig = data;
          fs.writeFileSync(resourcePath, JSON.stringify(config));
        }
      }
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
