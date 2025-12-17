-- Test SQL with ALTER TABLE ADD CONSTRAINT FOREIGN KEY where some tables don't exist

CREATE TABLE [Customers] (
  [CustomerID] [int] IDENTITY(1,1) PRIMARY KEY,
  [CustomerName] [nvarchar](100) NOT NULL
);

CREATE TABLE [Orders] (
  [OrderID] [int] IDENTITY(1,1) PRIMARY KEY,
  [CustomerID] [int] NOT NULL
);

-- This should work - both tables exist
ALTER TABLE [Orders]
ADD CONSTRAINT [FK_Orders_Customers]
FOREIGN KEY ([CustomerID])
REFERENCES [Customers] ([CustomerID]);

-- This should be skipped - NonExistentTable doesn't exist
ALTER TABLE [NonExistentTable]
ADD CONSTRAINT [FK_NonExistent_Orders]
FOREIGN KEY ([OrderID])
REFERENCES [Orders] ([OrderID]);

-- This should be skipped - Orders exists but NonExistentParent doesn't
ALTER TABLE [Orders]
ADD CONSTRAINT [FK_Orders_NonExistent]
FOREIGN KEY ([CustomerID])
REFERENCES [NonExistentParent] ([CustomerID]);

-- This should work - both tables exist
ALTER TABLE [Orders]
ADD CONSTRAINT [FK_Orders_Customers2]
FOREIGN KEY ([CustomerID])
REFERENCES [Customers] ([CustomerID]);


