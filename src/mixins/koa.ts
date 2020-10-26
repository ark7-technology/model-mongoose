import * as mongoose from 'mongoose';
import _ from 'underscore';
import debug from 'debug';
import {
  A7Model,
  AsObject,
  DefaultDataLevel,
  Manager,
  manager as _manager,
} from '@ark7/model';
import { IMiddleware, IRouterContext } from 'koa-router';
import { NodesworkError } from '@nodeswork/utils';
import { withInheritedProps as dotty } from 'object-path';

import { MongooseModel } from '../mongoose-model';
import { params, validators } from '../koa';

declare module 'koa-router' {
  interface IRouterContext {
    overrides?: IOverwrites;
  }
}

declare module 'koa' {
  interface Request {
    body?: any;
  }
}

export interface IOverwrites {
  query?: {
    [name: string]: any;
  };
  pagination?: {
    page: number;
    size: number;
  };
  doc?: any;
  sort?: any;
  options?: any;
}

const d = debug('@ark7:model-mongoose:MongooseKoa');

@A7Model({})
export class MongooseKoa extends MongooseModel {
  /**
   * Returns Koa create middleware.
   */
  public static createMiddleware(
    options: CreateOptions,
    manager: Manager = _manager,
  ): IMiddleware {
    const metadata = this.getMetadata(manager);
    const self = this.cast();

    options = _.defaults({}, options, DEFAULT_COMMON_OPTIONS);

    async function create(ctx: IRouterContext, next: INext) {
      const opts: CreateOptions = _.extend({}, options, ctx.overrides?.options);
      const omits = _.union(['_id'], opts.omits, metadata.autogenFields());
      let doc = _.omit(ctx.request.body, omits);
      doc = _.extend(doc, ctx.overrides && ctx.overrides.doc);

      dotty.set(ctx, opts.target, doc);

      if (opts.triggerNext) {
        await next();
      }

      const populates = metadata.dataLevelPopulates(
        opts.level || DefaultDataLevel.DETAIL,
      );

      doc = dotty.get(ctx, opts.target);
      let object: AsObject<MongooseKoa> = (await self.create(doc)) as any;

      if (opts.project || opts.level) {
        object = await self.findById(
          object._id,
          _.union(populates.projections, opts.project),
          _.pick(opts, 'level', 'lean'),
        );
      }

      dotty.set(ctx, opts.target, object);

      if (opts.populate || !_.isEmpty(populates.populates)) {
        await self.populate(
          object,
          _.union(populates.populates, opts.populate),
        );
      }

      if (!opts.noBody) {
        ctx.body = await opts.transform(object, ctx);
      }
    }

    Object.defineProperty(create, 'name', {
      value: `${self.modelName}#createMiddleware`,
      writable: false,
    });

    return create;
  }

