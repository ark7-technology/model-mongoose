import 'should';

import { A7Model, ID, Mixin, Model, StrictModel, Virtual } from '@ark7/model';

import { mongooseManager } from '../src';

namespace models {
  @A7Model({})
  export class VirtualModel3 extends Model {
    mm: ID;

    get v3() {
      return 'v3';
    }
  }

  @A7Model({})
  export class VirtualModel1 extends Model {
    get v1() {
      return 'v1';
    }

    @Virtual({
      ref: 'VirtualModel3',
      localField: '_id',
      foreignField: 'mm',
      justOne: true,
    })
    v3?: VirtualModel3;
  }

  @A7Model({})
  export class VirtualModel2 extends StrictModel {
    get v2() {
      return 'v2';
    }

    @Virtual({
      ref: 'VirtualModel3',
      localField: '_id',
      foreignField: 'mm',
      justOne: true,
    })
    v4?: VirtualModel3;
  }

  @A7Model({})
  @Mixin(VirtualModel2)
  export class VirtualModel extends VirtualModel1 {
    @Virtual({
      ref: 'VirtualModel3',
      localField: '_id',
      foreignField: 'mm',
      justOne: true,
    })
    v5?: VirtualModel3;
  }

  export interface VirtualModel extends VirtualModel2 {}
}

const VirtualModel = mongooseManager.register(models.VirtualModel);
const VirtualModel3 = mongooseManager.register(models.VirtualModel3);

describe('virtuals', () => {
  it('creates right virtual getters', async () => {
    const ins = await VirtualModel.create({});

    ins.v1.should.be.eql('v1');
    ins.v2.should.be.eql('v2');

    const ins3 = await VirtualModel3.create({
      mm: ins._id.toString(),
    });

    ins3.v3.should.be.eql('v3');

    const d = await VirtualModel3.find({
      mm: {
        $in: [ins._id.toString()],
      },
    });

    const insP = await VirtualModel.findById(
      ins._id,
      {},
      {
        populate: ['v4', 'v3', 'v5'],
      },
    );
    // await insP.populate('v3');
    // console.log('insP', insP);
    insP.v3.should.not.be.null();
    insP.v4.should.not.be.null();
    insP.v5.should.not.be.null();

    insP.v3.toJSON().should.be.deepEqual({
      _id: ins3._id.toString(),
      mm: ins._id.toString(),
    });
  });
});
