import { URL } from 'url'

import { Client, ClientOptions } from '@elastic/elasticsearch'
import type { SearchResponse } from '@elastic/elasticsearch/api/types'

const esClient = new Client({
  auth: {
    username: process.env.ELASTICSEARCH_SERVICE_USER || '',
    password: process.env.ELASTICSEARCH_SERVICE_PASSWORD || '',
  },
  node: {
    url: new URL(
      process.env.EXP_API_ELASTICSEARCH_SERVICE_URL ||
        'http://host.docker.internal:9200'
    ),
  },
} as ClientOptions)

export const getEsClientForTesting = () => {
  let esClientWithNode = null
  try {
    esClientWithNode = esClient
  } catch (e) {
    console.log(e)
  }
  if (!esClientWithNode) {
    throw Error('Cant connect to elastic for testing')
  }
  return esClientWithNode
}

type CoreIndices =
  | 'accountingexportdatas'
  | 'accountingsliprows'
  | 'accountingslips'
  | 'flowsteps'
  | 'history'
  | 'increment_ids'
  | 'invoicing'
  | 'merchant'
  | 'namespace'
  | 'order_payment_method'
  | 'orderaccountings'
  | 'orderitemaccountings'
  | 'orderiteminvoicings'
  | 'orderitemmetas'
  | 'orderitems'
  | 'orders'
  | 'payer'
  | 'payment_filters'
  | 'payment_item'
  | 'payment_method'
  | 'payments'
  | 'paytrail_merchant_mapping'
  | 'price'
  | 'productmappings'
  | 'products'
  | 'refund_accountings'
  | 'refund_item_accountings'
  | 'refund_payments'
  | 'refunditems'
  | 'refunds'
  | 'resource_lock'
  | 'serviceconfigurations'
  | 'servicemappings'
  | 'subscription_card_expired'
  | 'subscription_item_metas'
  | 'subscription_renewal_processes'
  | 'subscription_renewal_requests'
  | 'subscriptions'

// Utility function that creates the client, performs the search, and extracts results
export async function searchAndExtractResults<T>(
  index: CoreIndices | string, // The index to search in
  query: Record<string, any> // The query to execute (Elasticsearch DSL)
): Promise<T[]> {
  // Create the Elasticsearch client
  const client = getEsClientForTesting()

  // Perform the search request
  const { body }: { body: SearchResponse<T> } = await client.search({
    index,
    body: {
      query,
    },
  })

  // Extract and return the _source from the hits, defaulting to an empty array if no results
  return (
    body.hits.hits
      .map((hit) => hit._source)
      .filter((source): source is T => !!source) ||
    (([({} as unknown) as T] as unknown) as T[])
  )
}
