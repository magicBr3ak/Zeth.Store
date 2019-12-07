CREATE PROCEDURE UP_INS_INVENTORY(
	@Id INT OUTPUT,
	@ProductId INT,
	@Time DATETIME OUTPUT,
	@Count DECIMAL(18,2),
	@Price DECIMAL(18,2)
)
AS
BEGIN
	SET @Time = (SELECT GETDATE())

	INSERT INTO Inventory 
		([ProductId], [Time], [Count], [Price])
	VALUES
		(@ProductId, @Time, @Count, @Price)

	IF @@ROWCOUNT > 0
	BEGIN
		SET @Id = (SELECT CAST(SCOPE_IDENTITY() AS INT))
	END

	UPDATE Product SET 
		[Count] = [Count] + @Count,
		[MoneyOutput] = [MoneyOutput] + @Price,
		[Cost] = (([Count] * [Cost]) + @Price) / ([Count] + @Count),
		[UpdateTime] = @Time
	WHERE [Id] = @ProductId
END
GO