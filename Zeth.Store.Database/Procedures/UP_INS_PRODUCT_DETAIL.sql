CREATE PROCEDURE UP_INS_PRODUCT_DETAIL(
	@Id INT OUTPUT,
	@ProductId INT,
	@Name VARCHAR(200),
	@Count DECIMAL(18,2),
    @PricePercentage DECIMAL(8,5),
    @PriceOffset DECIMAL(18,2), 
	@Active BIT
)
AS
BEGIN
	INSERT INTO ProductDetail 
		([ProductId], [Name], [Count], [PricePercentage], [PriceOffset], [Active]) 
	VALUES
		(@ProductId, @Name, @Count, @PricePercentage, @PriceOffset, @Active)

	IF @@ROWCOUNT > 0
	BEGIN
		SET @Id = (SELECT CAST(SCOPE_IDENTITY() AS INT))
	END
END
GO