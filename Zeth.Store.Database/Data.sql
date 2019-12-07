INSERT INTO [User] 
	([Nickname],[FirstName],[LastName],[Password],[Token])
VALUES
	('walter', 'Walter', 'Carasas', 'contraseña', 0),
	('natalie', 'Natalie', 'Carasas', 'cabezona', 0),
	('elena', 'Elena', 'Carasas', '123456', 0)
GO

INSERT INTO [UserAccess] 
	([Nickname],[Name],[Value])
VALUES
	('walter', 'ProductAdd', 1),
	('walter', 'ProductEdit', 1),
	('walter', 'ProductDelete', 1),
	('walter', 'InventoryAdd', 1),
	('walter', 'InventoryEdit', 1),
	('natalie', 'ProductAdd', 1),
	('natalie', 'ProductEdit', 1),
	('natalie', 'ProductDelete', 0),
	('natalie', 'InventoryAdd', 1),
	('natalie', 'InventoryEdit', 1),
	('elena', 'ProductAdd', 0),
	('elena', 'ProductEdit', 0),
	('elena', 'ProductDelete', 0),
	('elena', 'InventoryAdd', 1),
	('elena', 'InventoryEdit', 0)
GO