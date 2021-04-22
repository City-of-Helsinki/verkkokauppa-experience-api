import { Router } from 'express'

import { GetController } from './api/getController'
const getController = new GetController()

const router = Router()
router.get('/:id', (req, res) => getController.execute(req, res))

export default router
