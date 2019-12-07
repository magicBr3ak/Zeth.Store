CREATE PROCEDURE UP_RBK_INVOICE(
	@Id INT
)
AS
BEGIN
	UPDATE Invoice SET 
		[Finished] = 2,
		[Price] = 0,
		[Cost] = 0
	WHERE [Id] = @Id

	UPDATE P SET
		P.[Count] = P.[Count] + D.[Count],
		P.[MoneyInput] = P.[MoneyInput] - D.[TotalPrice],
		P.[Frequency] = P.[Frequency] - D.[Frequency]
	FROM 
		Product P INNER JOIN
		(SELECT
			ID.[ProductId],
			SUM(ID.[Count] * PD.[COUNT]) AS [Count],
			SUM(ID.[TotalPrice]) AS [TotalPrice],
			SUM(1) AS [Frequency]
		FROM
			InvoiceDetail ID INNER JOIN
			ProductDetail PD ON ID.[InvoiceId] = @Id AND ID.[ProductId] = PD.[ProductId] AND ID.[DetailId] = PD.[Id]
		GROUP BY
			ID.[ProductId]) D ON P.Id = D.ProductId
END
GO