"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.A7Model = void 0;
const model = require("./model");
const timestamp = require("./timestamp");
const dataLevel = require("./data-level");
const discriminator = require("./discriminator");
let A7Model = class A7Model extends model.DocumentModel {
};
A7Model = __decorate([
    model.Mixin(timestamp.TimestampModel),
    model.Mixin(dataLevel.DataLevelModel),
    model.Mixin(discriminator.Discriminator)
], A7Model);
exports.A7Model = A7Model;

//# sourceMappingURL=a7-model.js.map
