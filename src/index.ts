import socket from 'socket.io'

import app from './App';
import CONFIG from './config/config';

import './config/db';

// const io = require('socket.io');
// import io from 'socket.io'

const PORT = 3001;

const server = app.listen(PORT, err => {
  if (err) {
    return console.log(err);
  }

  console.log(`Server is listening on ${PORT}`);
});

// const globalAny:any = global

// globalAny.
export const io = require('socket.io')(server, { origins: '*:*'})
// export const socket = io.listen(server)
// export io;

// module.exports = io;



