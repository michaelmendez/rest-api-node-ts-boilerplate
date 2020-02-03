// import express from 'express';

// const router = express.Router();

// Define routes handling profile requests

// module.exports = router

// /api/scrape/...
// import { Request, Response, Router } from 'express';
// Define routes handling profile requests

// POST route for updating data////////////login
// router.post('/auth/login', (req: Request, res: Response) => {
//   if (req.body.email && req.body.password) {
//     User.authenticate(req.body.email, req.body.password, function(error, user) {
//       if (error || !user) {
//         const err = new Error('Wrong email or password.');
//         err.status = 401;
//         return next(err);
//       } else {
//         req.session.userId = user._id;
//         return res.redirect('/scrapeHome');
//       }
//     });
//   } else {
//     const err = new Error('All fields required.');
//     err.status = 400;
//     return next(err);
//   }
// });

// /// //////////register
// router.post('/auth/register', (req: Request, res: Response) => {
//   // confirm that user typed same password twice
//   if (req.body.password !== req.body.passwordConf) {
//     let err = new Error('Passwords do not match.');
//     err.status = 400;
//     res.send('passwords dont match');
//     return next(err);
//   }
//   if (req.body.email && req.body.name && req.body.password && req.body.passwordConf) {
//     const userData = {
//       email: req.body.email,
//       name: req.body.name,
//       password: req.body.password,
//     };

//     User.create(userData, function(error, user) {
//       if (error) {
//         return next(error);
//       } else {
//         req.session.userId = user._id;
//         return res.redirect('/scrapeHome');
//       }
//     });
//   } else {
//     let err = new Error('All fields required.');
//     err.status = 400;
//     return next(err);
//   }
// });

// // Get All Users
// router.get('/users', (req: Request, res: Response) => {
//   User.find((err, users) => {
//     if (err) {
//       res.json({
//         info: 'error during find users',
//         error,
//         err,
//       });
//     }
//     res.json({
//       info: 'users found successfully',
//       data: users,
//     });
//   });
// });

// // Create User
// router.post('/user', (req: Request, res: Response) => {
//   // res.json(req.body)
//   const newUser = new User(req.body);
//   newUser.save(function(err) {
//     if (err) {
//       res.json({
//         info: 'error during create user',
//         error: err,
//       });
//     } else {
//       res.json({
//         info: 'user created successfully',
//       });
//     }
//   });
// });
// // Get User By Id
// router.get('/user/:id', (req: Request, res: Response) => {
//   User.findById(req.params.id, (err, user) => {
//     if (err) {
//       res.json({
//         info: 'error during find user',
//         error: err,
//       });
//     }
//     if (user) {
//       res.json({
//         info: 'user found successfully',
//         data: user,
//       });
//     } else {
//       res.json({
//         info: 'user not found',
//       });
//     }
//   });
// });

// // Update User
// router.put('/user/:id', (req: Request, res: Response) => {
//   User.findById(req.params.id, (err, user) => {
//     if (err) {
//       res.json({
//         info: 'error during find user',
//         error: err,
//       });
//     }
//     if (user) {
//       _.merge(user, req.body);
//       user.save(err => {
//         res.json({
//           info: 'error during update user',
//           error: err,
//         });
//       });
//       res.json({
//         info: 'user update successfully',
//       });
//     } else {
//       res.json({
//         info: 'user not found',
//       });
//     }
//   });
// });

// // GET for logout logout
// router.get('/logout', (req: Request, res: Response) => {
//   res.send('yoooooooooooo');
// });

// export const User: Router = router;
