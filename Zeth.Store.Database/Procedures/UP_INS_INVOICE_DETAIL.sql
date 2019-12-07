CREATE PROCEDURE UP_INS_INVOICE_DETAIL(
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

