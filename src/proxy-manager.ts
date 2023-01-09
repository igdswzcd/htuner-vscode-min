import * as vscode from 'vscode';
const httpProxy = require('http-proxy');
const cProcess = require('child_process');

export class ProxyManager {
  static authValue: any;
  /**
   * 判断端口是否被占用
   * @param port 端口号
   * @returns 该端口是否被占用
   */
  static isPortOpen(port: string | number) {
    const order = `netstat -ano|findstr "${port}"`;
    return new Promise((resolve, reject) => {
      cProcess.exec(order, (error: any, stdout: any, stderr: any) => {
        if (stdout === '') {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
  /**
   * 创建代理服务
   * @returns Promise<>
   */
  static async createProxyServer(
    context: vscode.ExtensionContext,
    ip: string,
    port: string | number
  ) {
    const sessionDefaultPort = context.globalState.get('defaultPort');
    let proxyServerPort = sessionDefaultPort
      ? Number(sessionDefaultPort)
      : 3661;

    const resFlag = await ProxyManager.isPortOpen(proxyServerPort);
    if (resFlag) {
      proxyServerPort += 1;
    }
    const target = `https://${ip}:${port}`;
    const config = {
      target,
      xfwd: false,
      selfHandleResponse: false,
      secure: false,
      changeOrigin: true,
      ws: true,
    };
    const proxy = httpProxy.createProxyServer(config).listen(proxyServerPort);
    proxy.on('proxyRes', (proxyRes: any, req: any, res: any) => {
      const newRes = {};
      let index = proxyRes.rawHeaders.indexOf('token');
      let authValue = '';
      if (index !== -1) {
        const token = 'token';
        authValue = proxyRes.rawHeaders[index + 1];
        newRes[token] = authValue;
        ProxyManager.authValue = authValue;
      }
      index = proxyRes.rawHeaders.indexOf('Content-Type');
      if (index !== -1) {
        newRes['Content-Type'] = proxyRes.rawHeaders[index + 1];
      }
      const statusCode = proxyRes.statusCode;
      res.writeHead(statusCode, newRes);
    });
    return Promise.resolve({ proxyServerPort, proxy });
  }
}
