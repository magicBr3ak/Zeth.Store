CREATE TABLE [dbo].[User]
(
	[Nickname] VARCHAR(50) NOT NULL PRIMARY KEY, 
    [FirstName] VARCHAR(50) NOT NULL, 
    [LastName] VARCHAR(50) NOT NULL, 
    [Password] VARCHAR(MAX) NOT NULL,
    [Token] INT NOT NULL 
)
