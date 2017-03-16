import * as React from "react";
import { DetailsList } from "../OfficeFabric/DetailsList";
import { DetailsListLayoutMode, IColumn, CheckboxVisibility, ConstrainMode } from "../OfficeFabric/components/DetailsList/DetailsList.Props";
import { SelectionMode } from "../OfficeFabric/utilities/selection/interfaces";
import { Selection } from "../OfficeFabric/utilities/selection/Selection";
import { autobind } from "../OfficeFabric/Utilities";
import { CommandBar } from "../OfficeFabric/CommandBar";
import { Label } from "../OfficeFabric/Label";
import { IContextualMenuItem } from "../OfficeFabric/components/ContextualMenu/ContextualMenu.Props";
import { TextField } from "../OfficeFabric/TextField";
import { Button, ButtonType } from "../OfficeFabric/Button";
import { parseUniquefiedIdentityName } from "../Helpers";

import { HostNavigationService } from "VSS/SDK/Services/Navigation";
import { WorkItemTemplateReference, WorkItemTemplate, WorkItemField, WorkItemQueryResult, Wiql, WorkItem, FieldType } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import * as WitBatchClient from "TFS/WorkItemTracking/BatchRestClient";
import { WorkItemFormNavigationService } from "TFS/WorkItemTracking/Services";
import Utils_Date = require("VSS/Utils/Date");
import Utils_String = require("VSS/Utils/String");
import Utils_Array = require("VSS/Utils/Array");
import {JsonPatchDocument, JsonPatchOperation, Operation} from "VSS/WebApi/Contracts";

import { UrlActions, IBugBash, LoadingState } from "../Models";
import { HubView, IHubViewState, IHubViewProps } from "./HubView";
import { Loading } from "./Loading";
import { MessagePanel, MessageType } from "./MessagePanel";
import { BugBashEditor, IBugBashEditorProps } from "./BugBashEditor";

interface IViewHubViewState extends IHubViewState {
    item: IBugBash;
    template: WorkItemTemplate;
    workItemResults?: WorkItem[];
    resultsLoaded: boolean;
    resultsLoading: boolean;
    workItemError?: string;
    selectedWorkItems?: WorkItem[];
    newWorkItemFieldValues: IDictionaryStringTo<string>;
}

export class ViewBugBashView extends HubView<IViewHubViewState> {
    private _selection: Selection;

    constructor(props: IHubViewProps, context: any) {
        super(props, context);

        this._selection = new Selection({
            onSelectionChanged: () => this.setState({ ...this.state, selectedWorkItems: this._selection.getSelection() as WorkItem[] })
        });
    }

