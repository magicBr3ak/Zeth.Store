CREATE TABLE [dbo].[InvoiceDetail]
(
	[Id] INT IDENTITY NOT NULL,
	[InvoiceId] INT NOT NULL, 
    [ProductId] INT NOT NULL,
	[DetailId] INT NOT NULL,
	[Count] DECIMAL(18, 2) NOT NULL, 
    [UnitPrice] DECIMAL(18, 2) NOT NULL, 
    [TotalPrice] DECIMAL(18, 2) NOT NULL, 
    [TotalCost] DECIMAL(18, 2) NOT NULL, 
	[TotalCount] DECIMAL(18, 2) NOT NULL,
    PRIMARY KEY ([Id],[InvoiceId],[ProductId],[DetailId])
)
