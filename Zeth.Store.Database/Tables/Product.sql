﻿CREATE TABLE [dbo].[Product]
(
	[Id] INT NOT NULL IDENTITY,
	[Barcode] VARCHAR(50) NOT NULL,
    [Name] VARCHAR(200) NOT NULL,
    [MoneyInput] DECIMAL(18, 2) NOT NULL DEFAULT(0),
    [MoneyOutput] DECIMAL(18, 2) NOT NULL DEFAULT(0),
	[Price] DECIMAL(18,2) NOT NULL,
	[Cost] DECIMAL(18,2) NOT NULL DEFAULT(0),
    [Count] DECIMAL(18,2) NOT NULL DEFAULT(0),
	[Frequency] INT NOT NULL DEFAULT(0), 
    [Active] BIT NOT NULL,
	[UpdateTime] DATETIME NOT NULL DEFAULT(GETDATE()),
    PRIMARY KEY([Id],[Barcode])
)