import * as React from "react";

import { HostNavigationService } from "VSS/SDK/Services/Navigation";

import { UrlActions, IBugBash, LoadingState } from "../Models";
import { HubView, IHubViewState, IHubViewProps } from "./HubView";
import { Loading } from "./Loading";
import { MessagePanel, MessageType } from "./MessagePanel";
import { BugBashEditor, IBugBashEditorProps } from "./BugBashEditor";

export class EditBugBashView extends HubView {    
    public render(): JSX.Element {
        if (this.state.loadingState === LoadingState.Loading) {
            return <Loading />;
        }
        else {
            if (!this.state.items) {
                return <MessagePanel message="This instance of bug bash doesnt exist." messageType={MessageType.Error} />
            }
            else {
                return <BugBashEditor id={this.state.items[0].id} context={this.props.context} />;
            }            
        }
    }

    protected async initialize() {
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
        return {
            items: item ? [item] : null,
            loadingState: this.props.context.stores.bugBashItemStore.isLoaded() ? LoadingState.Loaded : LoadingState.Loading
        };
    }
}