  /**
   * Returns Koa get middleware.
   *
   * Examples:
   *
   * 1. Load from ctx.params.  This is the most common case where the url path
   *    stores the model id.
   *
   *    @Post('/articles/:articleId')
   *    getArticle = models.Article.getMiddleware({ field: 'articleId' });
   *
   * 2. Load from ctx.request.
   *
   *    // When there is a dot in the field path, it will load from ctx.request.
   *    @Middleware(models.Article.getMiddleware({ field: 'body.articleId' }));
   *
   * 3. No need to specify id.
   *    // Pass a star.
   *    @Middleware(models.Article.getMiddleware({ field: '*' }));
   *
   * @param options.field specifies which field to load the id key value.
   * @param options.idFieldName specifies the field name in query.
   *                            Default: '_id'.
   * @param options.target specifies which field under ctx to set the target.
   *                       Default: 'object'.
   * @param options.triggerNext specifies whether to trigger next middleware.
   *                            Default: false.
   * @param options.transform a map function before send to ctx.body.
   */
  public static getMiddleware(
    options: GetOptions,
    manager: Manager = _manager,
  ): IMiddleware {
    const metadata = this.getMetadata(manager);
    const self = this.cast();

    options = _.defaults({}, options, DEFAULT_GET_OPTIONS);

    const idFieldName = options.idFieldName;

    async function get(ctx: IRouterContext, next: INext) {
      const opts: GetOptions = _.extend(
        {},
        options,
        ctx.overrides && ctx.overrides.options,
      );
      const query = (ctx.overrides && ctx.overrides.query) || {};
      if (opts.field !== '*') {
        if (opts.field.indexOf('.') >= 0) {
          query[idFieldName] = dotty.get(ctx.request, opts.field);
        } else {
          query[idFieldName] = ctx.params[opts.field];
        }

        if (query[idFieldName] == null) {
          throw new NodesworkError('invalid value', {
            responseCode: 422,
            path: opts.field,
            idFieldName,
          });
        }
      }
      if (Object.keys(query).length === 0) {
        throw new NodesworkError('no query parameters', {
          responseCode: 422,
          path: opts.field,
        });
      }

      const queryOption: any = _.pick(opts, 'level', 'lean');

      const populates = metadata.dataLevelPopulates(
        opts.level || DefaultDataLevel.DETAIL,
      );

      d('getMiddleware.populates: %o', populates);

      let queryPromise = self.findOne(
        query,
        _.union(populates.projections, opts.project),
        queryOption,
      );

      if (!_.isEmpty(opts.populate) || !_.isEmpty(populates.populates)) {
        queryPromise = queryPromise.populate(
          _.union(populates.populates, opts.populate),
        );
      }

      const object = await queryPromise;

      dotty.set(ctx, opts.target, object);

      if (!opts.nullable && object == null) {
        throw NodesworkError.notFound();
      }

      if (opts.triggerNext) {
        await next();
      }

      if (!opts.noBody) {
        ctx.body = await opts.transform((ctx as any)[opts.target], ctx);
      }
    }

    Object.defineProperty(get, 'name', {
      value: `${self.modelName}#getMiddleware`,
      writable: false,
    });

    return get;
  }

  /**
   * Returns KOA find middleware.
   *
   * Examples:
   *
   * 1. Normal query.
   *
   *    @Get('/articles')
   *    find = models.Article.findMiddleware();
   *
   * 2. Pagination.  User query.size, query.page to calculate numbers to skip.
   *
   *    @Get('/articles')
   *    find = models.Article.findMiddleware({
   *      pagination: {
   *        size: 50,  // single page size
   *        sizeChoices: [50, 100, 200],
   *        // where to store the full IPaginationData<any>.
   *        target: 'articlesWithPagination',
   *      },
   *    })
   *
   *  @param options.pagination.size specifies max number of returning records.
   *  @param options.pagination.sizeChoices
   *  @param options.pagination.target specifies where to store the full data.
   *  @param options.sort specifies the returning order.
   *  @param options.level specifies the data level.
   *  @param options.project specifies the projection.
   *  @param options.populate specifies the populates.
   */
  public static findMiddleware(
    options: FindOptions = {},
    manager: Manager = _manager,
  ): IMiddleware {
    const metadata = this.getMetadata(manager);
    const self = this.cast();

    _.defaults(options, DEFAULT_COMMON_OPTIONS);

    if (options.pagination) {
      _.defaults(options.pagination, DEFAULT_FIND_PAGINATION_OPTIONS);
    }

    const defaultPagination = {
      page: 0,
      size: options.pagination ? options.pagination.size : 0,
    };

    const paginationParams =
      options.pagination &&
      params({
        'query.page': [validators.toInt()],
        'query.size': [
          validators.toInt(),
          validators.isEnum(options.pagination.sizeChoices),
        ],
      });

    async function find(ctx: IRouterContext, next: INext) {
      const opts: FindOptions = _.extend(
        {},
        options,
        ctx.overrides && ctx.overrides.options,
      );
      const query = (ctx.overrides && ctx.overrides.query) || {};
      const queryOption: any = _.pick(opts, 'sort', 'lean', 'level');
      let pagination = null;

      if (opts.pagination) {
        await paginationParams(ctx, () => null);
        if (ctx.status === 422) {
          return;
        }

        pagination = ctx.request.query;
        _.defaults(pagination, defaultPagination);

        queryOption.skip = pagination.page * pagination.size;
        queryOption.limit = pagination.size;
      }

      if (ctx.overrides && ctx.overrides.sort) {
        queryOption.sort = ctx.overrides.sort;
      }

      const populates = metadata.dataLevelPopulates(
        opts.level || DefaultDataLevel.DETAIL,
      );

      let queryPromise = self.find(
        query,
        _.union(opts.project, populates.projections),
        queryOption,
      );

      if (!_.isEmpty(opts.populate) || !_.isEmpty(populates.populates)) {
        queryPromise = queryPromise.populate(
          _.union(populates.populates, opts.populate),
        );
      }

      const object = await queryPromise;

      dotty.set(ctx, opts.target, object);

      const bodyTarget: any =
        pagination == null
          ? object
          : {
              pageSize: pagination.size,
              page: pagination.page,
              total: await self.find(query).countDocuments(),
              data: object,
            };

      if (pagination && pagination.target) {
        dotty.set(ctx, opts.target, bodyTarget);
      }

      if (opts.triggerNext) {
        await next();
      }

      if (!opts.noBody) {
        const objects = dotty.get(ctx, opts.target);
        for (let i = 0; i < objects.length; i++) {
          objects[i] = await opts.transform(objects[i], ctx);
        }

        if (pagination && pagination.target) {
          bodyTarget.data = objects;
        }

        ctx.body = bodyTarget;
      }
    }

    Object.defineProperty(find, 'name', {
      value: `${self.modelName}#findMiddleware`,
      writable: false,
    });

    return find;
  }

