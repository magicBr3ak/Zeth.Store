CREATE PROCEDURE UP_INS_PRODUCT(
	@Id INT OUTPUT,
	@Barcode VARCHAR(50),
    @Name VARCHAR(200),
	@Price DECIMAL(18,2),
	@Active BIT
)
AS
BEGIN
	INSERT INTO Product 
		([Barcode], [Name], [Price], [Active]) 
	VALUES
		(ISNULL(@Barcode, ''), @Name, @Price, @Active)

	IF @@ROWCOUNT > 0
	BEGIN
		SET @Id = (SELECT CAST(SCOPE_IDENTITY() AS INT))
	END
END
GO