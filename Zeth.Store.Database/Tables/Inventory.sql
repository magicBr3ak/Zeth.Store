CREATE TABLE [dbo].[Inventory]
(
	[Id] INT IDENTITY NOT NULL,
	[ProductId] INT NOT NULL, 
    [Time] DATETIME NOT NULL,
	[Count] DECIMAL(18, 2) NOT NULL, 
    [Price] DECIMAL(18, 2) NOT NULL,
    PRIMARY KEY ([Id], [ProductId])
)
