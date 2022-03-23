import {
  AbstractController,
  Data,
  ExperienceError,
  StatusCode,
  UnknownRequest,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import * as yup from 'yup'
import type { Order, Subscription } from '@verkkokauppa/order-backend'
import {
  getOrdersByUserAdmin,
  getSubscriptionsByUserAdmin,
} from '@verkkokauppa/order-backend'
import { withAuthentication } from '@verkkokauppa/auth-helsinki-profile'

interface Node {
  key: string
  label?: { [language: string]: string }
  formatting?: {
    type: 'string' | 'date' | 'decimal'
    precision?: number
  }
  value?: string
  children?: Node[]
}

const displaybles: { [key: string]: Pick<Node, 'label' | 'formatting'> } = {
  orderItemMetaId: {
    formatting: {
      type: 'string',
    },
  },
  orderItemId: {
    formatting: {
      type: 'string',
    },
  },
  orderId: {
    formatting: {
      type: 'string',
    },
  },
  subscriptionId: {
    formatting: {
      type: 'string',
    },
  },
  key: {
    formatting: {
      type: 'string',
    },
  },
  value: {
    formatting: {
      type: 'string',
    },
  },
  label: {
    formatting: {
      type: 'string',
    },
  },
  visibleInCheckout: {
    formatting: {
      type: 'string',
    },
  },
  ordinal: {
    formatting: {
      type: 'decimal',
      precision: 0,
    },
  },
  status: {
    formatting: {
      type: 'string',
    },
  },
  namespace: {
    formatting: {
      type: 'string',
    },
  },
  merchantName: {
    formatting: {
      type: 'string',
    },
  },
  customerFirstName: {
    formatting: {
      type: 'string',
    },
  },
  customerLastName: {
    formatting: {
      type: 'string',
    },
  },
  customerEmail: {
    formatting: {
      type: 'string',
    },
  },
  customerPhone: {
    formatting: {
      type: 'string',
    },
  },
  paymentMethod: {
    formatting: {
      type: 'string',
    },
  },
  paymentMethodToken: {
    formatting: {
      type: 'string',
    },
  },
  paymentMethodExpirationYear: {
    formatting: {
      type: 'decimal',
      precision: 0,
    },
  },
  paymentMethodExpirationMonth: {
    formatting: {
      type: 'decimal',
      precision: 0,
    },
  },
  paymentMethodCardLastFourDigits: {
    formatting: {
      type: 'decimal',
      precision: 0,
    },
  },
  user: {
    formatting: {
      type: 'string',
    },
  },
  startDate: {
    formatting: {
      type: 'date',
    },
  },
  endDate: {
    formatting: {
      type: 'date',
    },
  },
  billingStartDate: {
    formatting: {
      type: 'date',
    },
  },
  periodUnit: {
    formatting: {
      type: 'string',
    },
  },
  periodFrequency: {
    formatting: {
      type: 'decimal',
      precision: 0,
    },
  },
  periodCount: {
    formatting: {
      type: 'decimal',
      precision: 0,
    },
  },
  productId: {
    formatting: {
      type: 'string',
    },
  },
  productName: {
    formatting: {
      type: 'string',
    },
  },
  productLabel: {
    formatting: {
      type: 'string',
    },
  },
  productDescription: {
    formatting: {
      type: 'string',
    },
  },
  quantity: {
    formatting: {
      type: 'decimal',
      precision: 0,
    },
  },
  priceNet: {
    formatting: {
      type: 'decimal',
      precision: 2,
    },
  },
  priceVat: {
    formatting: {
      type: 'decimal',
      precision: 2,
    },
  },
  priceGross: {
    formatting: {
      type: 'decimal',
      precision: 2,
    },
  },
  vatPercentage: {
    formatting: {
      type: 'decimal',
      precision: 0,
    },
  },
  originalPriceNet: {
    formatting: {
      type: 'decimal',
      precision: 2,
    },
  },
  originalPriceVat: {
    formatting: {
      type: 'decimal',
      precision: 2,
    },
  },
  originalPriceGross: {
    formatting: {
      type: 'decimal',
      precision: 2,
    },
  },
  unit: {
    formatting: {
      type: 'string',
    },
  },
  rowPriceNet: {
    formatting: {
      type: 'decimal',
      precision: 2,
    },
  },
  rowPriceVat: {
    formatting: {
      type: 'decimal',
      precision: 2,
    },
  },
  rowPriceTotal: {
    formatting: {
      type: 'decimal',
      precision: 2,
    },
  },
  firstName: {
    formatting: {
      type: 'string',
    },
  },
  lastName: {
    formatting: {
      type: 'string',
    },
  },
  email: {
    formatting: {
      type: 'string',
    },
  },
  phone: {
    formatting: {
      type: 'string',
    },
  },
}

const addDisplayables = (node: Node): Node => {
  const children = node.children?.map((c) => addDisplayables(c))
  return {
    ...node,
    ...displaybles[node.key],
    children,
  }
}

const filterEmptyNodes = (node: Node): Node | undefined => {
  const children = node.children
    ?.map((c) => filterEmptyNodes(c))
    .filter((c): c is Node => c !== undefined)

  return (children && children.length > 0) || node.value != null
    ? { ...node, children }
    : undefined
}

const leafNodesFromObject = (obj: { [key: string]: any }): Node[] => {
  const nodes: Node[] = []
  Object.keys(obj).forEach((key) => {
    const value = obj[key]
    if (['string', 'boolean', 'number'].includes(typeof value)) {
      nodes.push({
        key,
        value: value.toString(),
      })
    }
  })
  return nodes
}

const subscriptionToNode = (s: Subscription): Node => {
  return {
    key: 'subscription',
    children: [
      ...leafNodesFromObject(s),
      {
        key: 'meta',
        children: s.meta?.map((m) => ({
          key: 'metaItem',
          children: leafNodesFromObject(m),
        })),
      },
    ],
  }
}

const orderToNode = (o: Order): Node => {
  return {
    key: 'order',
    children: [
      ...leafNodesFromObject(o),
      {
        key: 'customer',
        children: leafNodesFromObject(o.customer ?? {}),
      },
      {
        key: 'items',
        children: o.items?.map((i) => ({
          key: 'orderItem',
          children: leafNodesFromObject(i),
        })),
      },
      {
        key: 'meta',
        children: o.meta?.map((m) => ({
          key: 'metaItem',
          children: leafNodesFromObject(m),
        })),
      },
    ],
  }
}

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    id: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
  }),
  query: yup.object().shape({
    displayable: yup.boolean().notRequired(),
  }),
})

