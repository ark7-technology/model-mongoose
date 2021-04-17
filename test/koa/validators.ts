import { Validator, validators } from '../../src';

describe('koa.validators', () => {
  function validate(validator: Validator, val: any) {
    return validator({}, 'foo', val, {});
  }
  describe('isStartOf', () => {
    it('should validate and return proper message', () => {
      validate(validators.isStartOf('month'), '2019-01-01').should.be.true();
      validate(validators.isStartOf('month'), '2019-01-02').should.be.equal(
        'month',
      );
    });

    it('should validate utc time', () => {
      validate(
        validators.isStartOf('month', 'Etc/UTC'),
        '2020-04-01',
      ).should.be.true();
    });
  });
});