    public render(): JSX.Element {
        if (this.state.loadingState === LoadingState.Loading) {
            return <Loading />;
        }
        else {
            const item = this.state.item;
            let menuitems: IContextualMenuItem[] = [
                {
                    key: "edit", name: "Edit", title: "Edit", iconProps: {iconName: "Edit"},
                    onClick: async (event?: React.MouseEvent<HTMLElement>, menuItem?: IContextualMenuItem) => {
                        let navigationService: HostNavigationService = await VSS.getService(VSS.ServiceIds.Navigation) as HostNavigationService;
                        navigationService.updateHistoryEntry(UrlActions.ACTION_EDIT, {id: this.props.id});
                    }
                },            
                {
                    key: "refresh", name: "Refresh", title: "Refresh list", iconProps: {iconName: "Refresh"},
                    disabled: !this.state.item || (this.state.item.templateId && !this.state.template),
                    onClick: async (event?: React.MouseEvent<HTMLElement>, menuItem?: IContextualMenuItem) => {
                        this._refreshWorkItemResults();
                    }
                }                    
            ];

            let workItemsMenuItems: IContextualMenuItem[] = [
                {
                    key: "Delete", name: "Delete", title: "Delete selected bugs", iconProps: {iconName: "Delete"}, 
                    disabled: !this.state.selectedWorkItems || this.state.selectedWorkItems.length === 0,
                    onClick: async (event?: React.MouseEvent<HTMLElement>, menuItem?: IContextualMenuItem) => {
                        this._deleteSelectedWorkItems();
                    }
                },
                {
                    key: "Merge", name: "Merge duplicates", title: "Merge selected bugs as duplicates", iconProps: {iconName: "Merge"}, 
                    disabled: !this.state.selectedWorkItems || this.state.selectedWorkItems.length <= 1,
                    onClick: async (event?: React.MouseEvent<HTMLElement>, menuItem?: IContextualMenuItem) => {
                        //this._mergeSelectedWorkItems();
                    }
                }
            ];

            return (
                <div className="results-view">
                    <div className="results-view-menu">
                        <CommandBar items={menuitems} farItems={workItemsMenuItems} />
                    </div>
                    
                    {!this.state.item && <MessagePanel message="This instance of bug bash doesnt exist." messageType={MessageType.Error} />}
                    {this.state.item && this.state.item.templateId && !this.state.template && <MessagePanel message="The template specified in this instance of bug bash doesnt exist." messageType={MessageType.Error} />}
                    {this.state.item && (!this.state.item.templateId || this.state.template) && (
                        <div className="contents">
                            <div className="results-view-contents">
                                { this.state.workItemResults.length == 0 && (<MessagePanel message="No bugs has been created yet in this bug bash." messageType={MessageType.Info} />) }
                                { this.state.workItemResults.length > 0 && (
                                    <DetailsList 
                                        layoutMode={DetailsListLayoutMode.fixedColumns}
                                        constrainMode={ConstrainMode.horizontalConstrained}
                                        selectionMode={SelectionMode.multiple}
                                        isHeaderVisible={true}
                                        checkboxVisibility={CheckboxVisibility.onHover}
                                        columns={this._getColumns()}
                                        onRenderItemColumn={this._onRenderCell}
                                        items={this.state.workItemResults} 
                                        className="workitem-list"
                                        onItemInvoked={(item: WorkItem, index: number) => {
                                            this._openWorkItemDialog(null, item);
                                        }}
                                        selection={ this._selection }
                                    />
                                ) }
                            </div>
                            <div className="add-workitem-contents">
                                <Label className="add-workitem-label">Add bug</Label>
                                {this._getManualFieldsNode()}
                                <Button className="create-new-button" disabled={!this._canSaveWorkItem()} buttonType={ButtonType.primary} onClick={this._onSaveClick}>Save</Button>
                            </div>
                        </div>
                    )}                        
                </div>
            );
        }
    }

    protected async initialize() {  
        await this.props.context.actionsCreator.initializeWorkItemFields();
        let bugBashFound = await this.props.context.actionsCreator.ensureBugBash(this.props.id);
        
        if (!bugBashFound) {
            this.setState({
                item: null,
                resultsLoaded: false,
                resultsLoading: false,
                workItemResults: [],
                loadingState: LoadingState.Loaded,
                template: null
            });

            return;
        }

        let bugBashItem = this.props.context.stores.bugBashItemStore.getItem(this.props.id);
        let template: WorkItemTemplate;

        if (bugBashItem.templateId) {
            let templateFound = await this.props.context.actionsCreator.ensureWorkItemTemplate(bugBashItem.templateId);
            if (!templateFound) {
                this.setState({
                    item: bugBashItem,
                    resultsLoaded: false,
                    resultsLoading: false,
                    workItemResults: [],
                    loadingState: LoadingState.Loaded,
                    template: null
                });

                return;
            }

            let templateRef = this.props.context.stores.workItemTemplateStore.getItem(bugBashItem.templateId);
            template = await WitClient.getClient().getTemplate(VSS.getWebContext().project.id, VSS.getWebContext().team.id, templateRef.id);
        }        

        this.setState({
            item: bugBashItem,
            resultsLoaded: false,
            resultsLoading: false,
            workItemResults: [],
            loadingState: LoadingState.Loading,
            template: template
        }, () => {
            this._refreshWorkItemResults();
        });                
    }

    protected getStateFromStore(): IViewHubViewState {
        return this.state || {
            item: null,
            resultsLoaded: false,
            resultsLoading: false,
            workItemResults: [],
            loadingState: LoadingState.Loading,
            template: null,
            newWorkItemFieldValues: {}
        };
    }

