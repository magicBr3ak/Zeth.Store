﻿CREATE PROCEDURE UP_LIS_USER_ACCESS (
	@Nickname VARCHAR(50)
)
AS
BEGIN
	SELECT [Name],[Value] FROM UserAccess WHERE Nickname = @Nickname 
END
GO