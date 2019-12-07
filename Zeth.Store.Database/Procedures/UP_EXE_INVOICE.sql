CREATE PROCEDURE UP_EXE_INVOICE(
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