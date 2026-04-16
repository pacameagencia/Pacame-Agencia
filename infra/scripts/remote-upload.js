// Upload a local file to VPS via SSH
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
  console.error("Usage: node remote-upload.js <localPath> <remotePath> <password>");
  process.exit(1);
}

const conn = new Client();
conn
  .on("ready", () => {
    conn.sftp((err, sftp) => {
      if (err) {
        console.error("SFTP_ERROR:", err.message);
        conn.end();
        process.exit(1);
      }
      const readStream = fs.createReadStream(localPath);
      const writeStream = sftp.createWriteStream(remotePath);
      writeStream.on("close", () => {
        console.log("Uploaded:", remotePath);
        conn.end();
        process.exit(0);
      });
      writeStream.on("error", (e) => {
        console.error("WRITE_ERROR:", e.message);
        conn.end();
        process.exit(1);
      });
      readStream.pipe(writeStream);
    });
  })
  .on("error", (err) => {
    console.error("SSH_ERROR:", err.message);
    process.exit(1);
  })
  .connect(config);
