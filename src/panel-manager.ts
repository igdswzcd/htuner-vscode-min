export class ToolPanelManager {
  public static panels: Array<any> = [];

  public static closePanel() {
    if (ToolPanelManager.panels.length > 0) {
      const panelAndProxy = ToolPanelManager.panels.pop();
      if (panelAndProxy.panel) {
        panelAndProxy.panel.dispose();
        panelAndProxy.proxy.close();
      }
      ToolPanelManager.panels = [];
    }
  }
}
