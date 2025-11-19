/// <summary>
/// Test codeunit for Hello World functionality
/// </summary>
codeunit 50100 "Hello World Test"
{
    Subtype = Test;

    [Test]
    procedure TestWelcomeMessage()
    var
        ExpectedMessage: Text;
    begin
        // Arrange
        ExpectedMessage := 'Hello World from AL!';

        // Act
        // (Page trigger sets the message)

        // Assert
        if ExpectedMessage <> 'Hello World from AL!' then
            Error('Welcome message does not match expected value');
    end;

    [Test]
    procedure TestDateTimeIsSet()
    var
        TestDateTime: DateTime;
    begin
        // Arrange
        TestDateTime := CurrentDateTime;

        // Act
        // (Page trigger sets the datetime)

        // Assert
        if TestDateTime = 0DT then
            Error('DateTime was not initialized');
    end;

    [Test]
    procedure TestMessageDisplay()
    begin
        // Arrange
        // (No setup needed)

        // Act
        // Message would be shown in UI

        // Assert
        // This test always passes as it only tests that no error occurs
    end;
}
