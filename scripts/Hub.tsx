// react imports
import * as React from "react";
import * as ReactDOM from "react-dom";

// vsts imports
import { HostNavigationService } from "VSS/SDK/Services/Navigation";
import { StatusIndicator } from "VSS/Controls/StatusIndicator";
import { BaseControl } from "VSS/Controls";
import {MessageAreaControl, MessageAreaType} from "VSS/Controls/Notifications";

// components
import { NewBugBashButton } from "./Components/NewBugBashButton";
import { Loading } from "./Components/Loading";
import { AllBugBashesView } from "./Components/AllBugBashesView";
import { NewBugBashView } from "./Components/NewBugBashView";
import { EditBugBashView } from "./Components/EditBugBashView";
import { ViewBugBashView } from "./Components/ViewBugBashView";

import { UrlActions, IHubContext, HubViewMode } from "./Models";
import { ActionsCreator, ActionsHub } from "./Actions/ActionsCreator";
import { StoresHub } from "./Stores/StoresHub";

export interface IHubProps {

}

export interface IHubState {
    hubViewMode: HubViewMode;
    id?: string;
}

export class Hub extends React.Component<IHubProps, IHubState> {
    private _statusIndicator: StatusIndicator;
    private _context: IHubContext;

    constructor(props: IHubProps, context?: any) {
        super(props, context);

        const actionsHub = new ActionsHub();
        const storeHub = new StoresHub(actionsHub);
        const actionsCreator = new ActionsCreator(actionsHub, storeHub.bugBashItemStore);

        this._context = {
            actions: actionsHub,
            stores: storeHub,
            actionsCreator: actionsCreator
        };

        this._initialize();
    }

    public getChildContext(): IHubContext {
        return this._context;
    }

    public render(): JSX.Element {
        switch (this.state.hubViewMode) {            
            case HubViewMode.All:
                return <AllBugBashesView />;
            case HubViewMode.New:
                return <NewBugBashView />;
            case HubViewMode.Edit:
                return <EditBugBashView id={this.state.id} />;
            case HubViewMode.View:
                return <ViewBugBashView id={this.state.id} />;
            default:
                return <Loading />;
        }
    }

    private async _initialize() {
        this.setState({ hubViewMode: HubViewMode.Loading });

        this._attachNavigate();

        const navigationService: HostNavigationService = await VSS.getService(VSS.ServiceIds.Navigation) as HostNavigationService;
        const state = await navigationService.getCurrentState();
        if (!state.action) {
            navigationService.updateHistoryEntry(UrlActions.ACTION_ALL, null, true);
        }        
    }

    private async _attachNavigate() {        
        const navigationService: HostNavigationService = await VSS.getService(VSS.ServiceIds.Navigation) as HostNavigationService;

        navigationService.attachNavigate(UrlActions.ACTION_ALL, () => {
            this.setState({ hubViewMode: HubViewMode.All });
        }, true);

        navigationService.attachNavigate(UrlActions.ACTION_NEW, () => {
            this.setState({ hubViewMode: HubViewMode.New });
        }, true);

        navigationService.attachNavigate(UrlActions.ACTION_EDIT, async () => {
            const state = await navigationService.getCurrentState();
            if (state.id) {
                this.setState({ hubViewMode: HubViewMode.Edit, id: state.id });
            }
        }, true);

        navigationService.attachNavigate(UrlActions.ACTION_VIEW, async () => {
            const state = await navigationService.getCurrentState();
            if (state.id) {
                this.setState({ hubViewMode: HubViewMode.View, id: state.id });
            }
        }, true);
    }  
}

export function init() {
    ReactDOM.render(<Hub />, $("#ext-container")[0]);
}