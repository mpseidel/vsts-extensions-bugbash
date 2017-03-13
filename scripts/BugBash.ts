import {  IBugBash } from "./Models";

import Utils_String = require("VSS/Utils/String");
import Utils_Array = require("VSS/Utils/Array");
import Utils_Date = require("VSS/Utils/Date");

export class BugBash {
    public static getNew(): BugBash {
        return new BugBash({
            id: "",
            title: "",
            __etag: 0,
            workItemTag: "",
            templateId: "",
            manualFields: []
        });
    }

    private _model: IBugBash;
    private _originalModel: IBugBash;
    private _onChangedDelegate: () => void;

    constructor(model: IBugBash) {
        this._model = {...model};
        this._originalModel = {...model};
    }

    public getModel(): IBugBash {
        return this._model;
    }

    public isNew(): boolean {
        return !this._model.id;
    }

    public reset() {
        this._model = {...this._originalModel};
        this.fireChanged();
    }

    public renew() {
        this._originalModel = {...this._model};
        this.fireChanged();
    }

    public isDirty(): boolean {        
        return !Utils_String.equals(this._model.title, this._originalModel.title)
            || !Utils_String.equals(this._model.description, this._originalModel.description)
            || !Utils_String.equals(this._model.workItemTag, this._originalModel.workItemTag)
            || !Utils_Date.equals(this._model.startTime, this._originalModel.startTime)
            || !Utils_Date.equals(this._model.endTime, this._originalModel.endTime)
            || !Utils_String.equals(this._model.templateId, this._originalModel.templateId)
            || !Utils_Array.arrayEquals(this._model.manualFields, this._originalModel.manualFields, (item1: string, item2: string) => Utils_String.equals(item1, item2, true))
    }

    public isValid(): boolean {
        return this._model.title.trim().length > 0
            && this._model.title.length <= 128
            && this._model.workItemTag.trim().length > 0
            && this._model.workItemTag.length <= 128
            && this._model.manualFields.length > 0;
    }

    public attachChanged(handler: () => void) {
        this._onChangedDelegate = handler;
    }

    public detachChanged() {
        this._onChangedDelegate = null;
    }

    public fireChanged() {
        if (this._onChangedDelegate) {
            this._onChangedDelegate();
        }
    }

    public updateTitle(newTitle: string) {
        this._model.title = newTitle;
        this.fireChanged();
    }

    public updateDescription(newDescription: string) {
        this._model.description = newDescription;
        this.fireChanged();
    }

    public updateStartTime(newStartTime: Date) {
        this._model.startTime = newStartTime;
        this.fireChanged();
    }

    public updateEndTime(newEndTime: Date) {
        this._model.endTime = newEndTime;
        this.fireChanged();
    }

    public updateWorkItemTag(newTag: string) {
        this._model.workItemTag = newTag;
        this.fireChanged();
    }

    public updateTemplate(templateId: string) {
        this._model.templateId = templateId;
        this.fireChanged();
    }

    public updateManualFields(fieldNames: string[]) {
        this._model.manualFields = fieldNames;
        this.fireChanged();
    }
}