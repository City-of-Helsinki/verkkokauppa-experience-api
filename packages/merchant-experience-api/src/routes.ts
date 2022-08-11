import { Router } from 'express'
import { GetController } from './api/getController'
import { Health } from './api/health'
import { Onboarding } from './api/onboarding'
import { CreateMerchantController } from './api/createMerchantController'
import { UpdateAllMerchantController } from './api/updateAllMerchantController'

const router = Router()

const getController = new GetController()
const healthController = new Health()
const onboardingController = new Onboarding()
const createMerchantController = new CreateMerchantController()
const updateAllMerchantController = new UpdateAllMerchantController()

router.get('/health', (req, res) => healthController.execute(req, res))
router.get('/:namespace', (req, res) => getController.execute(req, res))
router.post('/:namespace', (req, res) => onboardingController.execute(req, res))

router.post('/create/:namespace', (req, res) =>
  createMerchantController.execute(req, res)
)

router.post('/update/all/:namespace', (req, res) =>
  updateAllMerchantController.execute(req, res)
)

export default router
