CREATE PROCEDURE UP_UPD_PRODUCT_DETAIL(
	@Id INT,
	@ProductId INT,
	@Name VARCHAR(200),
	@Count DECIMAL(18,2),
    @PricePercentage DECIMAL(8,5),
    @PriceOffset DECIMAL(18,2), 
	@Active BIT
)
AS
BEGIN
	DECLARE @ProductPriceChange BIT = (SELECT (CASE WHEN (([PricePercentage] - @PricePercentage) + ([PriceOffset] - @PriceOffset)) <> 0 THEN 0 ELSE 1 END) FROM ProductDetail WHERE [Id] = @Id AND [ProductId] = @ProductId)

	UPDATE ProductDetail SET
		[Name] = @Name,
		[Count] = @Count,
		[PricePercentage] = @PricePercentage,
		[PriceOffset] = @PriceOffset,
		[Active] = @Active,
		[UpdateTime] = (CASE @ProductPriceChange WHEN 1 THEN GETDATE() ELSE [UpdateTime] END)
	WHERE
		[Id] = @Id AND
		[ProductId] = @ProductId
END
GO