EXEC SP_RENAME 'Invoice.Finished', 'FinishedBKP', 'COLUMN'
GO

ALTER TABLE [Invoice]
ADD [Finished] SMALLINT NOT NULL DEFAULT(0)
GO

UPDATE [Invoice] SET [Finished] = CONVERT(SMALLINT, [FinishedBKP])
GO

ALTER TABLE [Invoice]
DROP COLUMN [FinishedBKP]
GO

EXEC SP_RENAME 'InvoiceDetail', 'InvoiceDetailBKP', 'OBJECT'
GO

CREATE TABLE [InvoiceDetail]
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
GO

INSERT INTO [InvoiceDetail] 
	([InvoiceId],[ProductId],[DetailId],[Count],[UnitPrice],[TotalPrice],[TotalCost],[TotalCount])
SELECT
	[InvoiceId],[ProductId],[DetailId],[Count],[UnitPrice],[TotalPrice],[TotalCost],[TotalCount]
FROM [InvoiceDetailBKP]
GO

DROP TABLE [InvoiceDetailBKP]
GO

ALTER PROCEDURE UP_DEL_INVOICE_DETAIL(
	@Id INT,
	@InvoiceId INT,
	@ProductId INT,
	@DetailId INT
)
AS
BEGIN
	IF (SELECT ISNULL((SELECT COUNT(1) FROM Invoice WHERE [Id] = @InvoiceId AND Finished = 1),0)) > 0
	BEGIN;
		THROW 50000, 'Esta venta ya fue guardada, no se puede modificar los detalles', 1
		RETURN
	END

	DELETE FROM InvoiceDetail WHERE [Id] = @Id AND [InvoiceId] = @InvoiceId AND [ProductId] = @ProductId AND [DetailId] = @DetailId
END
GO

ALTER PROCEDURE UP_INS_INVOICE_DETAIL(
	@Id INT OUT,
	@InvoiceId INT,
	@ProductId INT,
	@DetailId INT,
	@Count DECIMAL(18,2),
	@UnitPrice DECIMAL(18,2) OUT,
	@TotalPrice DECIMAL(18,2) OUT,
	@TotalCost DECIMAL(18,2) OUT,
	@TotalCount DECIMAL(18,2) OUT
)
AS
BEGIN
	IF (SELECT ISNULL((SELECT COUNT(1) FROM Invoice WHERE [Id] = @InvoiceId AND Finished = 1),0)) > 0
	BEGIN;
		THROW 50000, 'Esta venta ya fue guardada, no se puede modificar los detalles', 1
		RETURN
	END

	SELECT 
		@UnitPrice = (CASE 
			WHEN PD.[PricePercentage] <> 0 THEN (P.[Price] * PD.[Count] * (100 + PD.[PricePercentage]) / 100.0)
			ELSE ((P.[Price] * PD.[Count]) + PD.[PriceOffset]) END),
		@TotalCount = @Count * PD.[Count],
		@TotalCost = P.[Cost]
	FROM
		Product P INNER JOIN
		ProductDetail PD ON P.[Id] = @ProductId AND PD.[ProductId] = @ProductId AND PD.[Id] = @DetailId

	SET @TotalPrice = @UnitPrice * @Count
	SET @TotalCost = @TotalCost * @TotalCount

	INSERT INTO InvoiceDetail
		([InvoiceId],[ProductId],[DetailId],[Count],[UnitPrice],[TotalPrice],[TotalCost],[TotalCount])
	VALUES
		(@InvoiceId, @ProductId, @DetailId, @Count, @UnitPrice, @TotalPrice, @TotalCost, @TotalCount)

	IF @@ROWCOUNT > 0
	BEGIN
		SET @Id = (SELECT CAST(SCOPE_IDENTITY() AS INT))
	END
END
GO

ALTER PROCEDURE UP_EXE_INVOICE(
	@Id INT,
	@Time DATETIME
)
AS
BEGIN
	DECLARE @InvoiceTime DATETIME = (SELECT [Time] FROM Invoice WHERE [Id] = @Id)
	
	IF (SELECT ISNULL((SELECT COUNT(1) FROM Invoice WHERE [Id] = @Id AND Finished = 1),0)) > 0
	BEGIN;
		THROW 50000, 'Esta venta ya fue guardada, no se puede volver a guardar', 1
		RETURN
	END
	IF (SELECT ISNULL((SELECT COUNT(1) FROM ProductDetail PD INNER JOIN InvoiceDetail ID ON ID.[InvoiceId] = @Id AND PD.[ProductId] = ID.[ProductId] AND PD.[Id] = ID.[DetailId] WHERE PD.[UpdateTime] > @InvoiceTime), 0)) > 0
	BEGIN;
		THROW 50000, 'La venta no se puede guardar debido a que algún producto ha sido modificado el precio o el stock disponible', 1
		RETURN
	END

	UPDATE I SET 
		I.[Finished] = 1,
		I.[Price] = ID.[TotalPrice],
		I.[Cost] = ID.[TotalCost],
		I.[Time] = @Time
	FROM
		Invoice I INNER JOIN
		(SELECT 
			[InvoiceId],
			SUM([TotalPrice]) AS TotalPrice,
			SUM([TotalCost]) AS TotalCost
		FROM InvoiceDetail
		GROUP BY [InvoiceId]
		HAVING [InvoiceId] = @Id) ID ON I.[Id] = ID.[InvoiceId]
	WHERE [Id] = @Id

	UPDATE P SET
		P.[Count] = P.[Count] - D.[Count],
		P.[MoneyInput] = P.[MoneyInput] + D.[TotalPrice],
		P.[Frequency] = P.[Frequency] + D.[Frequency]
	FROM 
		Product P INNER JOIN
		(SELECT
			ID.[ProductId],
			SUM(ID.[Count] * PD.[COUNT]) AS [Count],
			SUM(ID.[TotalPrice]) AS [TotalPrice],
			SUM(1) AS [Frequency]
		FROM
			InvoiceDetail ID INNER JOIN
			ProductDetail PD ON ID.[InvoiceId] = @Id AND ID.[ProductId] = PD.[ProductId] AND ID.[DetailId] = PD.[Id]
		GROUP BY
			ID.[ProductId]) D ON P.Id = D.ProductId
END
GO

CREATE PROCEDURE UP_LIS_INVOICE
AS
BEGIN
	SELECT * FROM Invoice WHERE Finished <> 0 ORDER BY [Time] DESC
END
GO

CREATE PROCEDURE UP_LIS_INVOICE_DETAIL(
	@Id INT
)
AS
BEGIN
	SELECT * FROM InvoiceDetail WHERE [InvoiceId] = @Id
END
GO