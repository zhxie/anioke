import { app, BrowserWindow, ipcMain, protocol } from "electron";
import express from "express";
import proxy from "express-http-proxy";
import path from "path";
import url from "url";
import Server from "../server/server";

const PROTOCOL = "anifile";

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    useContentSize: true,
    webPreferences: {
      experimentalFeatures: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      callback({ requestHeaders: { Origin: "*", ...details.requestHeaders } });
    }
  );
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          "Access-Control-Allow-Origin": ["*"],
          ...details.responseHeaders,
        },
      });
    }
  );

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

function fileURLToPath(u) {
  return url.fileURLToPath(u.replace(PROTOCOL, "file"));
}

function pathToFileURL(path) {
  return url.pathToFileURL(path).toString().replace("file", PROTOCOL);
}

function handleFile(req, callback) {
  callback({
    path: fileURLToPath(req.url),
  });
}

app.whenReady().then(() => {
  // Register protocols.
  protocol.registerFileProtocol(PROTOCOL, handleFile);

  // Setup window.
  const mainWindow = createWindow();

  // Setup server.
  const play = (sequence, title, artist, mv, lyrics, offset) => {
    mainWindow.webContents.send(
      "play",
      sequence,
      title,
      artist,
      pathToFileURL(mv),
      pathToFileURL(lyrics),
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
  const webUI = app.isPackaged
    ? express.static(__dirname)
    : proxy("http://localhost:3000");
  let server = new Server(play, stop, seek, switchTrack, offset, webUI);

  // Register renderer-to-main IPC.
  ipcMain.handle("ready", server.handleReady);
  ipcMain.handle("end", server.handlePlayerEnded);
});

app.on("window-all-closed", () => {
  protocol.unregisterProtocol(PROTOCOL);
  app.quit();
});
