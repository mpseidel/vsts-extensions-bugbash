import * as React from "react";

import { HostNavigationService } from "VSS/SDK/Services/Navigation";

import { UrlActions, IBaseProps, IBugBash, LoadingState } from "../Models";

export interface IHubViewProps extends IBaseProps {
    id?: string;    
}

export interface IHubViewState {
    loadingState: LoadingState;
}

export abstract class HubView<T extends IHubViewState> extends React.Component<IHubViewProps, T> {
    constructor(props: IHubViewProps, context: any) {
        super(props, context);

        this.state = this.getStateFromStore();
    }

    public componentDidMount() {
        this.props.context.stores.bugBashItemStore.addChangedListener(this._onStoreChanged);
        this.props.context.stores.workItemFieldItemStore.addChangedListener(this._onStoreChanged);
        this.props.context.stores.workItemTemplateStore.addChangedListener(this._onStoreChanged);
        this.initialize();        
    }

    public componentWillUnmount() {
        this.props.context.stores.bugBashItemStore.removeChangedListener(this._onStoreChanged);
        this.props.context.stores.workItemFieldItemStore.removeChangedListener(this._onStoreChanged);
        this.props.context.stores.workItemTemplateStore.removeChangedListener(this._onStoreChanged);
    }

    private _onStoreChanged = (handler: IEventHandler): void => {
        let newState = this.getStateFromStore();
        this.setState(newState);
    }

    protected abstract initialize(): void;

    protected abstract getStateFromStore(): T;
}