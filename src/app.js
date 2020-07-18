const cors = require('cors')
const express = require('express')
const path = require('path')

const publicPath = path.join(__dirname, '../public')

const userRouter = require('./routers/pdf')

const app = express()

app.use(express.json())

// CORS request headers
app.use(cors())

app.use(userRouter)

app.get('/', (req, res) => res.sendFile(path.join(publicPath, 'index.html')))

module.exports = app
