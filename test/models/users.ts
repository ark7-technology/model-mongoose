import * as mongoose from 'mongoose';
import { A7Model, Field } from '@ark7/model';

export class BaseModel {
  @Field() _id: mongoose.Types.ObjectId;
}

A7Model.provide(BaseModel);
