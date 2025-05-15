import fs from "node:fs";
console.log(`[NetDis] Stopped by User`);
const pid = fs.readFileSync("bin/pid")
process.kill(pid)