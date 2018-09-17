import { Router } from 'express';
import Controller from './auth.controller';

const user: Router = Router();
const controller = new Controller();

// Sign In
user.post('/authenticate', controller.authenticate);

// Register New User
user.post('/register', controller.register);

export default user;
