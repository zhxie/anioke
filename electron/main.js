import { app, BrowserWindow, ipcMain, protocol } from "electron";
import express from "express";
import proxy from "express-http-proxy";
import path from "path";
import url from "url";
import Server from "../server/server";

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
  const onPlay = (sequence, title, artist, mv, lyrics, offset) => {
    mainWindow.webContents.send(
      "play",
      sequence,
      title,
      artist,
      url.pathToFileURL(mv).toString().replace("file", "anifile"),
      url.pathToFileURL(lyrics).toString().replace("file", "anifile"),
      offset
    );
  };
  const onStop = () => {
    mainWindow.webContents.send("stop");
  };
  const onSeek = (time) => {
    mainWindow.webContents.send("seek", time);
  };
  const onSwitchTrack = () => {
    mainWindow.webContents.send("switch-track");
  };
  const onOffset = (offset) => {
    mainWindow.webContents.send("offset", offset);
  };
  const host = app.isPackaged
    ? express.static(__dirname)
    : proxy("http://localhost:3000");
  let server = new Server(
    host,
    onPlay,
    onStop,
    onSeek,
    onSwitchTrack,
    onOffset
  );

  // Register renderer-to-main IPC.
  ipcMain.handle("ready", server.handleReady);
  ipcMain.handle("end", server.handlePlayerEnded);
});

app.on("window-all-closed", () => {
  protocol.unregisterProtocol("anifile");
  app.quit();
});
