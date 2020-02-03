const ProxyLists = require('proxy-lists')

const gettingProxies = ProxyLists.getProxies(options)

const arrayOfProxies = []
module.exports = async () => {
  if (arrayOfProxies.length > 0) {
    return arrayOfProxies
  }
}

gettingProxies.on('data', function(proxies) {
  // Received some proxies.
  arrayOfProxies.push(proxies)
  console.log('getting proxies')
})
gettingProxies.on('error', function(error) {
  // Some error has occurred.
  console.error(error)
  console.log('error getting proxies')
})

gettingProxies.once('end', function() {
  // Done getting proxies.
  console.log('done getting proxies')
})
