import * as _ from 'underscore';
import * as db from '../../src/mongoose';
import * as should from 'should';

class Name extends db.Model {
    @db.Field({
        default: 'A_FIRSTNAME',
    })
    first: string;
    @db.Field({
        default: 'A_LASTNAME',
    })
    last: string;
}

describe('NModel Basics', () => {
    beforeEach(async () => {

    });
    it('should modelize object', async () => {
        const u = Name.modelize({ first: 'a' });
        u.should.be.instanceof(Name);
        u.toJSON().should.have.properties({ first: 'a' });
    });
});