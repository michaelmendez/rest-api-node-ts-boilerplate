import app from './App';
import CONFIG from './config/config';
import './config/db';

const PORT = CONFIG.PORT;

app.listen(PORT, err => {
  if (err) {
    return console.log(err);
  }

  console.log(`Server is listening on ${PORT}`);
});
