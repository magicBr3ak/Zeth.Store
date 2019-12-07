CREATE PROCEDURE UP_DEL_INVOICE_DETAIL(
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