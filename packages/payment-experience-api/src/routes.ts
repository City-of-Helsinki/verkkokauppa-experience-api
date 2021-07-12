import { Router } from 'express'

import {GetPaymentRequestDataController} from './api/getPaymentRequestDataController'
import {GetPaymentMethodListController} from "./api/getPaymentMethodListController";

const getPaymentRequestDataController = new GetPaymentRequestDataController();
const getPaymentMethodListCtrl = new GetPaymentMethodListController();

const router = Router()
router.get('/', (req, res) => getPaymentRequestDataController.execute(req, res))
router.get('/get-payment-method-list', (req, res) => getPaymentMethodListCtrl.execute(req, res))

export default router
