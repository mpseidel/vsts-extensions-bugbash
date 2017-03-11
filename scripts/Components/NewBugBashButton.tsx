import * as React from "react";

import { HostNavigationService } from "VSS/SDK/Services/Navigation";

import { UrlActions } from "../Models";

export interface INewBugBashButtonProps {

}

export class NewBugBashButton extends React.Component<INewBugBashButtonProps, void> {
    constructor(props: INewBugBashButtonProps, context: any) {
        super(props, context);
    }

    public render(): JSX.Element {
        return <div tabIndex={0} className="create-new-button" onClick={this._onNewClick}>New BugBash</div>
    }

    private async _onNewClick() {
        let navigationService: HostNavigationService = await VSS.getService(VSS.ServiceIds.Navigation) as HostNavigationService;

        navigationService.updateHistoryEntry(UrlActions.ACTION_NEW);
    };
}