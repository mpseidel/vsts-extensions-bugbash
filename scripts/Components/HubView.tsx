import * as React from "react";
import * as ReactDOM from "react-dom";

import { HostNavigationService } from "VSS/SDK/Services/Navigation";

import { UrlActions, IHubContext, IBugBash, LoadingState } from "../Models";

export interface IHubViewProps {
    id?: string;
}

export interface IHubViewState {
    items: IBugBash[];
    loadingState: LoadingState;
}

export abstract class HubView extends React.Component<IHubViewProps, IHubViewState> {
    constructor(props: IHubViewProps, context: IHubContext) {
        super(props, context);

        this.state = this.getStateFromStore();
    }

    public componentDidMount() {
        this.context.stores.bugBashItemStore.addChangedListener(this._onStoreChanged);
        this.initialize();        
    }

    public componentWillUnmount() {
        this.context.stores.bugBashItemStore.removeChangedListener(this._onStoreChanged);
    }

    private _onStoreChanged = (handler: IEventHandler): void => {
        let newState = this.getStateFromStore();
        this.setState(newState);
    }

    protected abstract initialize(): void;

    protected abstract getStateFromStore(): IHubViewState;
}