const { contextBridge } = require("electron");

process.once("loaded", () => {
  contextBridge.exposeInMainWorld("versions", process.versions);
});
