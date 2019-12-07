CREATE PROCEDURE UP_UPD_PRODUCT(
	@Id INT,
	@Barcode VARCHAR(50),
    @Name VARCHAR(200),
	@Price DECIMAL(18,2),
	@Active BIT
)
AS
BEGIN
	DECLARE @ProductPriceChange BIT = (SELECT (CASE WHEN [Price] = @Price THEN 0 ELSE 1 END) FROM Product WHERE [Id] = @Id)

	UPDATE Product SET
		[Barcode] = ISNULL(@Barcode, ''),
		[Name] = @Name,
		[Price] = @Price,
		[Active] = @Active,
		[UpdateTime] = (CASE @ProductPriceChange WHEN 1 THEN GETDATE() ELSE [UpdateTime] END)
	WHERE
		[Id] = @Id

	IF @ProductPriceChange = 1
	BEGIN
		UPDATE PD SET PD.[UpdateTime] = P.[UpdateTime] FROM Product P INNER JOIN ProductDetail PD ON P.[Id] = @Id AND PD.[ProductId] = @Id 
	END
END
GO