import * as React from "react";
import { List } from "../OfficeFabric/List";
import { autobind } from "../OfficeFabric/Utilities";

import { HostNavigationService } from "VSS/SDK/Services/Navigation";
import Utils_Date = require("VSS/Utils/Date");

import { UrlActions, IBugBash, LoadingState, BugBashRecurrence } from "../Models";
import { HubView, IHubViewState, IHubViewProps } from "./HubView";
import { Loading } from "./Loading";

import { NewBugBashButton } from "./NewBugBashButton";
import { MessagePanel, MessageType } from "./MessagePanel";

interface IAllHubViewState extends IHubViewState {
    items: IBugBash[];
}

export class AllBugBashesView extends HubView<IAllHubViewState> {
    
    public render(): JSX.Element {
        return (
            <div className="all-view">
                <NewBugBashButton />
                <div className="all-view-contents">
                    {this._getContents()}
                </div>
            </div>
        );
    }

    private _getContents(): JSX.Element {
        if (this.state.loadingState === LoadingState.Loading) {
            return <Loading />;
        }
        else {
            if (this.state.items.length == 0) {
                return <MessagePanel message="No instance of bug bash created yet." messageType={MessageType.Info} />
            }
            else {
                return <List items={this.state.items} className="instance-list" onRenderCell={this._onRenderCell} />
            }
        }
    }

    protected initialize(): void {
        this.props.context.actionsCreator.initializeAllBugBashes();
    }

    protected getStateFromStore(): IAllHubViewState {
        return {
            items: this.props.context.stores.bugBashItemStore.getAll(),
            loadingState: this.props.context.stores.bugBashItemStore.isLoaded() ? LoadingState.Loaded : LoadingState.Loading
        };
    }

    @autobind
    private _onRenderCell(item: IBugBash, index?: number): React.ReactNode {
        return (
            <div className="instance-row">
                <div className="instance-title" onClick={() => this._onRowClick(item)}>{ item.title }</div>
                <div className="instance-info">
                    <div className="instance-info-cell-container"><div className="instance-info-cell">Recurrence:</div><div className="instance-info-cell-info">{BugBashRecurrence[item.reccurence]}</div></div>
                    <div className="instance-info-cell-container"><div className="instance-info-cell">Work item tag:</div><div className="instance-info-cell-info">{item.workItemTag}</div></div>
                    { item.startTime && (<div className="instance-info-cell-container"><div className="instance-info-cell">Start:</div><div className="instance-info-cell-info">{Utils_Date.format(item.startTime, "dddd, MMMM dd, yyyy")}</div></div>) }
                    { item.endTime && (<div className="instance-info-cell-container"><div className="instance-info-cell">End:</div><div className="instance-info-cell-info">{Utils_Date.format(item.endTime, "dddd, MMMM dd, yyyy")}</div></div>) }
                </div>
            </div>
        );
    }

    @autobind
    private async _onRowClick(item: IBugBash) {
        let navigationService: HostNavigationService = await VSS.getService(VSS.ServiceIds.Navigation) as HostNavigationService;
        navigationService.updateHistoryEntry(UrlActions.ACTION_VIEW, {id: item.id});
    }
}