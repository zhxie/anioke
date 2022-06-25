import { contextBridge } from "electron";
import express from "express";
import { internalIpV4Sync } from "internal-ip";

const server = express();

server.get("/connect", (_req, res) => {
  res.send({
    mv: ["bilibili", "youtube"],
    lyrics: ["petit_lyrics"],
  });
});

const listener = server.listen(0, "0.0.0.0");

process.once("loaded", () => {
  contextBridge.exposeInMainWorld("ip", internalIpV4Sync());
  contextBridge.exposeInMainWorld("port", listener.address().port);
});
