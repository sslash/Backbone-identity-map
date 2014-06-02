var Backbone = require('backbone');
var IdentityMap = require('./index.js');

describe('index', function (){
    var collections = [
        {'swag_collection':
            Backbone.Collection.extend({
                fetch : function () { this.fetchedColl = true; },
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
});
