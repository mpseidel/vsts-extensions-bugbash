import * as React from "react";

import { HostNavigationService } from "VSS/SDK/Services/Navigation";
import { WorkItemTemplateReference, WorkItemField, WorkItem } from "TFS/WorkItemTracking/Contracts";

import { UrlActions, IBaseProps, IBugBash, LoadingState } from "../Models";

export interface IHubViewProps extends IBaseProps {
    id?: string;    
}

export interface IHubViewState {
    items: IBugBash[];
    loadingState: LoadingState;
    templates?: WorkItemTemplateReference[];
    fields?: WorkItemField[];
    workItemResults?: WorkItem[];
}

export abstract class HubView extends React.Component<IHubViewProps, IHubViewState> {
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

    protected abstract getStateFromStore(): IHubViewState;
}