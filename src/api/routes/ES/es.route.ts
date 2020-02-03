// import verifyToken from '../../helpers/verifyToken';
import { Router } from 'express';

import Controller from './es.controller';

const router: Router = Router();
const controller = new Controller();

router.get('/health', controller.esHealth);

router.get('/catIndicies', controller.esCatIndicies);

router.get('/createIndex/:word', controller.esCreateIndex);

router.delete('/deleteIndex/:word', controller.esDeleteIndex);

router.post('/addDoc', controller.esAddDoc);


router.post('/create', controller.esCreate);
router.post('/search', controller.esSearch);
router.post('/searchIndex', controller.esSearchIndex);
router.post('/streamResults', controller.esStreamResults);

export default router;
