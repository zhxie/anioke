import { contextBridge, ipcRenderer } from "electron";

process.once("loaded", () => {
  contextBridge.exposeInMainWorld("server", {
    onServerReady: (callback) => ipcRenderer.on("server_ready", callback),
    ready: () => ipcRenderer.invoke("ready"),
  });
  contextBridge.exposeInMainWorld("player", {
    onPlay: (callback) => ipcRenderer.on("play", callback),
    onStop: (callback) => ipcRenderer.on("stop", callback),
    end: () => ipcRenderer.invoke("end"),
  });
});
