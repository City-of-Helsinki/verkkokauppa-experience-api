import { Router } from 'express'

import { GetController } from './api/getController'
import { Health } from './api/health'
const getController = new GetController()
const healthController = new Health()

const router = Router()
router.get('/health', (req, res) => healthController.execute(req, res))
router.get('/:productId', (req, res) => getController.execute(req, res))

export default router