    private _getColumns(): IColumn[] {
        return [
            {
                fieldName: "ID",
                key: "ID",
                name:"ID",
                minWidth: 70,
                maxWidth: 70,
                isResizable: false
            },
            {
                fieldName: "System.Title",
                key: "Title",
                name:"Title",
                minWidth: 250,
                maxWidth: 250,
                isResizable: false
            },
            {
                fieldName: "System.CreatedBy",
                key: "CreatedBy",
                name:"Created By",
                minWidth: 150,
                maxWidth: 150,
                isResizable: false
            },
            {
                fieldName: "System.CreatedDate",
                key: "CreatedDate",
                name:"Created Date",
                minWidth: 200,
                isResizable: false
            },
            {
                fieldName: "System.State",
                key: "State",
                name:"State",
                minWidth: 100,
                maxWidth: 100,
                isResizable: false
            },
            {
                fieldName: "System.AssignedTo",
                key: "AssignedTo",
                name:"Assigned To",
                minWidth: 150,
                maxWidth: 150,
                isResizable: false
            },
            {
                fieldName: "System.AreaPath",
                key: "AreaPath",
                name:"Area Path",
                minWidth: 250,
                maxWidth: 250,
                isResizable: false
            }
        ];
    }

    @autobind
    private _onRenderCell(item: WorkItem, index?: number, column?: IColumn): React.ReactNode {
        let text: string;
        switch (column.fieldName) {
            case "ID":
                text = `${item.id}`;
                break;
            case "System.Title":
                text = item.fields[column.fieldName];
                break;
            case "System.CreatedDate":
                text = Utils_Date.friendly(new Date(item.fields["System.CreatedDate"]));
                break;
            case "System.CreatedBy":
            case "System.AssignedTo":
                let identityRef = parseUniquefiedIdentityName(item.fields[column.fieldName]);
                if (!identityRef.displayName) {
                    text = "";
                    break;
                }
                else {
                    return (
                        <div className="identity-cell overflow-ellipsis" title={item.fields[column.fieldName]}>
                            {identityRef.imageUrl !== "" && (<img src={identityRef.imageUrl} />)}
                            <span>{identityRef.displayName}</span>
                        </div>
                    );
                }
            default:
                text = item.fields[column.fieldName];  
                break;          
        }

        return <div className="overflow-ellipsis" title={text}>{text}</div>;
    }

    @autobind
    private async _openWorkItemDialog(e: React.MouseEvent<HTMLElement>, item: WorkItem) {
        let workItemNavSvc = await WorkItemFormNavigationService.getService();
        workItemNavSvc.openWorkItem(item.id);

        if (e) {
            e.stopPropagation();
        }
    }

    @autobind
    private async _onSaveClick() {
        const item: IBugBash = this.state.item;
        let newWorkItemFieldValues = this.state.newWorkItemFieldValues || {};

        if (!this._canSaveWorkItem()) {
            return;
        }

        // load template
        if (this.state.template) {
            newWorkItemFieldValues = { ...this.state.template.fields, ...newWorkItemFieldValues };
        }

        // save work item
        let patchDocument: JsonPatchDocument & JsonPatchOperation[] = [];
        for (let fieldRefName in newWorkItemFieldValues) {
            patchDocument.push({
                op: Operation.Add,
                path: `/fields/${fieldRefName}`,
                value: newWorkItemFieldValues[fieldRefName]
            } as JsonPatchOperation);
        }
        patchDocument.push({
            op: Operation.Add,
            path: `/fields/System.Tags`,
            value: item.workItemTag
        } as JsonPatchOperation);

        try {
            let workItem = await WitClient.getClient().createWorkItem(patchDocument, VSS.getWebContext().project.id, "Bug");
            let workItemResults = this.state.workItemResults.concat(workItem);

            this.setState({...this.state, workItemResults: workItemResults, workItemError: null, newWorkItemFieldValues: {}});
        }
        catch (e) {
            this.setState({...this.state, workItemError: e.message});
        }
    }

