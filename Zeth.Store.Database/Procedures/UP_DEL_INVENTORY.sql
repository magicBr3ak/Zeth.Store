CREATE PROCEDURE UP_DEL_INVENTORY(
	@Id INT,
	@ProductId INT
)
AS
BEGIN
	DECLARE @Time AS DATETIME 
	DECLARE @Price AS DECIMAL(18,2)
	DECLARE @Count AS DECIMAL(18,2)

	SELECT @Time = [Time], @Price = [Price], @Count = [Count] FROM Inventory WHERE [Id] = @Id AND [ProductId] = @ProductId

	IF (SELECT ISNULL((SELECT COUNT(1) FROM Invoice I INNER JOIN InvoiceDetail ID ON I.[Id] = ID.[InvoiceId] AND I.[Time] > @Time AND I.[Finished] = 1 AND ID.[ProductId] = @ProductId), 0)) > 0
	BEGIN;
		THROW 50000, 'Este inventario ya ha sido utlizado, no se puede eliminar', 1
		RETURN
	END

	UPDATE Product SET
		[Count] = [Count] - @Count,
		[MoneyOutput] = [MoneyOutput] - @Price,
		[Cost] = (CASE WHEN [Count] = @Count THEN [Cost] ELSE ((([Cost] * [Count]) - @Price) / ([Count] - @Count)) END),
		[UpdateTime] = GETDATE()
	WHERE
		[Id] = @ProductId

	DELETE FROM Inventory WHERE [Id] = @Id AND [ProductId] = @ProductId
END
GO