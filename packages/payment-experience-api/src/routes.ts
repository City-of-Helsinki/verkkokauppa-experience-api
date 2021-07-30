import { Router } from 'express'

import { CreatePaymentController } from './api/createPaymentController'

const createPaymentController = new CreatePaymentController()

const router = Router()
router.post('/', (req, res) => createPaymentController.execute(req, res))

export default router
