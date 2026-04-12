// Helper script to execute commands on VPS via SSH
const { Client } = require("ssh2");

const config = {
  host: "200.234.238.94",
  port: 22,
  username: "root",
  password: process.argv[3] || "",
};

const command = process.argv[2] || "echo hello";

const conn = new Client();
conn
  .on("ready", () => {
    conn.exec(command, { pty: true }, (err, stream) => {
      if (err) {
        console.error("EXEC_ERROR:", err.message);
        conn.end();
        process.exit(1);
      }
      let output = "";
      stream
        .on("close", (code) => {
          conn.end();
          process.exit(code || 0);
        })
        .on("data", (data) => {
          const str = data.toString();
          output += str;
          process.stdout.write(str);
        })
        .stderr.on("data", (data) => {
          process.stderr.write(data.toString());
        });
    });
  })
  .on("error", (err) => {
    console.error("SSH_ERROR:", err.message);
    process.exit(1);
  })
  .connect(config);
