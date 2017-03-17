import { Action } from "VSS/Flux/Action";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";
import { WorkItemTemplateReference } from "TFS/WorkItemTracking/Contracts";

import { IBugBash } from "../Models";
import { IBugBashItemStore } from "../Stores/BugbashItemStore";
import { IWorkItemFieldStore } from "../Stores/WorkItemFieldItemStore";
import { IWorkItemTemplateStore } from "../Stores/WorkItemTemplateStore";
import { BugBashManager } from "../BugbashManager";

import * as WitClient from "TFS/WorkItemTracking/RestClient";

export class ActionsHub {
    public InitializeBugBashItems = new Action<IBugBash[]>();
    public BugBashItemDeleted = new Action<IBugBash>();
    public BugBashItemAdded = new Action<IBugBash>();
    public BugBashItemUpdated = new Action<IBugBash>();

    public InitializeFieldItems = new Action<WorkItemField[]>();

    public InitializeWorkItemTemplateItems = new Action<WorkItemTemplateReference[]>();
    public TemplateItemAdded = new Action<WorkItemTemplateReference>();
}

export class ActionsCreator {
    constructor(
        private _actionsHub: ActionsHub, 
        private _bugBashItemDataProvider: IBugBashItemStore, 
        private _workItemFieldItemDataProvider: IWorkItemFieldStore,
        private _workItemTemplateItemDataProvider: IWorkItemTemplateStore) {
        
    }  

    public async initializeAllBugBashes() {
        if (this._bugBashItemDataProvider.isLoaded()) {
            // Do nothing if query hierarchy data is already loaded
            this._actionsHub.InitializeBugBashItems.invoke(null);
        }
        else {            
            let bugbashes = await BugBashManager.readBugBashes();
            this._actionsHub.InitializeBugBashItems.invoke(bugbashes);
        }
    }

    public async initializeWorkItemFields() {
        if (this._workItemFieldItemDataProvider.isLoaded()) {
            // Do nothing if query hierarchy data is already loaded
            this._actionsHub.InitializeFieldItems.invoke(null);
        }
        else {            
            let fields = await WitClient.getClient().getFields(VSS.getWebContext().project.id);
            this._actionsHub.InitializeFieldItems.invoke(fields);
        }
    }

    public async initializeWorkItemTemplates() {
        if (this._workItemTemplateItemDataProvider.isLoaded()) {
            // Do nothing if query hierarchy data is already loaded
            this._actionsHub.InitializeWorkItemTemplateItems.invoke(null);
        }
        else {            
            let templates = await WitClient.getClient().getTemplates(VSS.getWebContext().project.id, VSS.getWebContext().team.id, "Bug");
            this._actionsHub.InitializeWorkItemTemplateItems.invoke(templates);
        }
    }

    public async ensureWorkItemTemplate(id: string): Promise<boolean> {
        if (!this._workItemTemplateItemDataProvider.itemExists(id)) {
            try {
                let template = await WitClient.getClient().getTemplate(VSS.getWebContext().project.id, VSS.getWebContext().team.id, id);
                if (template) {
                    this._actionsHub.TemplateItemAdded.invoke(template);
                    return true;
                }
            }
            catch (e) {
                return false;
            }
            return false;
        }
        else {
            return true;
        }
    }  

    public async ensureBugBash(id: string): Promise<boolean> {
        if (!this._bugBashItemDataProvider.itemExists(id)) {
            try {
                let bugbash = await BugBashManager.readBugBash(id);
                if (bugbash) {
                    this._actionsHub.BugBashItemAdded.invoke(bugbash);
                    return true;
                }
            }
            catch (e) {
                return false;
            }

            return false;
        }
        else {
            return true;
        }
    }  

    public async deleteBugBash(bugBash: IBugBash): Promise<boolean> {         
        let deleted = await BugBashManager.deleteBugBash(bugBash);

        if (deleted) {
            this._actionsHub.BugBashItemDeleted.invoke(bugBash);
        }

        return deleted;
    }

    public async createBugBash(bugBash: IBugBash): Promise<IBugBash> {     
        bugBash.id = bugBash.id || Date.now().toString();    
        let savedBugBash = await BugBashManager.writeBugBash(bugBash);

        if (savedBugBash) {
            this._actionsHub.BugBashItemAdded.invoke(savedBugBash);
        }

        return savedBugBash;
    }

    public async updateBugBash(bugBash: IBugBash): Promise<IBugBash> {         
        let savedBugBash = await BugBashManager.writeBugBash(bugBash);

        if (savedBugBash) {
            this._actionsHub.BugBashItemUpdated.invoke(savedBugBash);
        }

        return savedBugBash;
    }
}
