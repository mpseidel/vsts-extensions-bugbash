import Service = require("VSS/Service");
import { Constants, IBugBash } from "./Models";

export class BugBashManager {
    public static async readBugBashes(): Promise<IBugBash[]> {
        let dataService: IExtensionDataService = await VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData);

        try {            
            return await dataService.getDocuments(Constants.STORAGE_KEY);
        }
        catch (e) {
            return [];
        }
    }

    public static async readBugBash(bugBashId: string): Promise<IBugBash> {
        try {
            let dataService: IExtensionDataService = await VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData);
            return await dataService.getDocument(Constants.STORAGE_KEY, bugBashId);
        }
        catch (e) {
            return null;
        }
    }

    public static async writeBugBash(bugBashModel: IBugBash): Promise<IBugBash> {
        try {
            let dataService: IExtensionDataService = await VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData);
            return await dataService.setDocument(Constants.STORAGE_KEY, bugBashModel);
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
}