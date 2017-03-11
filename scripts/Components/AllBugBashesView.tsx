import * as React from "react";

import { HostNavigationService } from "VSS/SDK/Services/Navigation";

import { UrlActions, IBugBash, LoadingState } from "../Models";
import { HubView, IHubViewState, IHubViewProps } from "./HubView";
import { Loading } from "./Loading";

import { NewBugBashButton } from "./NewBugBashButton";
import { MessagePanel, MessageType } from "./MessagePanel";

export class AllBugBashesView extends HubView {
    
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
                return <MessagePanel message="No bug bashes found" messageType={MessageType.Info} />
            }
            else {
                return <MessagePanel message="yay" messageType={MessageType.Info} />
            }
        }
    }

    protected initialize(): void {
        this.props.context.actionsCreator.initializeAllBugBashes();
    }

    protected getStateFromStore(): IHubViewState {
        return {
            items: this.props.context.stores.bugBashItemStore.getAll(),
            loadingState: this.props.context.stores.bugBashItemStore.isLoaded() ? LoadingState.Loaded : LoadingState.Loading
        };
    }
}