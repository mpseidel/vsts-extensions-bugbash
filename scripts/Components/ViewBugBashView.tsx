import * as React from "react";

import { IBugBash, LoadingState, UrlActions } from "../Models";
import { HubView, IHubViewState, IHubViewProps } from "./HubView";
import { Loading } from "./Loading";
import { MessagePanel, MessageType } from "./MessagePanel";
import { WorkItemsViewer } from "./WorkItemsViewer";
import { NewWorkItemCreator } from "./NewWorkItemCreator";

import { HostNavigationService } from "VSS/SDK/Services/Navigation";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import { WorkItemTemplateReference, WorkItemTemplate, WorkItemField, WorkItemType, WorkItemQueryResult, Wiql, WorkItem, FieldType } from "TFS/WorkItemTracking/Contracts";

import { CommandBar } from "../OfficeFabric/CommandBar";
import { IContextualMenuItem } from "../OfficeFabric/components/ContextualMenu/ContextualMenu.Props";
import { autobind } from "../OfficeFabric/Utilities";

interface IViewHubViewState extends IHubViewState {
    item: IBugBash;
    resultsLoaded: boolean;
    resultsLoading: boolean;
    workItemResults: WorkItem[];
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
            else if(this.state.item.templateId && !this.props.context.stores.workItemTemplateStore.getItem(this.state.item.templateId)) {
                return <MessagePanel message="The template specified in this instance of bug bash doesnt exist in the context of the current team." messageType={MessageType.Error} />;
            }
            else {
                return (
                    <div className="results-view">
                        <div className="results-view-menu">
                            <CommandBar items={this._getMenuItems()} />
                        </div>
                        <div className="contents">
                            <WorkItemsViewer areResultsReady={!this.state.resultsLoading && this.state.resultsLoaded} workItems={this.state.workItemResults} refreshWorkItems={this._refreshWorkItemsView} context={this.props.context} />
                            <NewWorkItemCreator addWorkItem={this._addWorkItem} item={this.state.item} context={this.props.context} />
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
                workItemResults: []
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
            workItemResults: []
        }
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
        this.setState(this._mergeState({resultsLoading: true, resultsLoaded: false, workItemResults: []}));

        let queryResult = await WitClient.getClient().queryByWiql(this._getWiql(), VSS.getWebContext().project.id);
        let workItemIds = queryResult.workItems.map(workItem => workItem.id);
        let workItems: WorkItem[];

        if (workItemIds.length > 0) {
            workItems = await WitClient.getClient().getWorkItems(workItemIds);
        }
        else {
            workItems = [];
        }

        this.setState(this._mergeState({resultsLoading: false, resultsLoaded: true, workItemResults: workItems}));
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
        let workItems = this.state.workItemResults.concat(workItem);
        this.setState(this._mergeState({workItemResults: workItems}));
    }
}