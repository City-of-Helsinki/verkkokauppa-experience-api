import { Router } from 'express'

import { GetPaymentRequestDataController } from './api/getPaymentRequestDataController'

const getPaymentRequestDataController = new GetPaymentRequestDataController();

const router = Router()
router.get('/', (req, res) => getPaymentRequestDataController.execute(req, res))

export default router
