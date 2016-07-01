'use strict';

class CacheCollection {

    /**
     *
     * @param {String} collectionName (required)
     * @param {Object} options (required) {
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
        if (!options.indexes.length) throw new Error('Indexes are not supplied');

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

    /**
     * @param {Object} value (required) - item to save in cache
     * @param {Number} expire (optional) - expiration time in minutes, default : 1 min
     * */
    set(value, expire) {
        if (Array.isArray(value)) {
            value.forEach(_ => this.set(_, expire));
            return;
        }

        let primaryIndexValue = getKeyValue(value, this._container.primaryIndexName);
        expire = (this._options.expire || expire || 1) * 60000 + Date.now();
        this._container.primaryStorage.set(primaryIndexValue, { value, expire });

        this._container.secondaryIndexNames.forEach(_ => {
            let secondaryIndexValue = getKeyValue(value, _);
            this._container.secondaryStorage.get(_).set(secondaryIndexValue, primaryIndexValue);
        });
    }

    /**
     * @param {String} key (required)
     * @param {String} indexName (optional) - default is primary index
     * */
    get(key, indexName) {
        if(!key) throw new Error('key is required!');

        let record;

        if(!indexName || indexName == this._container.primaryIndexName) {
            record = this._container.primaryStorage.get(key);
        } else {
            if(!this._container.secondaryStorage.get(indexName) || !this._container.secondaryStorage.get(indexName).has(key)) return null;

            let primaryKey = this._container.secondaryStorage.get(indexName).get(key);
            record = this._container.primaryStorage.get(primaryKey);
        }

        if (!record) return null;

        if (!record.expire || record.expire > Date.now()) return record.value;
        else return this.remove(key, indexName);
    }

    /**
     * @param {String} key (required)
     * @param {String} indexName (required)
     * */
    remove(key, indexName) {
        let primaryKey = !indexName ? key :
            this._container.secondaryStorage.get(indexName).get(key);

        let record = this._container.primaryStorage.get(primaryKey);
        if (!record) return null;

        this._container.secondaryIndexNames.forEach(_ => {
            let secondaryIndexValue = getKeyValue(record.value, _);
            this._container.secondaryStorage.get(_).delete(secondaryIndexValue);
        });

        this._container.primaryStorage.delete(primaryKey);
        console.log('item removed...');
        return null;
    }

    /**
     * clear cache storage
     * */
    clear() {
        this._container.primaryStorage.clear();

        this._container.secondaryIndexNames.forEach(_ => {
            this._container.secondaryStorage.get(_).clear();
        });
    }


    /**
     * get cached items count
     * */
    get count() {
        return this._container.primaryStorage.size;
    }
}

function getKeyValue(obj, key) {
    return obj[key];
}

module.exports = CacheCollection;
