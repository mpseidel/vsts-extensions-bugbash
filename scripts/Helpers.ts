import { Constants } from "./Models";

import Utils_String = require("VSS/Utils/String");
import Utils_Array = require("VSS/Utils/Array");
import {JsonPatchDocument, JsonPatchOperation, Operation} from "VSS/WebApi/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import { WorkItem } from "TFS/WorkItemTracking/Contracts";
import * as WitBatchClient from "TFS/WorkItemTracking/BatchRestClient";

/**
 * Parse a distinct display name string into an entity reference object
 * 
 * @param name A distinct display name for an identity
 */
export function parseUniquefiedIdentityName(name: string): {displayName: string, uniqueName: string, imageUrl: string} {
    if (!name) { 
        return {
            displayName: "",
            uniqueName: "",
            imageUrl: ""
        };
    }
    
    let i = name.lastIndexOf("<");
    let j = name.lastIndexOf(">");
    let displayName = name;
    let alias = "";
    let rightPart = "";
    let id = "";
    if (i >= 0 && j > i && j === name.length - 1) {
        displayName = $.trim(name.substr(0, i));
        rightPart = $.trim(name.substr(i + 1, j - i - 1)); //gets string in the <>
        let vsIdFromAlias: string = getVsIdFromGroupUniqueName(rightPart); // if it has vsid in unique name (for TFS groups)

        if (rightPart.indexOf("@") !== -1 || rightPart.indexOf("\\") !== -1 || vsIdFromAlias || Utils_String.isGuid(rightPart)) {
            // if its a valid alias
            alias = rightPart;

            // If the alias component is just a guid then this is not a uniqueName but
            // vsId which is used only for TFS groups
            if (vsIdFromAlias != "") {
                id = vsIdFromAlias;
                alias = "";
            }
        }
        else {
            // if its not a valid alias, treat it as a non-identity string
            displayName = name;
        }
    }

    let imageUrl = "";
    if (id) {
        imageUrl = `${VSS.getWebContext().host.uri}/_api/_common/IdentityImage?id=${id}`;
    }
    else if(alias) {
        imageUrl = `${VSS.getWebContext().host.uri}/_api/_common/IdentityImage?identifier=${alias}&identifierType=0`;
    }

    return {
        displayName: displayName,
        uniqueName: alias,
        imageUrl: imageUrl
    };
}

export function getVsIdFromGroupUniqueName(str: string): string {
    let leftPart: string;
    if (!str) { return ""; }

    let vsid = "";
    let i = str.lastIndexOf("\\");
    if (i === -1) {
        leftPart = str;
    }
    else {
        leftPart = str.substr(0, i);
    }

    if (Utils_String.startsWith(leftPart, "id:")) {
        let rightPart = $.trim(leftPart.substr(3));
        vsid = Utils_String.isGuid(rightPart) ? rightPart : "";
    }

    return vsid;
}

export async function saveWorkItem(workItem: WorkItem, workItemType: string, fieldValues: IDictionaryStringTo<string>, withRevision?: boolean): Promise<WorkItem> {
    let patchDocument: JsonPatchDocument & JsonPatchOperation[] = [];
    for (let fieldRefName in fieldValues) {
        patchDocument.push({
            op: Operation.Add,
            path: `/fields/${fieldRefName}`,
            value: fieldValues[fieldRefName]
        } as JsonPatchOperation);
    }

    if (withRevision) {
        patchDocument.push({
            op: Operation.Test,
            path: "/rev",
            value: workItem.rev
        } as JsonPatchOperation);
    }

    return await WitClient.getClient().updateWorkItem(patchDocument, workItem.id);
}

export async function createWorkItem(workItemType: string, fieldValues: IDictionaryStringTo<string>): Promise<WorkItem> {
    let patchDocument: JsonPatchDocument & JsonPatchOperation[] = [];
    for (let fieldRefName in fieldValues) {
        patchDocument.push({
            op: Operation.Add,
            path: `/fields/${fieldRefName}`,
            value: fieldValues[fieldRefName]
        } as JsonPatchOperation);
    }

    return await WitClient.getClient().createWorkItem(patchDocument, VSS.getWebContext().project.id, workItemType);
}

export function isWorkItemAccepted(workItem: WorkItem): boolean {
    let tags: string = workItem.fields["System.Tags"] || "";
    let tagArr = tags.split(";");

    if (Utils_Array.findIndex(tagArr, (t: string) => Utils_String.equals(t.trim(), Constants.BUGBASH_ACCEPT_TAG, true)) !== -1) {
        return true;
    }

    return false;
}

export function isWorkItemRejected(workItem: WorkItem): boolean {
    let tags: string = workItem.fields["System.Tags"] || "";
    let tagArr = tags.split(";");

    if (Utils_Array.findIndex(tagArr, (t: string) => Utils_String.equals(t.trim(), Constants.BUGBASH_REJECT_TAG, true)) !== -1) {
        return true;
    }

    return false;
}

export function getBugBashTag(bugbashId: string): string {
    return `BugBash_${bugbashId}`;
}

export function isInteger(value: string): boolean {
    return /^\d+$/.test(value);
}

export async function removeFromBugBash(bugBashId: string, workItems: WorkItem[]): Promise<void> {
    let updates: [number, JsonPatchDocument][] = [];

    for (const workItem of workItems){
        let tagArr: string[] = (workItem.fields["System.Tags"] as string || "").split(";");
        tagArr.forEach((t: string, i: number) => { tagArr[i] = t.trim(); });

        // remove bugbash id tag
        let index = tagArr.indexOf(getBugBashTag(bugBashId));
        if (index !== -1) {
            tagArr.splice(index, 1);
        }

        // remove bugbash reject tag
        index = tagArr.indexOf(Constants.BUGBASH_REJECT_TAG);
        if (index !== -1) {
            tagArr.splice(index, 1);
        }

        // remove bugbash accept tag
        index = tagArr.indexOf(Constants.BUGBASH_ACCEPT_TAG);
        if (index !== -1) {
            tagArr.splice(index, 1);
        }
        
        let patchDocument: JsonPatchDocument & JsonPatchOperation[] = [{
                op: Operation.Add,
                path: `/fields/System.Tags`,
                value: tagArr.join(";")
            } as JsonPatchOperation];

        patchDocument.push({
            op: Operation.Test,
            path: "/rev",
            value: workItem.rev
        } as JsonPatchOperation);

        updates.push([workItem.id, patchDocument]);
    }

    await WitBatchClient.getClient().updateWorkItemsBatch(updates);
}