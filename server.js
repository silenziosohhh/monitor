const path = require("path");

const express = require("express");
const { spawn } = require("child_process");
const services = require("./api/routes/services");

const app = express();

const monitor = spawn("python", ["-u", path.join(__dirname, "monitor", "monitor.py")]);

monitor.stdout.on("data", (data) => console.log(`[Monitor] ${data}`));
monitor.stderr.on("data", (data) => console.error(`[Monitor Err] ${data}`));

app.use(express.static(path.join(__dirname, "frontend")));

app.use("/api/services", services);

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "frontend/index.html"));
});

app.listen(3000, () => {
  console.log("Server in ascolto sulla porta 3000");
});
