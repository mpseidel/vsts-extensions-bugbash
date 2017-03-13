import * as React from "react";
import { ActionsCreator, ActionsHub } from "./Actions/ActionsCreator";
import { StoresHub } from "./Stores/StoresHub";

export interface IHubContext {
    /**
     * Actions hub
     */
    actions: ActionsHub;

    /**
     * Stores hub
     */
    stores: StoresHub;

    /**
     * Action creator
     */
    actionsCreator: ActionsCreator;
}

export module UrlActions {
    export var ACTION_NEW = "new";
    export var ACTION_ALL = "all";
    export var ACTION_VIEW = "view";
    export var ACTION_EDIT = "edit";
}

export module Constants {
    export var STORAGE_KEY = "bugbashes";
    export var ACTION_VIEW = "view";
    export var ACTION_EDIT = "edit";
}

export interface IBugBash {
    id: string,
    title: string;
    readonly __etag: number;
    workItemTag: string;
    templateId: string;
    manualFields: string[];
    description?: string;    
    startTime?: Date;
    endTime?: Date;
    reccurence: BugBashRecurrence;
}

export enum BugBashRecurrence {
    None = 0,
    Daily,
    Weekly,
    Monthly
}

export enum LoadingState {
    Loading,
    Loaded
}

export interface IBaseProps {
    context: IHubContext;
}