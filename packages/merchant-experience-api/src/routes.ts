import { Router } from 'express'
import { GetController } from './api/getController'
import { Health } from './api/health'
import { Onboarding } from './api/onboarding'
import { CreateMerchantController } from './api/createMerchantController'
import { UpdateAllMerchantController } from './api/updateAllMerchantController'
import { UpdateMerchantController } from './api/updateMerchantController'
import { ListAllMerchantController } from './api/listAllMerchantController'
import { GetAllConfigurationKeysController } from './api/getAllConfigurationKeysController'

const router = Router()

const getController = new GetController()
const healthController = new Health()
const onboardingController = new Onboarding()
const createMerchantController = new CreateMerchantController()
const updateAllMerchantController = new UpdateAllMerchantController()
const listAllMerchantController = new ListAllMerchantController()
const getAllConfigurationKeysController = new GetAllConfigurationKeysController()
const updateMerchantController = new UpdateMerchantController()

router.get('/health', (req, res) => healthController.execute(req, res))

router.get('/config/keys/list/:namespace', (req, res) =>
  getAllConfigurationKeysController.execute(req, res)
)

// Excludes swagger default path docs to prevent this route to be run when using /v1/docs/namespace/merchantId
router.get('/:namespace((?!(docs)\\w+))/:merchantId?/', (req, res) =>
  getController.execute(req, res)
)

router.post('/:namespace', (req, res) => onboardingController.execute(req, res))

router.post('/create/merchant/:namespace/', (req, res) =>
  createMerchantController.execute(req, res)
)

router.post('/update/merchant/:namespace/:merchantId', (req, res) =>
  updateMerchantController.execute(req, res)
)

router.get('/list/merchants/:namespace', (req, res) =>
  listAllMerchantController.execute(req, res)
)

router.post('/update/merchants/:namespace', (req, res) =>
  updateAllMerchantController.execute(req, res)
)

export default router
