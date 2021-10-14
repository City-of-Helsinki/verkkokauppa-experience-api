import { Router } from 'express'
import { GetController } from './api/getController'
import { Health } from './api/health'
import { Onboarding } from './api/onboarding'

const router = Router()

const getController = new GetController()
const healthController = new Health()
const onboardingController = new Onboarding()

router.get('/health', (req, res) => healthController.execute(req, res))
router.get('/:namespace', (req, res) => getController.execute(req, res))

if (parseInt(process.env.ENABLE_MERCHANT_ONBOARDING!)) {
  router.post('/:namespace', (req, res) =>
    onboardingController.execute(req, res)
  )
}

export default router
