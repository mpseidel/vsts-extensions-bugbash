import * as React from "react";
import { List } from "../OfficeFabric/List";
import { autobind } from "../OfficeFabric/Utilities";
import { CommandBar } from "../OfficeFabric/CommandBar";
import { Label } from "../OfficeFabric/Label";
import { IContextualMenuItem } from "../OfficeFabric/components/ContextualMenu/ContextualMenu.Props";

import { HostNavigationService } from "VSS/SDK/Services/Navigation";
import { WorkItemQueryResult, Wiql, WorkItem } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import { WorkItemFormNavigationService } from "TFS/WorkItemTracking/Services";
import Utils_Date = require("VSS/Utils/Date");

import { UrlActions, IBugBash, LoadingState } from "../Models";
import { HubView, IHubViewState, IHubViewProps } from "./HubView";
import { Loading } from "./Loading";
import { MessagePanel, MessageType } from "./MessagePanel";
import { BugBashEditor, IBugBashEditorProps } from "./BugBashEditor";

export class ViewBugBashView extends HubView {
    private _resultsLoaded: boolean;
    private _resultsLoading: boolean;
    private _workItems: WorkItem[];

    public render(): JSX.Element {
        if (this.state.loadingState === LoadingState.Loading) {
            return <Loading />;
        }
        else {
            if (!this.state.items) {
                return <MessagePanel message="This instance of bug bash doesnt exist." messageType={MessageType.Error} />
            }
            else {
                let menuitems: IContextualMenuItem[] = [
                    {
                        key: "edit", name: "Edit", title: "Edit", iconProps: {iconName: "Edit"},
                        onClick: async (event?: React.MouseEvent<HTMLElement>, item?: IContextualMenuItem) => {
                            let navigationService: HostNavigationService = await VSS.getService(VSS.ServiceIds.Navigation) as HostNavigationService;
                            navigationService.updateHistoryEntry(UrlActions.ACTION_EDIT, {id: this.props.id});
                        }
                    },            
                    {
                        key: "refresh", name: "Refresh", title: "Refresh list", iconProps: {iconName: "Refresh"},
                        onClick: async (event?: React.MouseEvent<HTMLElement>, item?: IContextualMenuItem) => {
                            this._refreshResults(this.state.items[0]);
                            this.setState(this.getStateFromStore());
                        }
                    }
                ];

                return (
                    <div className="results-view">
                        <div className="results-view-menu">
                            <CommandBar items={menuitems} />
                        </div>
                        <div className="contents">
                            <div className="results-view-contents">
                                { this.state.workItemResults.length == 0 && (<MessagePanel message="No bugs has been created yet in this bug bash." messageType={MessageType.Info} />) }
                                { this.state.workItemResults.length > 0 && (
                                    <List items={this.state.workItemResults} className="workitem-list" onRenderCell={this._onRenderCell}/>
                                ) }
                            </div>
                            <div className="add-workitem-contents">
                                <Label>Add bug</Label>
                            </div>
                        </div>
                    </div>
                );
            }            
        }
    }

    protected async initialize() {
        this.props.context.actionsCreator.initializeWorkItemFields();
        this.props.context.actionsCreator.initializeWorkItemTemplates();

        this._resultsLoaded = false;
        this._resultsLoading = false;
        
        let found = await this.props.context.actionsCreator.ensureBugBash(this.props.id);
        if (!found) {
            this.setState({
                items: null,
                loadingState: LoadingState.Loaded
            });
        }        
    }

    protected getStateFromStore(): IHubViewState {
        const item = this.props.context.stores.bugBashItemStore.getItem(this.props.id);
        
        if (item && !this._resultsLoaded && !this._resultsLoading) {
            this._refreshResults(item);
        }

        return {
            items: item ? [item] : null,
            workItemResults: this._workItems,
            fields: this.props.context.stores.workItemFieldItemStore.getAll(),
            templates: this.props.context.stores.workItemTemplateStore.getAll(),
            loadingState: this.props.context.stores.workItemFieldItemStore.isLoaded() 
                    && this.props.context.stores.workItemTemplateStore.isLoaded() 
                    && this.props.context.stores.bugBashItemStore.isLoaded() 
                    && this._resultsLoaded 
                    && !this._resultsLoading
                ? LoadingState.Loaded 
                : LoadingState.Loading
        };
    }

    @autobind
    private _onRenderCell(item: WorkItem, index?: number): React.ReactNode {
        return (
            <div className="workitem-row">
                <div>
                    <div className="workitem-id" onClick={(e: React.MouseEvent<HTMLElement>) => this._onWorkItemClick(e, item)}>{ item.id }</div>
                    <div className="workitem-title">{ item.fields["System.Title"] }</div>
                </div>                
                <div className="workitem-info">
                    <div className="workitem-info-cell-container"><div className="workitem-info-cell">Created By:</div><div className="workitem-info-cell-info">{ item.fields["System.CreatedBy"] }</div></div>
                    <div className="workitem-info-cell-container"><div className="workitem-info-cell">Created Date:</div><div className="workitem-info-cell-info">{ Utils_Date.friendly(new Date(item.fields["System.CreatedDate"])) }</div></div>
                </div>
                <div className="workitem-info">
                    <div className="workitem-info-cell-container"><div className="workitem-info-cell">State:</div><div className="workitem-info-cell-info">{ item.fields["System.State"] }</div></div>
                    <div className="workitem-info-cell-container"><div className="workitem-info-cell">Assigned To:</div><div className="workitem-info-cell-info">{ item.fields["System.AssignedTo"] || "Unassigned" }</div></div>
                    <div className="workitem-info-cell-container"><div className="workitem-info-cell">Area path:</div><div className="workitem-info-cell-info">{ item.fields["System.AreaPath"] }</div></div>
                    <div className="workitem-info-cell-container"><div className="workitem-info-cell">Tags:</div><div className="workitem-info-cell-info">{ item.fields["System.Tags"] }</div></div>
                </div>
            </div>
        );
    }

    @autobind
    private async _onWorkItemClick(e: React.MouseEvent<HTMLElement>, item: WorkItem) {
        let workItemNavSvc = await WorkItemFormNavigationService.getService();
        workItemNavSvc.openWorkItem(item.id);
    }

    private async _refreshResults(item: IBugBash) {
        this._resultsLoading = true;
        let queryResult = await WitClient.getClient().queryByWiql(this._getWiql(item.workItemTag), VSS.getWebContext().project.id);
        let workItemIds = queryResult.workItems.map(workItem => workItem.id);
        
        if (workItemIds.length > 0) {
            this._workItems = await WitClient.getClient().getWorkItems(workItemIds);
        }
        else {
            this._workItems = [];
        }
    
        this._resultsLoaded = true;
        this._resultsLoading = false;
        
        this.setState(this.getStateFromStore());
    }

    private _getWiql(workItemTag: string): Wiql {
        return {
            query: `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.WorkItemType] = 'Bug' AND [System.Tags] CONTAINS '${workItemTag}' ORDER BY [System.CreatedDate] DESC`
        };
    }
}