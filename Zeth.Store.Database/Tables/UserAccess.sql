CREATE TABLE [dbo].[UserAccess]
(
	[Nickname] VARCHAR(50) NOT NULL, 
    [Name] VARCHAR(50) NOT NULL, 
    [Value] BIT NOT NULL,
	PRIMARY KEY ([Nickname],[Name])
)
