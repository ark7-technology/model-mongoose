"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimestampModel = void 0;
const model = require("./model");
let TimestampModel = class TimestampModel extends model.Model {
};
__decorate([
    model.Field({
        default: Date.now,
        index: true,
    }),
    __metadata("design:type", Date)
], TimestampModel.prototype, "createdAt", void 0);
__decorate([
    model.Field({
        index: true,
    }),
    __metadata("design:type", Date)
], TimestampModel.prototype, "lastUpdateTime", void 0);
TimestampModel = __decorate([
    model.Pre({
        name: 'save',
        fn: setLastUpdateTimeOnSave,
    }),
    model.Pre({
        name: 'findOneAndUpdate',
        fn: setLastUpdateTimeOnUpdate,
    })
], TimestampModel);
exports.TimestampModel = TimestampModel;
function setLastUpdateTimeOnSave(next) {
    this.lastUpdateTime = Date.now();
    next();
}
function setLastUpdateTimeOnUpdate(next) {
    this.update({}, {
        $set: {
            lastUpdateTime: Date.now(),
        },
        $setOnInsert: {
            createdAt: Date.now(),
        },
    });
    next();
}

//# sourceMappingURL=timestamp.js.map
