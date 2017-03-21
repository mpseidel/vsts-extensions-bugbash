import * as React from "react";

import { IBugBash, LoadingState, UrlActions } from "../Models";
import { HubView, IHubViewState } from "./HubView";
import { Loading } from "./Loading";
import { MessagePanel, MessageType } from "./MessagePanel";
import { WorkItemsViewer } from "./WorkItemsViewer";
import { NewWorkItemCreator } from "./NewWorkItemCreator";
import { WorkItemDiscussion } from "./WorkItemDiscussion";

import { HostNavigationService } from "VSS/SDK/Services/Navigation";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import { Wiql, WorkItem } from "TFS/WorkItemTracking/Contracts";
import Utils_Date = require("VSS/Utils/Date");
import Utils_String = require("VSS/Utils/String");
import Utils_Array = require("VSS/Utils/Array");

import { CommandBar } from "../OfficeFabric/CommandBar";
import { SearchBox } from "../OfficeFabric/SearchBox";
import { IContextualMenuItem } from "../OfficeFabric/components/ContextualMenu/ContextualMenu.Props";
import { autobind } from "../OfficeFabric/Utilities";

interface IViewHubViewState extends IHubViewState {
    item: IBugBash;
    resultsLoaded: boolean;
    resultsLoading: boolean;
    workItemResults: WorkItem[];
    filterText: string;
    sortColumn: string;
    sortOrder: string;
    showDiscussions?: boolean;
    discussionWorkItem?: WorkItem;
}

export class ViewBugBashView extends HubView<IViewHubViewState> {

    public render(): JSX.Element {
        if (this.state.loadingState === LoadingState.Loading) {
            return <Loading />;
        }
        else {
            if (!this.state.item) {
                return <MessagePanel message="This instance of bug bash doesnt exist in the context of current team." messageType={MessageType.Error} />;
            }
            else {
                let rightSideComponent;

                if (this.state.showDiscussions && this.state.discussionWorkItem) {
                    rightSideComponent = <WorkItemDiscussion workItem={this.state.discussionWorkItem} onClose={this._hideDiscussions} context={this.props.context} />;
                }
                else if(this.state.item.templateId && !this.props.context.stores.workItemTemplateStore.getItem(this.state.item.templateId)) {
                    rightSideComponent = <MessagePanel message="The template specified in this instance of bug bash doesnt exist in the context of the current team." messageType={MessageType.Warning} />;
                }
                else {
                    rightSideComponent = <NewWorkItemCreator addWorkItem={this._addWorkItem} item={this.state.item} context={this.props.context} />;
                }

                return (
                    <div className="results-view">
                        <div className="results-view-menu">                            
                            <SearchBox className="results-view-searchbox" 
                                value={this.state.filterText || ""}
                                onSearch={(searchText: string) => this._updateFilterText(searchText)} 
                                onChange={(newText: string) => {
                                    if (newText.trim() === "") {
                                        this._updateFilterText("");
                                    }
                                }} />
                            <CommandBar className="results-view-menu-toolbar" items={this._getMenuItems()} />
                        </div>
                        <div className="contents">
                            <WorkItemsViewer 
                                areResultsReady={!this.state.resultsLoading && this.state.resultsLoaded} 
                                sortColumn={this.state.sortColumn} 
                                sortOrder={this.state.sortOrder} 
                                configTemplates={this.state.item.configTemplates || {}}
                                workItems={this._sortAndFilterWorkItems(this.state.workItemResults)} 
                                refreshWorkItems={this._refreshWorkItemsView} 
                                changeSort={this._changeSort}
                                onShowDiscussions={this._showDiscussions}
                                context={this.props.context} />
                            
                            <div className="right-side-content">
                                {rightSideComponent}
                            </div>
                        </div>
                    </div>
                );                
            }            
        }
    }

    protected async initialize() {                
        let found = await this.props.context.actionsCreator.ensureBugBash(this.props.id);
        if (!found) {
            this.setState({
                item: null,
                loadingState: LoadingState.Loaded,
                resultsLoading: false,
                resultsLoaded: false,
                workItemResults: [],
                filterText: ""
            });
        }
        else {
            this.props.context.actionsCreator.initializeWorkItemFields();
            this.props.context.actionsCreator.initializeWorkItemTemplates();
            this._refreshWorkItemResults();
        }
    }

    protected getStateFromStore(): IViewHubViewState {
        const item = this.props.context.stores.bugBashItemStore.getItem(this.props.id);
        let loadingState = this.props.context.stores.bugBashItemStore.isLoaded() && this.props.context.stores.workItemFieldStore.isLoaded() && this.props.context.stores.workItemTemplateStore.isLoaded() 
                ? LoadingState.Loaded : LoadingState.Loading;
        
        return this._mergeState({item: item, loadingState: loadingState});
    }

    private _getDefaultState(): IViewHubViewState {
        return {
            item: null,
            loadingState: LoadingState.Loading,
            resultsLoaded: false,
            resultsLoading: false,
            workItemResults: [],
            sortColumn: "System.CreatedDate",
            sortOrder: "desc",
            filterText: ""
        }
    }

