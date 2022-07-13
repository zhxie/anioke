import { contextBridge, ipcRenderer } from "electron";

process.once("loaded", () => {
  contextBridge.exposeInMainWorld("server", {
    ready: () => ipcRenderer.invoke("ready"),
  });
  contextBridge.exposeInMainWorld("player", {
    onPlay: (callback) => ipcRenderer.on("play", callback),
    onStop: (callback) => ipcRenderer.on("stop", callback),
    onSeek: (callback) => ipcRenderer.on("seek", callback),
    onSwitchTrack: (callback) => ipcRenderer.on("switch-track", callback),
    onOffset: (callback) => ipcRenderer.on("offset", callback),
    removeAllControllerBinds: () => {
      ipcRenderer.removeAllListeners("play");
      ipcRenderer.removeAllListeners("stop");
      ipcRenderer.removeAllListeners("seek");
      ipcRenderer.removeAllListeners("switch-track");
      ipcRenderer.removeAllListeners("offset");
    },
    end: () => ipcRenderer.invoke("end"),
  });
});
