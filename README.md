# Perform multiple actions from just a single click in work item form
A work item form group extension that lets users perform multiple actions on a workitem by just a single click. It shows up as a group in work item form where users can manage and perform one click actions.

* <a href="#overview">Overview</a>
* <a href="#actions">Actions</a>
* <a href="#macros">Macros</a>

<a name="overview"></a>
#### Overview ####
![Group](img/groupoverview.png)

In the screenshot above, 2 rules have been created. Both the rules have multiple actions associated with them. By just clicking on each rule button, all the corresponding actions would be executed in a serial manner. For ex - Clicking on the first button will set the state of current work item to "Resolved", set assigned to as empty and save the workitem, all in one go. If any of the action in the set failed for some reason, then all the actions after it wont be executed. 
Using the toolbar in the extension, users can create new rules or edit existing ones. To create a new rule, click on "New" menu item, which opens up the create dialog.

P.S. - Note that the rules are defined per user per work item type per project. If you create a rule for "Bug" in project "A", it will show up for all the bugs in project "A" but not for bugs of project "B" or any other work item type like "Feature".

![Group](img/newruledialog.png)

To add an action in this rule, select an action from the "Add action" dropdown -

![Group](img/actions.png)

This dropdown shows all the available actions in the extension. Right now the extension supports only 6 extensions which will be described later in this document.

Clicking on an action from the dropdown will add that to the rule. For ex - if you click on "Set field value" action, it will add this -

![Group](img/addaction.png)

Each action needs some user defined inputs. In the "Set field value" action, users can provide a field name and field value as input.

![Group](img/actioninput.png)

Users can then choose to add more actions to the set -

![Group](img/multipleactions.png)

Users can also choose to provide a color to a rule, that color shows up as background color of the rule button in the extension. To delete an action from the rule, click on the "trash" icon on the right side of each action. 

To edit rules, click on "Edit" menu item in the extension. When clicked, the extension enters in "edit mode" where users can edit any rule. 

![Group](img/editmode.png)

To edit a rule in edit mode, click on the "..." button in each rule button, which shows up edit dropdown. 

![Group](img/editdropdown.png)

When you are done editing, click on "Done" which exits the edit mode.

<a name="actions"></a>
#### Actions ####

##### Set Field Value #####
This action lets user set a field value in the workitem. Note that this action will set the field value in the current work item form and not save the workitem automatically. To save the work item, add a "Save workitem" action. Users can also provide a macro as field value in this action. Macros are explain in detail later in this document.

![Group](img/setfieldvalue.png)

In the example above, the rule has 2 "set field value" actions which sets priority and state fields. 

##### Mention someone #####
This action lets user mention a list of users (semicolon seperated list of email address) in the workitem. Performing this action will add a comment in the workitem dicsussion where these users will be mentioned. This action also doesnt save the workitem automatically, it'll just set the comment in the current work item form and dirty it. Users can also choose to provide an optional message in the action. Users can also provide a macro as "mentioned users" in this action. Macros are explain in detail later in this document.

![Group](img/mention.png)

In the example above, the rule will mention Mohit and Matthew in the workitem and add the given message in the comment.

##### Save work item #####
This action lets user save the current workitem. Users can also choose to select "Continue after fail" input, which if selected will not break the action execution sequence even if save fails.

![Group](img/save.png)

In the example above, the rule will mention Mohit in the workitem, save the work item and assign the workitem to Mohit Bagra.

##### Add a comment #####
This action lets user enter a custom comment in the work item discussion.

##### Add a tag #####
This action lets user add a list of tags in the work item. The input should be a semicolon seperated value -

![Group](img/tag.png)

##### Move around kanban board #####
This action allows user to move the current workitem in kanban board. Users can choose to either move it to the board of a different team by selecting the team name, or just move it to different column or row in the same team.

![Group](img/board.png)

In order to save this action, users will first need to select a team from the Team dropdown, then select a Board column (if this team has a board for the current work item type) and board row (only if multiple rows are configured in the selected team's board). If the selected board column is split in Doing and Done, then users can choose which sub column should it go to.

Note that this is the only action which will save the work item using Work item rest API, since board fields are not managed by work item form. 

<a name="macros"></a>
#### Macros ####
Macros are dynamic values, whose values are picked up from the current work item state. For ex, instead of giving a static field value in "Set field value" action, users can choose to provide a macro like "@me" which will set the field value to the current user. Here's a list of available macros -

##### @Me Macro #####
This macro sets the value to the current user. This can be used in "Set Field value" action or "Mention" action -

![Group](img/mefieldvalue.png)

![Group](img/memention.png)

##### @Today Macro #####
This macro sets the value to the current date. This can only be used in "Set Field value" action. Users can also choose to add/subtract certain number of days from @today by using "@today-2" or "@today+3"

![Group](img/todaymacro.png)

##### @fieldValue Macro #####
This macro sets the value to the value of a given field. This can be used in "Set Field value" action or "Mention" action. In the example below, the macro sets the assigned to field value as the same value of field "Created By" and also mention the user which is the same value for "Created By" field.

![Group](img/fieldvaluemacro.png)


#### Future plans ####
1. Add more actions for features like VC and Build
2. Show the rules in work item toolbar as a menu item.
3. Let users share their rules with other users/projects in the account
4. Let user import/export rules in bulk as a json file.