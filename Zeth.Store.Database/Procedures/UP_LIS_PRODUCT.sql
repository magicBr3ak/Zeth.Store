﻿CREATE PROCEDURE UP_LIS_PRODUCT
AS
BEGIN
	SELECT * FROM Product ORDER BY Id DESC
END
GO