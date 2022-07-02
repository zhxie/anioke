import { app, BrowserWindow, ipcMain, protocol } from "electron";
import path from "path";
import url from "url";
import Server from "../server/server";

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      experimentalFeatures: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const appURL = app.isPackaged
    ? url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file:",
        slashes: true,
      })
    : "http://localhost:3000";
  mainWindow.loadURL(appURL);

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  return mainWindow;
}

function handleFile(req, callback) {
  callback({
    path: url.fileURLToPath(req.url.replace("anifile", "file")),
  });
}

app.whenReady().then(() => {
  // Register protocols.
  protocol.registerFileProtocol("anifile", handleFile);

  // Setup window.
  const mainWindow = createWindow();

  // Setup server.
  const ready = (ip, port) => {
    mainWindow.webContents.send("server-ready", ip, port);
  };
  const play = (sequence, mv, lyrics, offset) => {
    mainWindow.webContents.send(
      "play",
      sequence,
      url.pathToFileURL(mv).toString().replace("file", "anifile"),
      url.pathToFileURL(lyrics).toString().replace("file", "anifile"),
      offset
    );
  };
  const stop = () => {
    mainWindow.webContents.send("stop");
  };
  const seek = (time) => {
    mainWindow.webContents.send("seek", time);
  };
  const switchTrack = () => {
    mainWindow.webContents.send("switch-track");
  };
  const offset = (offset) => {
    mainWindow.webContents.send("offset", offset);
  };
  let server = new Server(ready, play, stop, seek, switchTrack, offset);

  // Register renderer-to-main IPC.
  ipcMain.handle("ready", () => {
    server.handleReady();
  });
  ipcMain.handle("end", () => {
    server.handlePlayerEnded();
  });
});

app.on("window-all-closed", () => {
  protocol.unregisterProtocol("anifile");
  app.quit();
});
