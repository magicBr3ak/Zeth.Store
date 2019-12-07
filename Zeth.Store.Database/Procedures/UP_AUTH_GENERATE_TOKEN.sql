CREATE PROCEDURE UP_AUTH_GENERATE_TOKEN (
	@Username VARCHAR(50),
	@Password VARCHAR(MAX)
)
AS
BEGIN
	DECLARE @Token INT

	SET @Token = (SELECT FLOOR(RAND()*8999999) + 1000000)

	UPDATE [User] SET Token = @Token WHERE [Nickname] = @Username AND [Password] = @Password

	IF @@ROWCOUNT > 0 
		SELECT @Token
	ELSE
		SELECT 0
END
GO