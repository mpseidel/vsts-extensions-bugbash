import * as React from "react";
import { Button, ButtonType } from "../OfficeFabric/Button";

import { HostNavigationService } from "VSS/SDK/Services/Navigation";

import { UrlActions } from "../Models";

export interface INewBugBashButtonProps {

}

export class NewBugBashButton extends React.Component<INewBugBashButtonProps, void> {
    constructor(props: INewBugBashButtonProps, context: any) {
        super(props, context);
    }

    public render(): JSX.Element {
        return <Button className="create-new-button" buttonType={ButtonType.primary} onClick={this._onNewClick}>New instance</Button>
    }

    private async _onNewClick() {
        let navigationService: HostNavigationService = await VSS.getService(VSS.ServiceIds.Navigation) as HostNavigationService;

        navigationService.updateHistoryEntry(UrlActions.ACTION_NEW);
    };
}