import { Router } from 'express'
import { get } from './api/get'

const router = Router()
router.get('/:id', get)

export default router
