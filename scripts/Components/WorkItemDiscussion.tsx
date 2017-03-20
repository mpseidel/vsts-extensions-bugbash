import * as React from "react";
import { autobind } from "../OfficeFabric/Utilities";
import { TextField } from "../OfficeFabric/TextField";
import { IconButton } from "../OfficeFabric/Button";

import { WorkItem, CommentSortOrder, WorkItemComment } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import {JsonPatchDocument, JsonPatchOperation, Operation} from "VSS/WebApi/Contracts";
import Utils_Date = require("VSS/Utils/Date");

import { LoadingState, IBaseProps } from "../Models";
import { Loading } from "./Loading";
import { MessagePanel, MessageType } from "./MessagePanel";
import { IdentityView } from "./IdentityView";

export interface IWorkItemDiscussionProps extends IBaseProps {
    workItem: WorkItem;
    onClose: () => void;
}

export interface IWorkItemDiscussionState {
    loadingState: LoadingState;
    comments: WorkItemComment[];
    newComment: string;
    error?: string;
}

export class WorkItemDiscussion extends React.Component<IWorkItemDiscussionProps, IWorkItemDiscussionState> {
    constructor(props: IWorkItemDiscussionProps, context: any) {
        super(props, context);
        
        this.state ={
            loadingState: LoadingState.Loading,
            comments: [],
            newComment: ""
        };

        this._initialize(props.workItem.id);
    }

    public render(): JSX.Element {
        if (this.state.loadingState === LoadingState.Loading) {
            return <Loading />;
        }
        else {
            return (
                <div className="workitem-discussion-container">
                    { this.state.error && (<MessagePanel message={this.state.error} messageType={MessageType.Error} /> )}
                    <IconButton icon="ChromeClose" title="Close" className="close-button" onClick={() => this.props.onClose()} />
                    <div className="workitem-comments">
                        <TextField multiline={true} label='Add a comment' value={this.state.newComment || ""} onChanged={this._commentChanged} onKeyUp={this._onEnter} />
                        {this._getComments()}
                    </div>
                </div>
            );
        }
    }

    public componentWillReceiveProps(nextProps: IWorkItemDiscussionProps) {
        if (nextProps.workItem.id !== this.props.workItem.id) {
            this._initialize(nextProps.workItem.id);
        }
    }

    private async _initialize(workItemId: number) {
        let comments = await WitClient.getClient().getComments(workItemId);
        this.setState({
            loadingState: LoadingState.Loaded,
            comments: comments.comments.sort((c1: WorkItemComment, c2: WorkItemComment) => {
                return -1 * Utils_Date.defaultComparer(c1.revisedDate, c2.revisedDate);
            })
        });
    }

    @autobind
    private _commentChanged(newValue: string) {
        this.setState({...this.state, newComment: newValue});
    }

    @autobind
    private async _onEnter(event: React.KeyboardEvent<HTMLInputElement>) {
        if (!event.shiftKey && event.keyCode === 13 && this.state.newComment.trim() !== "") {            
            event.defaultPrevented = true;

            // save work item
            let patchDocument: JsonPatchDocument & JsonPatchOperation[] = [];
            patchDocument.push({
                op: Operation.Add,
                path: `/fields/System.History`,
                value: this.state.newComment
            } as JsonPatchOperation);
           
            try {
                let workItem = await WitClient.getClient().updateWorkItem(patchDocument, this.props.workItem.id);
                let newComment: WorkItemComment = {
                    text: this.state.newComment,
                    revisedBy: {id: VSS.getWebContext().user.id, name: VSS.getWebContext().user.name, url: ""},
                    revisedDate: new Date(workItem.fields["System.ChangedDate"]),
                    revision: workItem.rev,
                    _links: {},
                    url: ""
                };

                this.setState({...this.state, comments: [newComment].concat(this.state.comments), newComment: "", error: ""});
            }
            catch (e) {
                this.setState({...this.state, error: e.message});
            }
        }     
    }

    private _getComments(): React.ReactNode {
        return this.state.comments.map((comment: WorkItemComment, index: number) => {
            return (
                <div className="work-item-comment" key={`${index}`}>
                    <div className="updated-by">
                        <IdentityView identity={comment.revisedBy} />
                        <span>{Utils_Date.friendly(new Date(comment.revisedDate as any))}</span>
                    </div>
                    <div className="message">
                        {comment.text}
                    </div>
                </div>
            );
        });
    }
}