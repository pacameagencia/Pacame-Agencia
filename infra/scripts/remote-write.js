// Write a local file to VPS via SSH exec stdin
const { Client } = require("ssh2");
const fs = require("fs");

const config = {
  host: "72.62.185.125",
  port: 22,
  username: "root",
  password: process.argv[4] || "",
};

const localPath = process.argv[2];
const remotePath = process.argv[3];

if (!localPath || !remotePath) {
  console.error("Usage: node remote-write.js <localPath> <remotePath> <password>");
  process.exit(1);
}

const content = fs.readFileSync(localPath);

const conn = new Client();
conn
  .on("ready", () => {
    conn.exec(`cat > ${remotePath}`, (err, stream) => {
      if (err) {
        console.error("EXEC_ERROR:", err.message);
        conn.end();
        process.exit(1);
      }
      stream
        .on("close", (code) => {
          console.log("OK:", remotePath);
          conn.end();
          process.exit(code || 0);
        })
        .on("data", (data) => process.stdout.write(data.toString()))
        .stderr.on("data", (data) => process.stderr.write(data.toString()));
      stream.end(content);
    });
  })
  .on("error", (err) => {
    console.error("SSH_ERROR:", err.message);
    process.exit(1);
  })
  .connect(config);