    @autobind
    private async _deleteSelectedWorkItems() {        
        let selectedWorkItems = this._selection.getSelection() as WorkItem[];
        if (selectedWorkItems.length > 0) {
            let dialogService: IHostDialogService = await VSS.getService(VSS.ServiceIds.Dialog) as IHostDialogService;
            try {
                await dialogService.openMessageDialog("Are you sure you want to delete the selected work items?", { useBowtieStyle: true });  
                try {
                    await WitBatchClient.getClient().deleteWorkItemsBatch(selectedWorkItems.map((item: WorkItem) => item.id));
                    let workItemResults = this.state.workItemResults.filter((item: WorkItem) => {
                        return Utils_Array.findIndex(selectedWorkItems, (wi: WorkItem) => Utils_String.equals(""+wi.id, ""+item.id)) === -1;
                    });

                    this.setState({...this.state, workItemResults: workItemResults, workItemError: null});
                }
                catch (e) {
                    this.setState({...this.state, workItemError: e.message});
                }          
            }
            catch (e) {
                // user selected "No"" in dialog
                return;
            }    
        }        
    }

    @autobind
    private _canSaveWorkItem(): boolean {
        const item: IBugBash = this.state.item;
        let newWorkItemFieldValues = this.state.newWorkItemFieldValues || {};
        for (let manualField of item.manualFields) {
            if (!newWorkItemFieldValues[manualField]) {
                return false;
            }
        }
        return true;
    }

    private _getManualFieldsNode(): React.ReactNode {
        const item: IBugBash = this.state.item;
        let newWorkItemFieldValues = this.state.newWorkItemFieldValues || {};

        return item.manualFields.map((fieldRefName: string) => {
            const field = this.props.context.stores.workItemFieldItemStore.getItem(fieldRefName);
            if (field) {
                return (
                    <div className="manual-field-row" key={fieldRefName}>
                        { field.type !== FieldType.PlainText && field.type !== FieldType.Html && (
                        <TextField label={field.name} 
                            value={newWorkItemFieldValues[fieldRefName]}
                            required={true} 
                            onChanged={(newValue: string) => this._setWorkItemFieldValue(fieldRefName, newValue)} />
                        )}
                        { field.type === FieldType.PlainText || field.type === FieldType.Html && (
                        <div>
                            <Label>{field.name}</Label>
                            <div>
                                <div ref={(container: HTMLElement) => this._renderRichEditor(container, fieldRefName)}/>
                            </div>
                        </div>
                        )}
                    </div>
                );
            }
            else {
                return <MessagePanel message={`The field ${fieldRefName} doesn't exist anymore in your account.`} messageType={MessageType.Warning} />                
            }        
        });
    }

    @autobind
    private _renderRichEditor(container: HTMLElement, fieldRefName: string) {
        $(container).summernote({
            height: 200,
            minHeight: 200,
            toolbar: [
                // [groupName, [list of button]]
                ['style', ['bold', 'italic', 'underline', 'clear']],
                ['fontsize', ['fontsize']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['insert', ['link', 'picture']],
                ['fullscreen', ['fullscreen']]
            ],
            callbacks: {
                onBlur: () => {
                    this._setWorkItemFieldValue(fieldRefName, $(container).summernote('code'));
                }
            }
        });

        $(container).summernote('code', this.state.newWorkItemFieldValues[fieldRefName]);
    }

    @autobind
    private _setWorkItemFieldValue(fieldRefName: string, value: string) {
        let newWorkItemFieldValue = {...this.state.newWorkItemFieldValues};
        newWorkItemFieldValue[fieldRefName] = value;
        this.setState({...this.state, newWorkItemFieldValue: newWorkItemFieldValue});
    }

    private async _refreshWorkItemResults() {
        this.setState({...this.state, resultsLoading: true, loadingState: LoadingState.Loading});

        let queryResult = await WitClient.getClient().queryByWiql(this._getWiql(this.state.item.workItemTag), VSS.getWebContext().project.id);
        let workItemIds = queryResult.workItems.map(workItem => workItem.id);
        let workItems: WorkItem[];

        if (workItemIds.length > 0) {
            workItems = await WitClient.getClient().getWorkItems(workItemIds);
        }
        else {
            workItems = [];
        }
    
        this.setState({...this.state, resultsLoading: false, resultsLoaded: true, workItemResults: workItems, loadingState: LoadingState.Loaded});
    }

    private _getWiql(workItemTag: string): Wiql {
        return {
            query: `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.WorkItemType] = 'Bug' AND [System.Tags] CONTAINS '${workItemTag}' ORDER BY [System.CreatedDate] DESC`
        };
    }
}