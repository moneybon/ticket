const router = require('express').Router()
const AV = require('leanengine')

AV.init({
  appId: process.env.LEANCLOUD_APP_ID,
  appKey: process.env.LEANCLOUD_APP_KEY,
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY
})

// 加载云函数定义
require('./cloud')
require('./Ticket')
require('./Reply')
require('./OpsLog')
require('./User')
// 加载云引擎中间件
router.use(AV.express())

router.use('/api/leancloud', require('./leancloud').router)
router.use('/webhooks/mailgun', require('./mailgun'))

module.exports = router