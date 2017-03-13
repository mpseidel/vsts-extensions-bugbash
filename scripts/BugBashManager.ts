import Service = require("VSS/Service");
import { Constants, IBugBash } from "./Models";

export class BugBashManager {
    public static async readBugBashes(): Promise<IBugBash[]> {
        let dataService: IExtensionDataService = await VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData);

        try {            
            let items = await dataService.getDocuments(Constants.STORAGE_KEY);
            for(let item of items) {
                BugBashManager._translateDates(item);
            }

            return items;
        }
        catch (e) {
            return [];
        }
    }

    public static async readBugBash(bugBashId: string): Promise<IBugBash> {
        try {
            let dataService: IExtensionDataService = await VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData);
            let item = await dataService.getDocument(Constants.STORAGE_KEY, bugBashId);
            BugBashManager._translateDates(item);

            return item;
        }
        catch (e) {
            return null;
        }
    }

    public static async writeBugBash(bugBashModel: IBugBash): Promise<IBugBash> {
        try {
            let dataService: IExtensionDataService = await VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData);
            let item = await dataService.setDocument(Constants.STORAGE_KEY, bugBashModel);
            BugBashManager._translateDates(item);

            return item;
        }
        catch (e) {
            return null;
        }
    }

    public static async deleteBugBash(bugBashId: string): Promise<boolean> {
        try {
            let dataService: IExtensionDataService = await VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData);
            await dataService.deleteDocument(Constants.STORAGE_KEY, bugBashId);
            return true;
        }
        catch (e) {
            return false;
        }
    }

    private static _translateDates(item: any) {
        if (typeof item.startTime === "string") {
            if (item.startTime.trim() === "") {
                item.startTime = undefined;
            }
            else {
                item.startTime = new Date(item.startTime);
            }
        }
        if (typeof item.endTime === "string") {
            if (item.endTime.trim() === "") {
                item.endTime = undefined;
            }
            else {
                item.endTime = new Date(item.endTime);
            }
        }
    }
}