export class GetGdprController extends withAuthentication(
  AbstractController,
  true
)<typeof requestSchema> {
  protected readonly requestSchema = requestSchema

  // Forbidden -> Unauthorized as per the gdpr api's openapi definition
  protected async validateRequest(req: UnknownRequest) {
    try {
      return await super.validateRequest(req)
    } catch (e) {
      if (
        e instanceof ExperienceError &&
        e.definition.responseStatus === StatusCode.Forbidden
      ) {
        e.definition.responseStatus = StatusCode.Unauthorized
      }
      throw e
    }
  }

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ) {
    const {
      params: { id: userParam },
      headers: { user },
    } = req
    const displayable = req.query.displayable ?? false

    if (userParam !== user) {
      throw new ExperienceError({
        code: 'authentication-failed',
        message: 'Authenticated user does not match given id',
        responseStatus: StatusCode.Unauthorized,
        logLevel: 'info',
      })
    }

    const [subscriptions, orders] = await Promise.all([
      getSubscriptionsByUserAdmin({ user }),
      getOrdersByUserAdmin({ user }),
    ])

    if (subscriptions.length === 0 && orders.length === 0) {
      throw new ExperienceError({
        code: 'profile-not-found',
        message: 'Profile not found',
        responseStatus: StatusCode.NotFound,
        logLevel: 'debug',
      })
    }

    const profile: Node = {
      key: 'user',
      children: [
        {
          key: 'subscriptions',
          children: subscriptions.map((s) => subscriptionToNode(s)),
        },
        {
          key: 'orders',
          children: orders.map((o) => orderToNode(o)),
        },
      ],
    }

    const data = new Data(
      filterEmptyNodes(displayable ? addDisplayables(profile) : profile)
    )

    return this.success(res, data.serialize())
  }
}
