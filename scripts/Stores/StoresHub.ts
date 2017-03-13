import { BugBashItemStore } from "./BugBashItemStore";
import { WorkItemFieldItemStore } from "./WorkItemFieldItemStore";
import { WorkItemTemplateStore } from "./WorkItemTemplateStore";
import { ActionsHub } from "../Actions/ActionsCreator";

export class StoresHub {
    public bugBashItemStore: BugBashItemStore;
    public workItemFieldItemStore: WorkItemFieldItemStore;
    public workItemTemplateStore: WorkItemTemplateStore;

    constructor(actions: ActionsHub) {
        this.bugBashItemStore = new BugBashItemStore(actions);
        this.workItemFieldItemStore = new WorkItemFieldItemStore(actions);
        this.workItemTemplateStore = new WorkItemTemplateStore(actions);
    }
}
