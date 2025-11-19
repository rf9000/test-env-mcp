/// <summary>
/// Simple Hello World page for testing compilation
/// </summary>
page 50100 "Hello World"
{
    PageType = Card;
    ApplicationArea = All;
    UsageCategory = Administration;
    Caption = 'Hello World';

    layout
    {
        area(Content)
        {
            group(GroupName)
            {
                Caption = 'General';

                field(WelcomeMessage; WelcomeMessageText)
                {
                    ApplicationArea = All;
                    Caption = 'Welcome Message';
                    Editable = false;
                }

                field(CurrentDateTime; CurrentSystem2)
                {
                    ApplicationArea = All;
                    Caption = 'Current Date/Time';
                    Editable = false;
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(ShowMessage)
            {
                ApplicationArea = All;
                Caption = 'Show Message';
                Image = Message;

                trigger OnAction()
                begin
                    Message(WelcomeMessageText);
                end;
            }

            action(RefreshDateTime)
            {
                ApplicationArea = All;
                Caption = 'Refresh Date/Time';
                Image = Refresh;

                trigger OnAction()
                begin
                    CurrentDateTime := CurrentDateTime;
                end;
            }
        }
    }

    trigger OnOpenPage()
    begin
        WelcomeMessageText := 'Hello World from AL!';
        CurrentDateTime := CurrentDateTime;
    end;

    var
        WelcomeMessageText: Text;
        CurrentDateTime: DateTime;
}
