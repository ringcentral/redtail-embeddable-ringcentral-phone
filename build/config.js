const _ = require('lodash')
const keys = [
  'clientID',
  'clientSecret',
  'appServer',
  'serviceName',
  'appName',
  'upgradeServer',
  'dbNameFix',
  'pageSize'
]

const config = _.pick(process.env, keys)
exports.config = config
exports.ringCentralConfigs = config
exports.thirdPartyConfigs = config
exports.minimize = process.env.minimize === 'true'
