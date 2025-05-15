import fs from "node:fs";
fs.writeFileSync("bin/pid", `${process.pid}`)
import Server from "./src/Server.ts";
const server = new Server();
