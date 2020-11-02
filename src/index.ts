import socket from "socket.io";

import app from "./App";
import CONFIG from "./config/config";

import "./config/db";

const PORT = 3001;

const server = app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});

// tslint:disable-next-line: no-var-requires
export const io = require("socket.io")(server, { origins: "*:*" });
// export const socket = io.listen(server)
// export io;

// module.exports = io;

// tslint:disable-next-line: no-var-requires
export const sql = require("mssql");
export const sqlConfig = {
  user: "djw",
  password: CONFIG.SqlPass,
  server: "desktop-8a9vk88\\sqlexpress",
  database: "Personality",
};


// connect to your database
export const pool = sql.connect(sqlConfig, (err: any) => {
  if (err) {
    console.log(err);
  } else {
    console.log("sql connected success");
    // create Request object
  }
});

sql.on("error", (err:any) => {
  // ... error handler
  console.log("Sql database connection error ", err);
});
