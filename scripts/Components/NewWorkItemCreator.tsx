import * as React from "react";
import { autobind } from "../OfficeFabric/Utilities";
import { Label } from "../OfficeFabric/Label";
import { TextField } from "../OfficeFabric/TextField";
import { Button, ButtonType } from "../OfficeFabric/Button";

import { WorkItemTemplate, WorkItem, FieldType } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import {JsonPatchDocument, JsonPatchOperation, Operation} from "VSS/WebApi/Contracts";

import { IBaseProps, IBugBash } from "../Models";
import { MessagePanel, MessageType } from "./MessagePanel";

export interface INewWorkItemCreatorProps extends IBaseProps {
    item: IBugBash;
    addWorkItem: (workItem: WorkItem) => void;
}

export interface INewWorkItemCreatorState {
    template: WorkItemTemplate;
    newWorkItemFieldValues: {};
    workItemError?: string
}

export class NewWorkItemCreator extends React.Component<INewWorkItemCreatorProps, INewWorkItemCreatorState> {
    constructor(props: INewWorkItemCreatorProps, context: any) {
        super(props, context);
        
        this.state ={
            newWorkItemFieldValues: {},
            template: null,
            workItemError: ""
        };
    }

    public render(): JSX.Element {
        return (
            <div className="add-workitem-contents">
                { this.state.workItemError && <MessagePanel message={this.state.workItemError} messageType={MessageType.Error} />}
                <Label className="add-workitem-label">Add work item</Label>
                {this._getManualFieldsNode()}
                <Button className="create-new-button" disabled={!this._canSaveWorkItem()} buttonType={ButtonType.primary} onClick={this._onSaveClick}>Save</Button>
            </div>
        );
    }

    @autobind
    private async _onSaveClick() {
        let newWorkItemFieldValues = this.state.newWorkItemFieldValues || {};

        if (!this._canSaveWorkItem()) {
            return;
        }        

        // load template
        let template: WorkItemTemplate = null;

        if (this.props.item.templateId) {            
            if (!this.state.template) {
                template = await WitClient.getClient().getTemplate(VSS.getWebContext().project.id, VSS.getWebContext().team.id, this.props.item.templateId);            
            }
            else {
                template = this.state.template;
            }

            newWorkItemFieldValues = { ...template.fields, ...newWorkItemFieldValues };
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
            value: this.props.item.workItemTag
        } as JsonPatchOperation);

        try {
            let workItem = await WitClient.getClient().createWorkItem(patchDocument, VSS.getWebContext().project.id, this.props.item.workItemType);            
            this.setState({...this.state, workItemError: null, template: template, newWorkItemFieldValues: {}});
            this.props.addWorkItem(workItem);
        }
        catch (e) {
            this.setState({...this.state, workItemError: e.message, template: template});
        }
    }

     @autobind
    private _canSaveWorkItem(): boolean {
        let newWorkItemFieldValues = this.state.newWorkItemFieldValues || {};
        for (let manualField of this.props.item.manualFields) {
            if (!newWorkItemFieldValues[manualField] || newWorkItemFieldValues[manualField].trim() !== "") {
                return false;
            }
        }
        return true;
    }

    private _getManualFieldsNode(): React.ReactNode {
        let newWorkItemFieldValues = this.state.newWorkItemFieldValues || {};

        return this.props.item.manualFields.map((fieldRefName: string) => {
            const field = this.props.context.stores.workItemFieldStore.getItem(fieldRefName);
            if (field) {
                return (
                    <div className="manual-field-row" key={fieldRefName}>
                        { field.type !== FieldType.PlainText && field.type !== FieldType.Html && (
                        <TextField label={field.name} 
                            value={newWorkItemFieldValues[fieldRefName] || ""}
                            required={true} 
                            onChanged={(newValue: string) => this._setWorkItemFieldValue(fieldRefName, newValue)} />
                        )}
                        { field.type === FieldType.PlainText || field.type === FieldType.Html && (
                        <div>
                            <Label required={true}>{field.name}</Label>
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

        $(container).summernote('code', this.state.newWorkItemFieldValues[fieldRefName] || "");
    }

    @autobind
    private _setWorkItemFieldValue(fieldRefName: string, value: string) {
        let newWorkItemFieldValues = {...this.state.newWorkItemFieldValues};
        newWorkItemFieldValues[fieldRefName] = value;
        this.setState({...this.state, newWorkItemFieldValues: newWorkItemFieldValues});
    }    
}