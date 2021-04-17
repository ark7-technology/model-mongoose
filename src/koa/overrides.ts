import * as _ from 'underscore';
import * as Router from 'koa-router';
import debug from 'debug';
import { Middleware } from '@ark7/router';
import { withInheritedProps as dotty } from 'object-path';

const d = debug('ark7:router:overrides');

export type OverrideConst = object | string | number | boolean;

export type OverrideRuleExtractFn = (
  ctx: Router.IRouterContext,
) => OverrideConst | Promise<OverrideConst>;

export type OverrideRule =
  | string
  | [OverrideConst, string, string?, ...any[]]
  | [OverrideRuleExtractFn, string, string?, ...any[]];

export type OverrideRuleFormat = 'regex' | 'date' | 'string' | 'seconds';

/**
 * Generate an overrides middleware to help build mongoose queries.
 *
 * 1. Fetch query params to override query:
 *    overrides('request.query.status->query.status')
 *    overrides('request.body.status->query.status')
 *
 * 2. Set object to override query:
 *    overrides(['constValue', 'query.status'])
 *
 * 3. Extract object from ctx:
 *    overrides([(ctx) =>
 *      moment(ctx.request.query.date).startOf('month').toDate(),
 *      'query.date',
 *    ])
 *
 * 4. Append to array target:
 *    overrides(['constValue', 'query.$or.[].status'])
 */
export function overrides(...rules: OverrideRule[]): Router.IMiddleware {
  const rs: {
    src: string[] | OverrideRuleExtractFn;
    dst: string[];
    format?: OverrideRuleFormat;
    args: any[];
  }[] = [];

  for (const rule of rules) {
    if (_.isString(rule)) {
      const [os, odWithFormat] = rule.split('->');
      const [od, format, ...args] = odWithFormat.split(':');
      if (!od) {
        throw new Error(`Rule ${rule} is not correct`);
      }
      if (
        format != null &&
        format !== 'regex' &&
        format !== 'date' &&
        format !== 'string' &&
        format !== 'seconds'
      ) {
        throw new Error(`Unknown format ${format}`);
      }
      rs.push({
        src: split(os),
        dst: split(od),
        format: format as OverrideRuleFormat,
        args,
      });
    } else {
      const [os, odWithFormat, format1, ...args1] = rule;
      const [od, format, ...args] = odWithFormat.split(':');
      rs.push({
        src: _.isFunction(os) ? os : () => os,
        dst: split(od),
        format: (format || format1) as OverrideRuleFormat,
        args: args.concat(args1),
      });
    }
  }

  d('Prepared overrides: %O', rs);

  return async (ctx: Router.IRouterContext, next: () => any) => {
    for (const { src, dst, format, args } of rs) {
      let value;

      if (_.isArray(src)) {
        value = dotty.get(ctx, src);
      } else if (_.isFunction(src)) {
        value = src(ctx);
        if (value && (value as Promise<object>).then) {
          value = await value;
        }
      }

      switch (format) {
        case 'regex':
          value = new RegExp(value, ...args);
          break;
        case 'date':
          value = new Date(value);
          break;
        case 'string':
          value = value.toString();
          break;
        case 'seconds':
          value = new Date(value).getTime() / 1000;
          break;
      }

      if (value !== undefined) {
        setValue(ctx, ['overrides'].concat(dst), value);
        d(
          'Set overrides %O with value %O, result: %O',
          dst,
          value,
          ctx.overrides,
        );
      }
    }
    await next();
  };
}

export function clearOverrides(): Router.IMiddleware {
  return async (ctx: Router.IRouterContext, next: () => any) => {
    ctx.overrides = {
      query: {},
      doc: {},
    };
    await next();
  };
}

function setValue(target: any, keys: string[], value: any) {
  const parts: string[] = [];
  keys = _.map(keys, (key: string) => {
    if (key === '[]') {
      if (!dotty.has(target, parts)) {
        dotty.set(target, parts, []);
      }

      key = dotty.get(target, parts).length.toString();
    }

    parts.push(key);
    return key;
  });

  dotty.set(target, keys, value);
}

function split(str: string): string[] {
  const parts = str.split('.');
  for (let i = parts.length - 1; i >= 1; i--) {
    if (parts[i - 1].endsWith('\\')) {
      parts[i - 1] =
        parts[i - 1].substring(0, parts[i - 1].length - 1) + '.' + parts[i];
      parts[i] = '';
    }
  }

  return _.filter(parts, (x) => !!x);
}

/**
 * Generate an overrides middleware to help build mongoose queries.
 *
 * 1. Fetch query params to override query:
 *    @Overrides('request.query.status->query.status')
 *    @Overrides('request.body.status->query.status')
 *
 * 2. Set object to override query:
 *    @Overrides(['constValue', 'query.status'])
 *
 * 3. Extract object from ctx:
 *    @Overrides([(ctx) =>
 *      moment(ctx.request.query.date).startOf('month').toDate(),
 *      'query.date',
 *    ])
 */
export const Overrides = (...rules: OverrideRule[]) => {
  return Middleware(overrides(...rules));
};

/**
 * Clear existing overrides.
 *
 *   @ClearOverrides()
 */
export const ClearOverrides = () => {
  return Middleware(clearOverrides());
};
