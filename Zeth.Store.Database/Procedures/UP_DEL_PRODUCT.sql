CREATE PROCEDURE UP_DEL_PRODUCT(
	@Id INT
)
AS
BEGIN
	IF (SELECT ISNULL((SELECT COUNT(1) FROM Invoice I INNER JOIN InvoiceDetail ID ON ID.[InvoiceId] = I.[Id] AND ID.[ProductId] = @Id AND I.[Finished] = 1), 0)) > 0 
	BEGIN;
		THROW 50000, 'Este producto ya cuenta con ventas registradas, solo se puede deshabilitar', 1;
		RETURN
	END

	DELETE FROM Product WHERE [Id] = @Id
	DELETE FROM ProductDetail WHERE [ProductId] = @Id
	DELETE FROM Inventory WHERE [ProductId] = @Id
END
GO