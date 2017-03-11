import { BugBashItemStore } from "./BugBashItemStore";
import { ActionsHub } from "../Actions/ActionsCreator";

export class StoresHub {
    public bugBashItemStore: BugBashItemStore;

    constructor(actions: ActionsHub) {
        this.bugBashItemStore = new BugBashItemStore(actions);
    }
}
