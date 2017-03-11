import * as React from "react";

import { HostNavigationService } from "VSS/SDK/Services/Navigation";

import { UrlActions, IHubContext, IBugBash, LoadingState } from "../Models";
import { HubView, IHubViewState, IHubViewProps } from "./HubView";
import { Loading } from "./Loading";

import { NewBugBashButton } from "./NewBugBashButton";
import { MessagePanel, MessageType } from "./MessagePanel";

export class AllBugBashesView extends HubView {
    
    public render(): JSX.Element {
        if (this.state.loadingState === LoadingState.Loading) {
            return <Loading />;
        }
        else {
            if (this.state.items.length == 0) {
                <MessagePanel message="No bug bashes found" messageType={MessageType.Info} />
            }
            else {
                <MessagePanel message="yay" messageType={MessageType.Info} />
            }
        }
    }

    protected initialize(): void {
        this.context.actionsCreator.initializeAllBugBashes();
    }

    protected getStateFromStore(): IHubViewState {
        return {
            items: this.context.stores.bugBashItemStore.getAll(),
            loadingState: this.context.stores.bugBashItemStore.isLoaded() ? LoadingState.Loaded : LoadingState.Loading
        };
    }
}