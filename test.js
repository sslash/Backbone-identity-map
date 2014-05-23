var Backbone = require('backbone');
var IdentityMap = require('./index.js');

describe('index', function (){
    var collections = [
        {'swag_collection':
            Backbone.Collection.extend({
                model : Backbone.Model.extend({
                    fetch : function () {
                        this.set({'fetched' : 'yeah buddy'});
                    }
                })
            })
        }
    ];

    it('should extend Backbone', function () {
        expect(Backbone.IdentityMap).to.exist;
    });

    it('should fetch a backbone model thats not yet stored', function (done) {
        var map = new Backbone.IdentityMap({collections : collections});
        var stub = sinon.stub(map.cache, 'put', function (coll, model) {
            expect(model.fetched).to.equal('yeah buddy');
            stub.restore();
            done();
        });
        map.findOne('1337', 'swag_collection');
    });

    it('should return a stored model thats been eagerly stored', function () {
        var map = new Backbone.IdentityMap({collections : collections});
        var spy = sinon.spy(map.cache.put);

        map.findOne('7331', 'swag_collection', function (res) {
            // should be eagerly fetched now..
            expect(spy.calledOnce).to.be.true;
            map.findOne('7331', 'swag_collection', function (res) {
                expect(spy.calledOnce).to.be.true;
                expect(res.get('fetched')).to.equal('yeah buddy')
            })
        });
    });
});
