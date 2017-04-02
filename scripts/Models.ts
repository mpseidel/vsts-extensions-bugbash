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
    export var BUGBASH_ACCEPT_TAG = "BugBashItemAccepted";
    export var BUGBASH_REJECT_TAG = "BugBashItemRejected";
    export var ACCEPT_STATUS_CELL_NAME = "BugBashItemAcceptStatus";
    export var ACCEPTED_TEXT = "Accepted";
    export var REJECTED_TEXT = "Rejected";
    export var ACTIONS_CELL_NAME = "Actions";
    export var ACCEPT_CONFIG_TEMPLATE_KEY = "Accept";
    export var REJECT_CONFIG_TEMPLATE_KEY = "Reject";
}

export interface IBugBash {
    id: string,
    title: string;
    workItemType: string;
    readonly __etag: number;
    templateId: string;
    manualFields: string[];
    description?: string;    
    startTime?: Date;
    endTime?: Date;
    projectId: string;
    teamId: string;
    configTemplates: IDictionaryStringTo<string>;
}

export enum LoadingState {
    Loading,
    Loaded
}

export interface IBaseProps {
    context: IHubContext;
}