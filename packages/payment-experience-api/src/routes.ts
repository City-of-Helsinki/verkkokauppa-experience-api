import { Router } from 'express'

import { CreatePaymentController } from './api/createPaymentController'
import {GetPaymentMethodListController} from "./api/getPaymentMethodListController";

const createPaymentController = new CreatePaymentController()
const getPaymentMethodListCtrl = new GetPaymentMethodListController();

const router = Router()
router.post('/', (req, res) => createPaymentController.execute(req, res))
router.get('/get-payment-method-list', (req, res) => getPaymentMethodListCtrl.execute(req, res))

export default router
