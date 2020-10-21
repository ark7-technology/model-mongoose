import 'should';

import { A7Model } from '@ark7/model';

import { Name } from './models';
import { metadata } from './metadata/name';

describe('metadata', () => {
  it('should return expected value for Name', () => {
    A7Model.getMetadata(Name).should.have.properties(metadata.name);
  });
});
