// tslint:disable-next-line: no-var-requires
const elasticsearch = require('elasticsearch')
// import elasticsearch from 'elasticsearch'

// import elasticsearch from 'elasticsearch'

// https://medium.com/@siddharthac6/elasticsearch-node-js-b16ea8bec427
// https://www.compose.com/articles/getting-started-with-elasticsearch-and-node/
// https://github.com/elastic/elasticsearch-js

// google by date Range
// https://www.oreilly.com/library/view/google-hacks-2nd/0596008570/ch01s28.html

// async
// https://www.youtube.com/watch?v=vn3tm0quoqE
export const client = new elasticsearch.Client({
  hosts: [
    // 'https://[username]:[password]@[server]:[port]/',
    'http://localhost:9200/'
  ],
  log: 'trace'
})
