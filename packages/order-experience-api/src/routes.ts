import { Router } from 'express'

import { CreateController } from './api/createController'
const createController = new CreateController()


const router = Router()
router.post('/', (req, res) => createController.execute(req, res))

export default router

