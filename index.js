(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(['backbone', 'indexed-db-cache'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('backbone'), require('indexed-db-cache'));
    } else {
        root.IdentityMap = factory(root.backbone, root['indexed-db-cache']);
    }
}(this, function (Backbone, IndexDbCache) {


    Backbone.IdentityMap = function (opts) {

        var hasIDB = typeof window.indexedDB != 'undefined';
        if (!hasIDB) { throw new Error('Your browser must support IndexDB. Sry.'); }

        this.init(opts);
    };

    /**
    * @opts.collections an array of key-value objects expected to look like:
    *    [{
    *        'some_collection_key' : CollectionConstructor
    *    }]
    *
    */
    Backbone.IdentityMap.prototype.init = function (opts) {
        this.collectionsMap = opts.collections;

        this.cache = new IndexDbCache({version : opts.version});

        // Create the IndexDB stores. Key is the Backbone Models' Id
        var stores = this.collectionsMap.map(function(coll) {
            return {
                name : Object.keys(coll)[0],
                keyPath : 'id'
            };
        });

        this.cache.init('BBidentityMap', stores)
    };

    Backbone.IdentityMap.prototype.findOne = function(id, collectionKey, next) {
        var _this = this;
        this.cache.findOne(collectionKey, id, function (res) {

            var collection = _this._getCollectionConstr(collectionKey);

            // if object was not found, we need to fetch the model and store it
            if (!res) {
                var model = _this._eagerlyFetchModel(id, collection.model);

                _this.cache.put(collectionKey, model.toJSON(), function (res) {
                    next(model);
                });

            // else we can simply return it.
            } else {
                next(new collection.model(res));
            }
        })
    };

    Backbone.IdentityMap.prototype.findMany = function (collectionKeys, next) {
        var i = 0, len = collectionKeys.length, fetchedCollections = [];

        this.find(collectionKeys[i], loop.bind(this));

        function loop (coll) {
            fetchedCollections.push(coll)
            if (++i >= len ) {
                next(fetchedCollections);
            }

            this.find(collectionKeys[i], loop.bind(this));
        }
    };

    Backbone.IdentityMap.prototype.find = function (collectionKey, next) {
        var _this = this;
        this.cache.find(collectionKey, function (res) {
            var collection = _this._getCollectionConstr(collectionKey);

            if (!res || !res.length) {
                collection = this._eagerlyFetchCollection(collection);
                collection.models.forEach(function(model) {
                    _this.cache.put(collectionKey, model.toJSON());
                });
            } else {
                collection.set(res);
            }

            next(collection);
        });
    }

    /* Privates */

    Backbone.IdentityMap.prototype._eagerlyFetchCollection = function (collection) {
        collection.fetch();
        return collection;
    };

    Backbone.IdentityMap.prototype._eagerlyFetchModel = function (id, Model) {
        var model = new Model({id : id});
        model.fetch();

        // flag stating the model has been eagerly fetched
        // (i.e not fetched through collection.fetch)
        model.set({fullFetch: true});
        return model;
    };

    Backbone.IdentityMap.prototype._getCollectionConstr = function (collectionKey) {

        var res = this.collectionsMap.filter(function(coll) {
            return Object.keys(coll)[0] === collectionKey;
        });
        if ( !res.length ) { throw new Error( 'Failed to find collection key: ' + collectionKey); }
        return new res[0][collectionKey]();
    };

    return Backbone.IdentityMap;
}));
