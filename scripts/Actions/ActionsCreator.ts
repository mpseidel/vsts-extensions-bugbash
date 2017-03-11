import { Action } from "VSS/Flux/Action";

import { IBugBash } from "../Models";
import { IBugBashItemStore } from "../Stores/BugbashItemStore";
import { BugBashManager } from "../BugbashManager";

export class ActionsHub {
    // Query hierarchy store actions
    public InitializeBugBashItems = new Action<IBugBash[]>();
    public BugBashItemDeleted = new Action<IBugBash>();
    public BugBashItemAdded = new Action<IBugBash>();
    public BugBashItemUpdated = new Action<IBugBash>();
}

export class ActionsCreator {
    constructor(private _actionsHub: ActionsHub, private _bugBashItemDataProvider: IBugBashItemStore) {
        
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

    public async ensureBugBash(id: string): Promise<boolean> {
        if (!this._bugBashItemDataProvider.itemExists(id)) {
            let bugbash = await BugBashManager.readBugBash(id);
            if (bugbash) {
                this._actionsHub.BugBashItemAdded.invoke(bugbash);
                return true;
            }

            return false;
        }
        else {
            return true;
        }
    }  

    public async deleteBugBash(bugBash: IBugBash) {         
        let deleted = await BugBashManager.deleteBugBash(bugBash.id);

        if (deleted) {
            this._actionsHub.BugBashItemDeleted.invoke(bugBash);
        }
    }

    public async createBugBash(bugBash: IBugBash) {         
        let savedBugBash = await BugBashManager.writeBugBash(bugBash);

        if (savedBugBash) {
            this._actionsHub.BugBashItemAdded.invoke(savedBugBash);
        }
    }

    public async updateBugBash(bugBash: IBugBash) {         
        let savedBugBash = await BugBashManager.writeBugBash(bugBash);

        if (savedBugBash) {
            this._actionsHub.BugBashItemUpdated.invoke(savedBugBash);
        }
    }
}
