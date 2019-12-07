CREATE TABLE [dbo].[ProductDetail]
(
	[Id] INT IDENTITY NOT NULL, 
    [ProductId] INT NOT NULL,
	[Name] VARCHAR(200) NOT NULL, 
    [Count] DECIMAL(18, 2) NOT NULL, 
    [PricePercentage] DECIMAL(8, 5) NOT NULL, 
    [PriceOffset] DECIMAL(18, 2) NOT NULL, 
    [Active] BIT NOT NULL, 
    [UpdateTime] DATETIME NOT NULL DEFAULT(GETDATE()), 
    PRIMARY KEY ([Id],[ProductId])
)
