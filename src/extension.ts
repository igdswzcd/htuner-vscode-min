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
  // 初始化全局变量
  Utils.initVscodeCache(context, true);

  // 关联左侧欢迎树按钮，打开页面
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

  // 开发时使用的命令，可以使用该指令修改ip:port值
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
