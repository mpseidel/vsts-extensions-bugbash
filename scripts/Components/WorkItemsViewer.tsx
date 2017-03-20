import * as React from "react";
import { DetailsList } from "../OfficeFabric/DetailsList";
import { DetailsListLayoutMode, IColumn, CheckboxVisibility, ConstrainMode } from "../OfficeFabric/components/DetailsList/DetailsList.Props";
import { SelectionMode } from "../OfficeFabric/utilities/selection/interfaces";
import { Selection } from "../OfficeFabric/utilities/selection/Selection";
import { autobind } from "../OfficeFabric/Utilities";
import { Label } from "../OfficeFabric/Label";
import { IContextualMenuItem } from "../OfficeFabric/components/ContextualMenu/ContextualMenu.Props";
import { TextField } from "../OfficeFabric/TextField";
import { Button, ButtonType } from "../OfficeFabric/Button";
import { ContextualMenu } from "../OfficeFabric/ContextualMenu";
import { parseUniquefiedIdentityName } from "../Helpers";

import { HostNavigationService } from "VSS/SDK/Services/Navigation";
import { WorkItemTemplateReference, WorkItemTemplate, WorkItemField, WorkItemType, WorkItemQueryResult, Wiql, WorkItem, FieldType } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import * as WitBatchClient from "TFS/WorkItemTracking/BatchRestClient";
import { WorkItemFormNavigationService } from "TFS/WorkItemTracking/Services";
import Utils_Date = require("VSS/Utils/Date");
import Utils_String = require("VSS/Utils/String");
import Utils_Array = require("VSS/Utils/Array");
import {JsonPatchDocument, JsonPatchOperation, Operation} from "VSS/WebApi/Contracts";

import { UrlActions, IBaseProps, IBugBash, LoadingState } from "../Models";
import { Loading } from "./Loading";
import { MessagePanel, MessageType } from "./MessagePanel";

interface IWorkItemsViewerState {
    workItemError?: string;
    isContextMenuVisible?: boolean;
    contextMenuTarget?: MouseEvent;
}

export interface IWorkItemsViewerProps extends IBaseProps {
    areResultsReady: boolean;
    workItems: WorkItem[];
    refreshWorkItems: (workItems: WorkItem[]) => void;
    sortColumn: string;
    sortOrder: string;
    changeSort: (sortColumn: string, sortOrder: string) => void;
}

export class WorkItemsViewer extends React.Component<IWorkItemsViewerProps, IWorkItemsViewerState> {
    private _selection: Selection;

    constructor(props: IWorkItemsViewerProps, context: any) {
        super(props, context);

        this._selection = new Selection();
        this.state = {
            workItemError: null,
            isContextMenuVisible: false,
            contextMenuTarget: null,
        };
    }

    public render(): JSX.Element {
        if (!this.props.areResultsReady) {
            return <Loading />;
        }
        else {
            let workItemsMenuItems: IContextualMenuItem[] = [
                {
                    key: "Delete", name: "Delete", title: "Delete selected workitems", iconProps: {iconName: "Delete"}, 
                    disabled: this._selection.getSelectedCount() == 0,
                    onClick: async (event?: React.MouseEvent<HTMLElement>, menuItem?: IContextualMenuItem) => {
                        this._deleteSelectedWorkItems();
                    }
                },
                {
                    key: "Merge", name: "Merge duplicates", title: "Merge selected workitems as duplicates", iconProps: {iconName: "Merge"}, 
                    disabled: this._selection.getSelectedCount() <= 1,
                    onClick: async (event?: React.MouseEvent<HTMLElement>, menuItem?: IContextualMenuItem) => {
                        //this._mergeSelectedWorkItems();
                    }
                }
            ];

            return (                
                <div className="results-view-contents">
                    { this.state.workItemError && <MessagePanel message={this.state.workItemError} messageType={MessageType.Error} />}
                    { this.props.workItems.length == 0 && (<MessagePanel message="No work item results." messageType={MessageType.Info} />) }
                    { this.props.workItems.length > 0 && (
                        <DetailsList 
                            layoutMode={DetailsListLayoutMode.fixedColumns}
                            constrainMode={ConstrainMode.unconstrained}
                            selectionMode={SelectionMode.multiple}
                            isHeaderVisible={true}
                            checkboxVisibility={CheckboxVisibility.onHover}
                            columns={this._getColumns()}
                            onRenderItemColumn={this._onRenderCell}
                            items={this.props.workItems}
                            className="workitem-list"
                            onItemInvoked={(item: WorkItem, index: number) => {
                                this._openWorkItemDialog(null, item);
                            }}
                            selection={ this._selection }
                            onItemContextMenu={this._showContextMenu}
                            onColumnHeaderClick={this._onColumnHeaderClick}
                        />                                    
                    ) }
                    { this.state.isContextMenuVisible && (
                        <ContextualMenu
                            className="context-menu"
                            items={workItemsMenuItems}
                            target={this.state.contextMenuTarget}
                            shouldFocusOnMount={ true }
                            onDismiss={this._hideContextMenu}
                        />
                    )}
                </div>                
            );
        }
    }

