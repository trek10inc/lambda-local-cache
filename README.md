# lambda-local-cache for JS objects

## Installation :

```
npm install lambda-local-cache --save
```


## How to use
```js
const lambdaLocalCache = require( 'lambda-local-cache' );

let collectionName = 'COLLECTION_NAME'

let options = {
    indexes: ['index1', 'index2'], // first index name is treated as primary index
    expire : 5 // in minutes
};


let cache = new lambdaLocalCache(collectionName, options);


// METHODS

cache.set(value, expire);

cache.get('key', 'indexName');

cache.remove('key', 'indexName');

cache.clear();


## License

MIT
