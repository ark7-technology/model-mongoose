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
exports.SoftDeleteModel = void 0;
const model = require("./model");
let SoftDeleteModel = class SoftDeleteModel extends model.DocumentModel {
    async delete() {
        if (this.deleted) {
            return this;
        }
        this.deleted = true;
        return await this.save();
    }
};
__decorate([
    model.Field({
        type: Boolean,
        default: false,
    }),
    __metadata("design:type", Boolean)
], SoftDeleteModel.prototype, "deleted", void 0);
SoftDeleteModel = __decorate([
    model.Pre({
        name: 'remove',
        fn: blockRemove,
    }),
    model.Pres(model.preQueries, { fn: patchDelete })
], SoftDeleteModel);
exports.SoftDeleteModel = SoftDeleteModel;
function patchDelete() {
    if (this._conditions == null) {
        this._conditions = {};
    }
    if (this._conditions.deleted === undefined && !this.options.withDeleted) {
        this._conditions.deleted = false;
    }
}
function blockRemove(next) {
    next(new Error('remove is not supported, use delete instead'));
}

//# sourceMappingURL=soft-delete.js.map