    private _getColumns(): IColumn[] {
        return [
            {
                fieldName: "ID",
                key: "ID",
                name:"ID",
                minWidth: 70,
                maxWidth: 70,
                isResizable: false,
                isSorted: Utils_String.equals(this.props.sortColumn, "ID", true),
                isSortedDescending: Utils_String.equals(this.props.sortOrder, "desc", true)
            },
            {
                fieldName: "System.Title",
                key: "Title",
                name:"Title",
                minWidth: 250,
                maxWidth: 250,
                isResizable: false,
                isSorted: Utils_String.equals(this.props.sortColumn, "System.Title", true),
                isSortedDescending: Utils_String.equals(this.props.sortOrder, "desc", true)
            },
            {
                fieldName: "System.CreatedBy",
                key: "CreatedBy",
                name:"Created By",
                minWidth: 150,
                maxWidth: 150,
                isResizable: false,
                isSorted: Utils_String.equals(this.props.sortColumn, "System.CreatedBy", true),
                isSortedDescending: Utils_String.equals(this.props.sortOrder, "desc", true)
            },
            {
                fieldName: "System.CreatedDate",
                key: "CreatedDate",
                name:"Created Date",
                minWidth: 200,
                isResizable: false,
                isSorted: Utils_String.equals(this.props.sortColumn, "System.CreatedDate", true),
                isSortedDescending: Utils_String.equals(this.props.sortOrder, "desc", true)
            },
            {
                fieldName: "System.State",
                key: "State",
                name:"State",
                minWidth: 100,
                maxWidth: 100,
                isResizable: false,
                isSorted: Utils_String.equals(this.props.sortColumn, "System.State", true),
                isSortedDescending: Utils_String.equals(this.props.sortOrder, "desc", true)
            },
            {
                fieldName: "System.AssignedTo",
                key: "AssignedTo",
                name:"Assigned To",
                minWidth: 150,
                maxWidth: 150,
                isResizable: false,
                isSorted: Utils_String.equals(this.props.sortColumn, "System.AssignedTo", true),
                isSortedDescending: Utils_String.equals(this.props.sortOrder, "desc", true)
            },
            {
                fieldName: "System.AreaPath",
                key: "AreaPath",
                name:"Area Path",
                minWidth: 250,
                maxWidth: 250,
                isResizable: false,
                isSorted: Utils_String.equals(this.props.sortColumn, "System.AreaPath", true),
                isSortedDescending: Utils_String.equals(this.props.sortOrder, "desc", true)
            }
        ];
    }    

    @autobind
    private _onColumnHeaderClick(ev?: React.MouseEvent<HTMLElement>, column?: IColumn) {
        this.props.changeSort(column.fieldName, column.isSortedDescending ? "asc" : "desc");
    }

    @autobind
    private _onRenderCell(item: WorkItem, index?: number, column?: IColumn): React.ReactNode {
        let text: string;
        switch (column.fieldName) {
            case "ID":
                text = `${item.id}`;
                break;
            case "System.Title":
                return <span className="title-cell overflow-ellipsis" onClick={(e) => this._openWorkItemDialog(e, item)} title={item.fields[column.fieldName]}>{item.fields[column.fieldName]}</span>
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
    private _showContextMenu(item?: WorkItem, index?: number, e?: MouseEvent) {
        if (!this._selection.isIndexSelected(index)) {
            // if not already selected, unselect every other row and select this one
            this._selection.setAllSelected(false);
            this._selection.setIndexSelected(index, true, true);
        }        
        this.setState({...this.state, contextMenuTarget: e, isContextMenuVisible: true});
    }

    @autobind
    private _hideContextMenu(e?: any) {
        this.setState({...this.state, contextMenuTarget: null, isContextMenuVisible: false});
    }

    @autobind
    private async _openWorkItemDialog(e: React.MouseEvent<HTMLElement>, item: WorkItem) {
        let newTab = e ? e.ctrlKey : false;
        let workItemNavSvc = await WorkItemFormNavigationService.getService();
        workItemNavSvc.openWorkItem(item.id, newTab);
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
                    let workItemResults = this.props.workItems.filter((item: WorkItem) => {
                        return Utils_Array.findIndex(selectedWorkItems, (wi: WorkItem) => Utils_String.equals(""+wi.id, ""+item.id)) === -1;
                    });

                    this._selection.setAllSelected(false);
                    this.setState({...this.state, workItemError: null});
                    this.props.refreshWorkItems(workItemResults);
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
}