  public static updateMiddleware(
    options: UpdateOptions,
    manager: Manager = _manager,
  ): IMiddleware {
    const metadata = this.getMetadata(manager);
    const self = this.cast();

    options = _.defaults({}, options, DEFAULT_UPDATE_OPTIONS);

    const idFieldName = options.idFieldName;

    async function update(ctx: IRouterContext, next: INext) {
      const opts = _.extend(
        {},
        options,
        ctx.overrides && ctx.overrides.options,
      );
      const query = (ctx.overrides && ctx.overrides.query) || {};
      if (opts.field !== '*') {
        if (opts.field.indexOf('.') >= 0) {
          query[idFieldName] = dotty.get(ctx.request, opts.field);
        } else {
          query[idFieldName] = ctx.params[opts.field];
        }

        if (query[idFieldName] == null) {
          throw new NodesworkError('invalid value', {
            responseCode: 422,
            path: opts.field,
          });
        }
      }
      if (Object.keys(query).length === 0) {
        throw new NodesworkError('no query parameters', {
          responseCode: 422,
          path: opts.field,
        });
      }

      const populates = metadata.dataLevelPopulates(
        opts.level || DefaultDataLevel.DETAIL,
      );
      const queryOption: any = {
        new: true,
        fields: _.union(opts.project, populates.projections),
        level: opts.level,
        runValidators: true,
        context: 'query',
        lean: opts.lean,
      };
      const omits = _.union(
        ['_id'],
        [idFieldName],
        opts.omits,
        metadata.autogenFields(),
        metadata.readonlyFields(),
      );

      const fOmits = _.filter(Object.keys(ctx.request.body), (k) => {
        return _.find(omits, (o) => o === k || k.startsWith(o + '.')) != null;
      });

      let doc = _.omit(ctx.request.body, fOmits);
      doc = _.extend(doc, ctx.overrides && ctx.overrides.doc);
      const upDoc = {
        $set: doc,
      };
      let updatePromise = self.findOneAndUpdate(query, upDoc, queryOption);

      if (!_.isEmpty(opts.populate) || !_.isEmpty(populates.populates)) {
        updatePromise = updatePromise.populate(
          _.union(populates.populates, opts.populate),
        );
      }
      const object = await updatePromise;

      if (object == null) {
        throw NodesworkError.notFound();
      }

      dotty.set(ctx, opts.target, object);

      if (opts.triggerNext) {
        await next();
      }

      if (!opts.noBody) {
        ctx.body = await opts.transform((ctx as any)[opts.target], ctx);
      }
    }

    Object.defineProperty(update, 'name', {
      value: `${self.modelName}#updateMiddleware`,
      writable: false,
    });

    return update;
  }

