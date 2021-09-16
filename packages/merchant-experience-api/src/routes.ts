import { Router } from 'express'
import { GetController } from './api/getController'
import { Health } from './api/health'

const router = Router()

const getController = new GetController()
const healthController = new Health()

router.get('/health', (req, res) => healthController.execute(req, res))
router.get('/:namespace', (req, res) => getController.execute(req, res))

export default router
