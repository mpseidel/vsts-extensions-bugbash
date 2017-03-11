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

import { UrlActions, IHubContext } from "./Models";
import { ActionsCreator, ActionsHub } from "./Actions/ActionsCreator";
import { StoresHub } from "./Stores/StoresHub";

export class Hub {
    private _statusIndicator: StatusIndicator;
    private _context: IHubContext;

    public async initialize() {
        const actionsHub = new ActionsHub();
        const storeHub = new StoresHub(actionsHub);
        const actionsCreator = new ActionsCreator(actionsHub, storeHub.bugBashItemStore);

        this._context = {
            actions: actionsHub,
            stores: storeHub,
            actionsCreator: actionsCreator
        };

        const navigationService: HostNavigationService = await VSS.getService(VSS.ServiceIds.Navigation) as HostNavigationService;
        const state = await navigationService.getCurrentState();
        if (!state.action) {
            navigationService.updateHistoryEntry(UrlActions.ACTION_ALL, null, true);
        }

        this._attachNavigate();
    }    

    public getChildContext(): IHubContext {
        return this._context;
    }

    private _showLoading(): void {
        if (!this._statusIndicator) {
            this._statusIndicator = BaseControl.createIn(StatusIndicator, $("#content-container"), {
                center: true, 
                throttleMinTime: 0, 
                imageClass: "big-status-progress", 
                message: "Loading..." 
            }) as StatusIndicator;
        }
        this._statusIndicator.start();
    }

    private _hideLoading(): void {
        if (this._statusIndicator) {
            this._statusIndicator.complete();
        }
        this._statusIndicator.dispose();
        this._statusIndicator = null;
    }

    private async _onShowAllBugBashes() {
        ReactDOM.unmountComponentAtNode($("#menu-container")[0]);
        ReactDOM.unmountComponentAtNode($("#content-container")[0]);

        ReactDOM.render(<NewBugBashButton />, $("#menu-container")[0]);

        this._context.actionsCreator.initializeAllBugBashes();
    }

    private _onNewBugBash() {
        ReactDOM.unmountComponentAtNode($("#menu-container")[0]);
        ReactDOM.unmountComponentAtNode($("#content-container")[0]);
    }

    private _onEditBugBash() {
        ReactDOM.unmountComponentAtNode($("#menu-container")[0]);
        ReactDOM.unmountComponentAtNode($("#content-container")[0]);
    }

    private _onViewBugBash() {
        ReactDOM.unmountComponentAtNode($("#menu-container")[0]);
        ReactDOM.unmountComponentAtNode($("#content-container")[0]);
    }

    private async _attachNavigate() {        
        const navigationService: HostNavigationService = await VSS.getService(VSS.ServiceIds.Navigation) as HostNavigationService;

        navigationService.attachNavigate(UrlActions.ACTION_ALL, () => {
            this._onShowAllBugBashes();
        }, true);

        navigationService.attachNavigate(UrlActions.ACTION_NEW, () => {
            this._onNewBugBash();
        }, true);

        navigationService.attachNavigate(UrlActions.ACTION_EDIT, async () => {
            const state = await navigationService.getCurrentState();
            if (state.id) {
                this._onEditBugBash();
            }
        }, true);

        navigationService.attachNavigate(UrlActions.ACTION_VIEW, async () => {
            const state = await navigationService.getCurrentState();
            if (state.id) {
                this._onViewBugBash();
            }
        }, true);
    }
}