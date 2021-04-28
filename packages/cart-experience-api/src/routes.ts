import { Router } from 'express'

import { CreateController } from './api/createController'
import { GetController } from './api/getController'
const createController = new CreateController()
const getController = new GetController()

const router = Router()
router.post('/', (req, res) => createController.execute(req, res))
router.get('/:id', (req, res) => getController.execute(req, res))

export default router
