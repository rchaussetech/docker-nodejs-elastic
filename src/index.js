// IMPORTAÇÃO DOS MODULOS DO NPM
const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')
const elasticsearch = require('elasticsearch')

// CRIAÇÃO DO EXPRESS APP
const app = express()

// CORS
app.use(cors())

// LOGS
app.use(morgan('common', {
  stream: {
    write: async (message) => {
      try {
        const client = getClient()

        const result = await client.index({
          index: 'access_logs',
          type: 'type_access_logs',
          body: { 
            text: message,
            timestamp: Date.now()
          }
        })

        console.log(result)
      } catch (e) {
        console.error(e)
      }
    }
  }
}))

// NODE.JS BODY PARSING MIDDLEWARE
app.use(bodyParser.json())

// DEFINIÇÃO DA ROTA BASE
app.get('/', middleware, (req, res) => res.json(req.query))

// DEFINIÇÃO DA ROTA DE TESTE
app.post('/test', middleware, (req, res) => res.json(req.body))

// CRIAÇÃO DO SERVIDOR HTTP
const server = http.createServer(app)

// FAZ O SERVIDOR RESPONDER NA PORTA 3000
server.listen(process.env.NODE_PORT, () => console.log('Servidor rodando na porta %s.', process.env.NODE_PORT))

// MIDDLEWARE
async function middleware(req, res, next) {
  try {
    const client = getClient()

    const result = await client.index({
      index: 'inbound_request',
      type: 'type_inbound_request',
      body: {
        ip: req.ip,
        protocol: req.protocol,
        hostname: req.hostname,
        baseUrl: req.baseUrl,
        method: req.method,
        originalUrl: req.originalUrl,
        path: req.path,
        params: req.params,
        query: req.query,
        body: req.body,
        timestamp: Date.now()
      }
    })

    console.log(result)
  } catch (e) {
    console.error(e)
  }

  return next()
}

// RETORNA O CLIENTE DO ELASTICSEARCH
function getClient() {
  return new elasticsearch.Client({
    host: process.env.ELASTICSEARCH_URL
  })
}
