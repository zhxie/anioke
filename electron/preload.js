import { contextBridge } from "electron";
import { internalIpV4Sync } from "internal-ip";
import Server from "../server/server";

const server = new Server();

process.once("loaded", () => {
  contextBridge.exposeInMainWorld("ip", internalIpV4Sync());
  contextBridge.exposeInMainWorld("port", server.port());
});
