import * as React from "react";
import * as ReactDOM from "react-dom";

import { HostNavigationService } from "VSS/SDK/Services/Navigation";

import { UrlActions, IHubContext, IBugBash, LoadingState } from "../Models";
import { HubView, IHubViewState, IHubViewProps } from "./HubView";
import { Loading } from "./Loading";

export class EditBugBashView extends HubView {
    
    public render(): JSX.Element {
        if (this.state.loadingState === LoadingState.Loading) {
            return <Loading />;
        }
        else {
            return <div>Edit</div>;
        }
    }

    protected initialize(): void {

    }

    protected getStateFromStore(): IHubViewState {
        return null;
    }
}