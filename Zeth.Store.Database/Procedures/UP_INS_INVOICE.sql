CREATE PROCEDURE UP_INS_INVOICE(
	@Id INT OUTPUT,
	@Time DATETIME OUTPUT
)
AS
BEGIN
	SET @Id = (SELECT ISNULL((SELECT TOP 1 [Id] FROM Invoice WHERE Finished = 0), 0))
	SET @Time = (SELECT GETDATE())

	IF @Id > 0 
	BEGIN
		DELETE ID FROM Invoice I INNER JOIN InvoiceDetail ID ON I.[Id] = ID.[InvoiceId] WHERE Finished = 0
		DELETE Invoice WHERE [Id] <> @Id AND Finished = 0

		UPDATE Invoice SET [Time] = @Time WHERE Id = @Id
	END
	ELSE
	BEGIN
		INSERT INTO Invoice 
			([Time],[Price],[Cost],[Finished])
		VALUES
			(@Time,0,0,0)

		IF @@ROWCOUNT > 0
		BEGIN
			SET @Id = (SELECT CAST(SCOPE_IDENTITY() AS INT))
		END
	END
END
GO