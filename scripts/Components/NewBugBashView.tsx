import * as React from "react";

import { HostNavigationService } from "VSS/SDK/Services/Navigation";

import { UrlActions, IBugBash, LoadingState } from "../Models";
import { HubView, IHubViewState, IHubViewProps } from "./HubView";
import { Loading } from "./Loading";
import { MessagePanel, MessageType } from "./MessagePanel";
import { BugBashEditor, IBugBashEditorProps } from "./BugBashEditor";

interface INewHubViewState extends IHubViewState {

}

export class NewBugBashView extends HubView<INewHubViewState> {    
    public render(): JSX.Element {
        return <BugBashEditor context={this.props.context} />;
    }

    protected initialize() {
        
    }

    protected getStateFromStore(): INewHubViewState {
        return {
            loadingState: LoadingState.Loaded
        };
    }
}