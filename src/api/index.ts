import { Router } from 'express';

// import { ES, Scrape, User } from './routes/router';



import ES from './routes/ES/es.route';
import Scrape from './routes/Scrape/scrape.route';

const router: Router = Router();

router.use('/scrape', Scrape);
router.use('/es', ES);
// router.use('/user', User);

router.get('/', (req, res) => {
  res.render('index');
});


// module.exports = {
//   path: '/api/',
//   handler: router
// }
export default router;



