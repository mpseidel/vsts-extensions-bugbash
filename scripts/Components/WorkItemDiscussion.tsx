import * as React from "react";
import { autobind } from "../OfficeFabric/Utilities";
import { TextField } from "../OfficeFabric/TextField";
import { Label } from "../OfficeFabric/Label";
import { CommandBar } from "../OfficeFabric/CommandBar";
import { IContextualMenuItem } from "../OfficeFabric/components/ContextualMenu/ContextualMenu.Props";

import { WorkItem, CommentSortOrder, WorkItemComment } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import Utils_Date = require("VSS/Utils/Date");

import { LoadingState, IBaseProps } from "../Models";
import { Loading } from "./Loading";
import { MessagePanel, MessageType } from "./MessagePanel";
import { IdentityView } from "./IdentityView";
import { saveWorkItem } from "../Helpers";

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
    }

    public render(): JSX.Element {
        if (this.state.loadingState === LoadingState.Loading) {
            return <Loading />;
        }
        else {
            return (
                <div className="workitem-discussion-container">                    
                    { this.state.error && (<MessagePanel message={this.state.error} messageType={MessageType.Error} /> )}
                    <Label className="workitem-discussion-header">{`Discussion for work item: ${this.props.workItem.id}`}</Label>
                    <CommandBar className="discussions-view-toolbar" items={this._getMenuItems()} />
                    <TextField inputClassName="comment-textarea" multiline={true} label='Add a comment' className="add-comment-area" value={this.state.newComment || ""} onChanged={this._commentChanged} onKeyUp={this._onEnter} />

                    <div className="workitem-comments">
                        {this._getComments()}
                    </div>
                </div>
            );
        }
    }

    public componentDidMount() {
        this._initialize(this.props.workItem.id);    
    }

    public componentWillReceiveProps(nextProps: IWorkItemDiscussionProps) {
        if (nextProps.workItem.id !== this.props.workItem.id) {
            this._initialize(nextProps.workItem.id);
        }
    }

    private async _initialize(workItemId: number) {
        this.setState({
            loadingState: LoadingState.Loading,
            comments: [],
            newComment: ""
        });

        let comments = await WitClient.getClient().getComments(workItemId);

        this.setState({
            loadingState: LoadingState.Loaded,
            newComment: "",
            comments: comments.comments.sort((c1: WorkItemComment, c2: WorkItemComment) => {
                return -1 * Utils_Date.defaultComparer(c1.revisedDate, c2.revisedDate);
            })
        });
    }

    @autobind
    private _getMenuItems(): IContextualMenuItem[] {
        return [
            {
                key: "refresh", name: "Refresh", title: "Refresh", iconProps: {iconName: "Refresh"},
                onClick: () => {
                    this._initialize(this.props.workItem.id);
                }
            },            
            {
                key: "close", name: "Close", title: "Close view", iconProps: {iconName: "ChromeClose"},
                onClick: () => {
                    this.props.onClose();
                }
            }                    
        ];        
    }

    @autobind
    private _commentChanged(newValue: string) {
        this.setState({...this.state, newComment: newValue});
    }

    @autobind
    private async _onEnter(event: React.KeyboardEvent<HTMLInputElement>) {
        if (!event.shiftKey && event.keyCode === 13 && this.state.newComment.trim() !== "") {
            // save work item
            let commentText = this.state.newComment;
            this.setState({...this.state, newComment: "", error: ""});

            try {
                let workItem = await saveWorkItem(this.props.workItem.id, "", {"System.History": commentText});
                let newComment: WorkItemComment = {
                    text: commentText,
                    revisedBy: {id: VSS.getWebContext().user.id, name: `${VSS.getWebContext().user.name} <${VSS.getWebContext().user.uniqueName}>`, url: ""},
                    revisedDate: new Date(workItem.fields["System.ChangedDate"]),
                    revision: workItem.rev,
                    _links: {},
                    url: ""
                };

                this.setState({...this.state, comments: [newComment].concat(this.state.comments), newComment: "", error: ""});
            }
            catch (e) {
                this.setState({...this.state, error: e.message, newComment: ""});
            }            
        }     
    }

    private _getComments(): React.ReactNode {
        return this.state.comments.map((comment: WorkItemComment, index: number) => {
            return (
                <div className="work-item-comment" key={`${index}`}>
                    <div className="updated-by">
                        <IdentityView identityDistinctName={comment.revisedBy.name} />
                        <div className="update-date">{Utils_Date.friendly(new Date(comment.revisedDate as any))}</div>
                    </div>
                    <div className="message" dangerouslySetInnerHTML={{ __html: comment.text }} />                        
                </div>
            );
        });
    }
}