CREATE PROCEDURE UP_DEL_PRODUCT_DETAIL(
	@Id INT,
	@ProductId INT
)
AS
BEGIN
	IF (SELECT ISNULL((SELECT COUNT(1) FROM Invoice I INNER JOIN InvoiceDetail ID ON ID.[InvoiceId] = I.[Id] AND ID.[ProductId] = @ProductId AND ID.[DetailId] = @Id AND I.[Finished] = 1), 0)) > 0 
	BEGIN;
		THROW 50000, 'Este detalle de producto ya cuenta con ventas registradas, solo se puede deshabilitar', 1
		RETURN
	END

	DELETE FROM ProductDetail WHERE [Id] = @Id AND [ProductId] = @ProductId
END
GO