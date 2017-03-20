import { BugBashItemStore } from "./BugBashItemStore";
import { WorkItemFieldStore } from "./WorkItemFieldStore";
import { WorkItemTemplateStore } from "./WorkItemTemplateStore";
import { WorkItemTypeStore } from "./WorkItemTypeStore";
import { ActionsHub } from "../Actions/ActionsCreator";

export class StoresHub {
    public bugBashItemStore: BugBashItemStore;
    public workItemFieldStore: WorkItemFieldStore;
    public workItemTemplateStore: WorkItemTemplateStore;
    public workItemTypeStore: WorkItemTypeStore;

    constructor(actions: ActionsHub) {
        this.bugBashItemStore = new BugBashItemStore(actions);
        this.workItemFieldStore = new WorkItemFieldStore(actions);
        this.workItemTemplateStore = new WorkItemTemplateStore(actions);
        this.workItemTypeStore = new WorkItemTypeStore(actions);
    }
}
