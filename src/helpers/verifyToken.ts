import * as jwt from 'jwt-then';
import config from '../config/config';
const verifyToken = async (req, res, next): Promise<any> => {
  // check header or url parameters or post parameters for token
  const token: string = req.headers.authorization.split(' ')[1];

  if (!token) {
    return res.status(403).send({ auth: false, message: 'No token provided.' });
  }

  try {
    // verifies secret and checks exp
    const decoded = await jwt.verify(token, config.JWT_ENCRYPTION);
    req.email = decoded.email;
    next();
  } catch (err) {
    res.status(500).send({ auth: false, message: err });
  }
};

export default verifyToken;
