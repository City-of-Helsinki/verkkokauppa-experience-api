import { Router } from 'express'
import { GetController } from './api/getController'

const router = Router()

const getController = new GetController()

router.get('/:namespace', (req, res) => getController.execute(req, res))

export default router
