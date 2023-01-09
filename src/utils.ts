import * as vscode from 'vscode';
import { ToolPanelManager } from './panel-manager';
import { getHtml } from './template';
const fs = require('fs');
const path = require('path');
export class Utils {
  /**
   * 初始化插件上下文
   * @param context 插件上下文
   * @param isInitDefaultPort 是否需要初始化端口
   */
  public static initVscodeCache(
    context: vscode.ExtensionContext,
    isInitDefaultPort: boolean = false
  ) {
    context.globalState.update('tuningIp', null);
    context.globalState.update('tuningPort', null);
    context.globalState.update('tuningToken', null);
    context.globalState.update('tuningSession', null);
    if (isInitDefaultPort) {
      context.globalState.update('defaultPort', 3661);
    }
    const json = Utils.getConfigJson(context);
    if (json.tuningConfig.length > 0) {
      context.globalState.update('tuningIp', json.tuningConfig[0].ip);
      context.globalState.update('tuningPort', json.tuningConfig[0].port);
    }
  }
  /**
   * 获取配置信息
   * @param context 插件上下文
   */
  public static getConfigJson(context: vscode.ExtensionContext): any {
    const resourcePath = Utils.getExtensionFileAbsolutePath(
      context,
      'out/assets/config.json'
    );
    const data = fs.readFileSync(resourcePath);
    const buf = Buffer.from(JSON.parse(JSON.stringify(data)));
    return JSON.parse(buf.toString());
  }
  /**
   * 获取某个扩展文件绝对路径
   * @param context 上下文
   * @param relativePath 扩展中某个文件相对于根目录的路径，如 images/test.jpg
   */
  public static getExtensionFileAbsolutePath(
    context: vscode.ExtensionContext,
    relativePath: string
  ) {
    return path.join(context.extensionPath, relativePath);
  }
  /**
   * 跳转打开登录页面
   * @param global 上下文
   * @param defaultPort 代理服务的端口
   * @param proxy 代理后的对象
   */
  static async navToIFrame(context: any, defaultPort: number, proxy: any) {
    const panel = vscode.window.createWebviewPanel(
      'login',
      '我是panel标题',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );
    panel.webview.onDidReceiveMessage((message) => {});
    ToolPanelManager.panels = [{ panel, proxy }];
    // 相应panel的关闭事件
    panel.onDidDispose(() => {
      ToolPanelManager.closePanel();
    }, null);
    let colorTheme = 'dark';
    const colorThemeStr: any = vscode.workspace
      .getConfiguration()
      .get('workbench.colorTheme');
    if (colorThemeStr.indexOf('Light') !== -1) {
      colorTheme = 'light';
    }
    let messagesToPost = {
      ideAddress: `http://127.0.0.1:${defaultPort}`,
      serverAddr: context.globalState.get('tuningIp'),
      serverPort: context.globalState.get('tuningPort'),
      defaultPort,
      ideType: 'isVscode',
      theme: colorTheme,
    };
    let extraData = {
      pageLoadingText: '页面加载中...',
    };
    panel.webview.html = getHtml(messagesToPost, extraData);
  }
  /**
   * 注册VSCode插件事件侦听--主题配置修改
   *
   * @param context 上下文
   */
  public static registerVSCThemeChangeListener() {
    vscode.workspace.onDidChangeConfiguration(() => {
      let colorTheme = 'dark';
      const colorThemeStr: any = vscode.workspace
        .getConfiguration()
        .get('workbench.colorTheme');
      if (colorThemeStr.indexOf('Light') !== -1) {
        colorTheme = 'light';
      }
      if (ToolPanelManager.panels.length) {
        const changeThemeObj: any = {
          theme: colorTheme,
          messageType: 'changeTheme',
        };
        ToolPanelManager.panels[0].panel.webview.postMessage(changeThemeObj);
      }
      Utils.postMsg2Webviews(colorTheme);
    });
  }
  private static postMsg2Webviews(colorTheme: string) {
    ToolPanelManager.panels.forEach((pair) => {
      pair.panel.webview.postMessage({
        cmd: 'handleVscodeMsg',
        type: 'colorTheme',
        data: { colorTheme },
      });
    });
  }
}
