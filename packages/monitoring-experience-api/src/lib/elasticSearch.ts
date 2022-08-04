import { URL } from 'url'

const { Client } = require('@elastic/elasticsearch')

const esClient = new Client({
  auth: {
    username: process.env.ELASTICSEARCH_SERVICE_USER || '',
    password: process.env.ELASTICSEARCH_SERVICE_PASSWORD || '',
  },
  node: {
    url: new URL(
      process.env.ELASTICSEARCH_SERVICE_URL
        ? `https://${process.env.ELASTICSEARCH_SERVICE_URL}`
        : 'http://host.docker.internal:9200'
    ),
  },
})

export const getEsClient = () => {
  let esClientWithNode = null
  try {
    esClientWithNode = esClient
  } catch (e) {
    console.log(e)
  }
  return esClientWithNode
}