    @autobind
    private _sortAndFilterWorkItems(workItems: WorkItem[]): WorkItem[] {
        let items = workItems.slice();
        let sortedItems = items.sort((w1: WorkItem, w2: WorkItem) => {
            if (Utils_String.equals(this.state.sortColumn, "ID", true)) {
                return this.state.sortOrder === "desc" ? ((w1.id > w2.id) ? -1 : 1) : ((w1.id > w2.id) ? 1 : -1);
            }
            else if (Utils_String.equals(this.state.sortColumn, "System.CreatedDate", true)) {
                let d1 = new Date(w1.fields["System.CreatedDate"]);
                let d2 = new Date(w2.fields["System.CreatedDate"]);
                return this.state.sortOrder === "desc" ? -1 * Utils_Date.defaultComparer(d1, d2) : Utils_Date.defaultComparer(d1, d2);
            }
            else {
                let v1 = w1.fields[this.state.sortColumn];
                let v2 = w2.fields[this.state.sortColumn];
                return this.state.sortOrder === "desc" ? -1 * Utils_String.ignoreCaseComparer(v1, v2) : Utils_String.ignoreCaseComparer(v1, v2);
            }
        });

        if (!this.state.filterText) {
            return sortedItems;
        }
        else {
            return sortedItems.filter((workItem: WorkItem) => {
                const filterText = this.state.filterText;
                return `${workItem.id}` === filterText
                    || Utils_String.caseInsensitiveContains(workItem.fields["System.AssignedTo"] || "", filterText)
                    || Utils_String.caseInsensitiveContains(workItem.fields["System.State"] || "", filterText)
                    || Utils_String.caseInsensitiveContains(workItem.fields["System.CreatedBy"] || "", filterText)
                    || Utils_String.caseInsensitiveContains(workItem.fields["System.Title"] || "", filterText)
                    || Utils_String.caseInsensitiveContains(workItem.fields["System.AreaPath"] || "", filterText);
            });
        }
    }

    @autobind
    private _showDiscussions(workItem: WorkItem): void {
        this.setState(this._mergeState({showDiscussions: true, discussionWorkItem: workItem}));
    }

    @autobind
    private _hideDiscussions(): void {
        this.setState(this._mergeState({showDiscussions: false, discussionWorkItem: null}));
    }

    @autobind
    private _updateFilterText(searchText: string): void {
        this.setState(this._mergeState({filterText: searchText}));
    }

    @autobind
    private _changeSort(sortColumn: string, sortOrder: string): void {
        this.setState(this._mergeState({sortColumn: sortColumn, sortOrder: sortOrder}));
    }

    @autobind
    private _getMenuItems(): IContextualMenuItem[] {
        return [
            {
                key: "edit", name: "Edit", title: "Edit", iconProps: {iconName: "Edit"},
                onClick: async (event?: React.MouseEvent<HTMLElement>, menuItem?: IContextualMenuItem) => {
                    let navigationService: HostNavigationService = await VSS.getService(VSS.ServiceIds.Navigation) as HostNavigationService;
                    navigationService.updateHistoryEntry(UrlActions.ACTION_EDIT, {id: this.props.id});
                }
            },            
            {
                key: "refresh", name: "Refresh", title: "Refresh list", iconProps: {iconName: "Refresh"},
                onClick: async (event?: React.MouseEvent<HTMLElement>, menuItem?: IContextualMenuItem) => {
                    this._refreshWorkItemResults();
                }
            }                    
        ];        
    }

    private async _refreshWorkItemResults() {
        this.setState(this._mergeState({resultsLoading: true, resultsLoaded: false, workItemResults: [], filterText: "", showDiscussions: false, discussionWorkItem: null}));

        let queryResult = await WitClient.getClient().queryByWiql(this._getWiql(), VSS.getWebContext().project.id);
        let workItemIds = queryResult.workItems.map(workItem => workItem.id);
        let workItems: WorkItem[];

        if (workItemIds.length > 0) {
            workItems = await WitClient.getClient().getWorkItems(workItemIds);
        }
        else {
            workItems = [];
        }

        this.setState(this._mergeState({resultsLoading: false, resultsLoaded: true, workItemResults: workItems, filterText: "", showDiscussions: false, discussionWorkItem: null}));
    }

    private _mergeState(newState: any) {
        let currentState = this.state || this._getDefaultState();
        return {...currentState, ...newState};
    }

    private _getWiql(): Wiql {
        const item = this.props.context.stores.bugBashItemStore.getItem(this.props.id);

        return {
            query: `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.WorkItemType] = '${item.workItemType}' AND [System.Tags] CONTAINS '${item.workItemTag}' ORDER BY [System.CreatedDate] DESC`
        };
    }

    @autobind
    private _refreshWorkItemsView(workItems: WorkItem[]) {
        this.setState(this._mergeState({workItemResults: workItems}));
    }

    @autobind
    private _addWorkItem(workItem: WorkItem) {
        let workItems = [workItem].concat(this.state.workItemResults);
        this.setState(this._mergeState({workItemResults: workItems}));
    }
}