  public static deleteMiddleware(
    options: DeleteOptions,
    manager: Manager = _manager,
  ): IMiddleware {
    const metadata = this.getMetadata(manager);
    const self = this.cast();

    options = _.defaults({}, options, DEFAULT_DELETE_OPTIONS);
    const idFieldName = options.idFieldName;

    async function del(ctx: IRouterContext, next: INext) {
      const opts = _.extend(
        {},
        options,
        ctx.overrides && ctx.overrides.options,
      );
      const query = (ctx.overrides && ctx.overrides.query) || {};

      if (opts.field.indexOf('.') >= 0) {
        query[idFieldName] = dotty.get(ctx.request, opts.field);
      } else {
        query[idFieldName] = ctx.params[opts.field];
      }

      const queryOption: any = {};

      const queryPromise = self.findOne(query, undefined, queryOption);

      let object = await queryPromise;

      dotty.set(ctx, opts.target, object);

      if (!opts.nullable && object == null) {
        throw new NodesworkError('not found', {
          responseCode: 404,
        });
      }

      if (object) {
        await object.remove();
      }

      if (opts.triggerNext) {
        await next();
      }

      ctx.status = 204;
    }

    Object.defineProperty(del, 'name', {
      value: `${self.modelName}#deleteMiddleware`,
      writable: false,
    });

    return del;
  }
}

export interface CommonOptions {
  noBody?: boolean; // if to write the result to body
  triggerNext?: boolean; // if to trigger next middleware

  // the target field name write to ctx, default: object
  target?: string;

  lean?: boolean;

  // transform the result before write to body
  transform?: (a: any, ctx: IRouterContext) => any | Promise<any>;
}

const DEFAULT_COMMON_OPTIONS = {
  target: 'object',
  transform: _.identity,
};

const DEFAULT_SINGLE_ITEM_OPTIONS: Partial<SingleItemOptions> = {
  idFieldName: '_id',
  nullable: false,
};

const DEFAULT_GET_OPTIONS: Partial<GetOptions> = _.defaults(
  {},
  DEFAULT_COMMON_OPTIONS,
  DEFAULT_SINGLE_ITEM_OPTIONS,
);

const DEFAULT_UPDATE_OPTIONS: Partial<UpdateOptions> = _.defaults(
  {},
  DEFAULT_COMMON_OPTIONS,
  DEFAULT_SINGLE_ITEM_OPTIONS,
);

const DEFAULT_DELETE_OPTIONS: Partial<DeleteOptions> = _.defaults(
  {},
  DEFAULT_COMMON_OPTIONS,
  DEFAULT_SINGLE_ITEM_OPTIONS,
);

const DEFAULT_FIND_PAGINATION_OPTIONS = {
  size: 20,
  sizeChoices: [20, 50, 100, 200],
};

export interface CommonResponseOptions {
  level?: number; // the data level for projection
  project?: string[]; // the data fields for projection

  // populate specific fields only
  populate?: mongoose.ModelPopulateOptions[];
}

export interface CommonReadOptions {}

export interface CommonWriteOptions {
  omits?: string[]; // omits fields to be modified
}

export interface CreateOptions
  extends CommonOptions,
    CommonResponseOptions,
    CommonWriteOptions {}

/**
 * When read/write/delete to a single item.
 */
export interface SingleItemOptions {
  // The field name to extract.
  field: string;

  // The field where stores the id, default: _id.
  idFieldName?: string;

  // When a null value is acceptable, default: false.
  nullable?: boolean;
}

/**
 * Get Middleware Options.
 */
export interface GetOptions
  extends CommonOptions,
    CommonResponseOptions,
    CommonReadOptions,
    SingleItemOptions {}

export interface FindOptions
  extends CommonOptions,
    CommonResponseOptions,
    CommonReadOptions {
  pagination?: {
    size?: number;
    sizeChoices?: number[];
    target?: string;
  };

  sort?: object;
}

export interface UpdateOptions
  extends CommonOptions,
    CommonResponseOptions,
    CommonWriteOptions,
    SingleItemOptions {}

export interface DeleteOptions extends CommonOptions, SingleItemOptions {}

export type INext = () => Promise<any>;

export interface PaginationData<T> {
  pageSize: number;
  page: number;
  total: number;
  data: T[];
}

export function isPaginationData<T>(
  data: PaginationData<T> | any,
): data is PaginationData<T> {
  return (
    data &&
    data.pageSize != null &&
    data.page != null &&
    data.total != null &&
    data.data != null &&
    _.isArray(data.data)
  );
}
