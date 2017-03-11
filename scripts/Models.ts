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

export const HubContextPropTypes: React.ValidationMap<any> = {
    actions: React.PropTypes.object.isRequired,
    stores: React.PropTypes.object.isRequired,
    actionsCreator: React.PropTypes.object.isRequired
};

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
    __etag: number;
    workItemIds: number[];
    initialFieldValues: IDictionaryStringTo<Object>;
    manualFields: string[];
    description?: string;    
    startTime?: Date;
    endTime?: string;    
}

export enum LoadingState {
    Loading,
    Loaded
}