'use strict';

class CacheCollection {

    /**
     *
     * @param {String} collectionName (required)
     * @param {Object }options (required) {
     *  expire: default expiry time span in seconds
     *  indexes: [ array of index fields ] - first index name is treated as primary index
     * }
     */
    constructor(collectionName, options) {
        //make sure we have global cache storage object
        if (!global['CACHE_STORAGE']) global['CACHE_STORAGE'] = {};

        //make sure indexes are supplied with options
        if (!options.indexes) options.indexes = [];
        if (typeof options.indexes === 'string') options.indexes = [options.indexes];
        if(!options.indexes.length) throw new Error('Indexes are not supplied');

        //create cache collection if does not exists
        if (!global['CACHE_STORAGE'][collectionName]) {
            let container = {
                primaryIndexName: options.indexes.shift(),
                primaryStorage: new Map(),

                secondaryIndexNames: options.indexes,
                secondaryStorage: new Map()
            };

            options.indexes.forEach(indexName => container.secondaryStorage.set(indexName, new Map()));
            global['CACHE_STORAGE'][collectionName] = container;
        }

        this._options = options;
        this._container = global['CACHE_STORAGE'][collectionName];
    }


}

module.exports = CacheCollection;
