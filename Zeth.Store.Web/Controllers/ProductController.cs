using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Data.SqlClient;
using System.Text;
using System.Web.Mvc;
using Zeth.Core;
using Zeth.Store.Model;

namespace Zeth.Store.Web.Controllers
{
    public class ProductController : Controller
    {
        private void SaveDetail(DbConnection Connection, ProductDetail Detail)
        {
            var Command = default(DbCommand);

            if (Detail.Id == 0) Command = Connection.CreateProcedure("UP_INS_PRODUCT_DETAIL").WithParameter<SqlParameter>("Id", x => x.DbType = DbType.Int32);
            else Command = Connection.CreateProcedure("UP_UPD_PRODUCT_DETAIL").WithParameter("Id", Detail.Id);

            Command.
                WithParameter("ProductId", Detail.ProductId).
                WithParameter("Name", Detail.Name).
                WithParameter("Count", Detail.Count).
                WithParameter("PricePercentage", Detail.PricePercentage).
                WithParameter("PriceOffset", Detail.PriceOffset).
                WithParameter("Active", Detail.Active).
                ExecuteNonQuery();

            if (Detail.Id == 0) Detail.Id = (int)Command.Parameters["Id"].Value;
        }

        public ActionResult List()
        {
            var Result = default(ActionResult);
            var Connection = default(DbConnection);
            var Command = default(DbCommand);

            try
            {
                var StringBuilder = new StringBuilder();

                Connection = new SqlConnection().WithConfigString("ConBD");
                
                Command = Connection.CreateProcedure("UP_LIS_PRODUCT");
                using (var DataReader = Command.ExecuteReader()) StringBuilder.AddDataReader(DataReader, "Table");

                Command = Connection.CreateProcedure("UP_LIS_PRODUCT_DETAIL");
                using (var DataReader = Command.ExecuteReader()) StringBuilder.AddDataReader(DataReader, "DetailTable");

                return Content(StringBuilder.ToString(), "text/csv");
            }
            catch (Exception Ex)
            {
                Result = Json(new WebResult<string>(Ex.SaveException(), Ex.Message));
            }

            Connection.TryClose();

            return Result;
        }
        public ActionResult Save(Product Product)
        {
            var Result = default(WebResult<Product>);
            var Connection = default(DbConnection);
            var Command = default(DbCommand);
            var Detail = default(ProductDetail);

            try
            {
                Connection = new SqlConnection().WithConfigString("ConBD");

                if (Product.Id == 0) Command = Connection.CreateProcedure("UP_INS_PRODUCT").WithParameter<SqlParameter>("Id", x => x.DbType = DbType.Int32);
                else Command = Connection.CreateProcedure("UP_UPD_PRODUCT").WithParameter("Id", Product.Id);

                Command.
                    WithParameter("Barcode", Product.Barcode.NullableValue()).
                    WithParameter("Name", Product.Name).
                    WithParameter("Price", Product.Price).
                    WithParameter("Active", Product.Active).
                    ExecuteNonQuery();

                if (Product.Id == 0)
                {
                    Product.Id = (int)Command.Parameters["Id"].Value;

                    Detail = new ProductDetail()
                    {
                        ProductId = Product.Id,
                        Name = Product.DefaultName,
                        Count = 1,
                        PriceOffset = 0,
                        PricePercentage = 0,
                        Active = true
                    };

                    SaveDetail(Connection, Detail);

                    Product.Items = new List<ProductDetail>();
                    Product.Items.Add(Detail);
                }

                Result = new WebResult<Product>(Product);
            }
            catch (Exception Ex)
            {
                Result = new WebResult<Product>(Ex.SaveException(), Ex.Message);
            }

            Connection.TryClose();

            return Json(Result);
        }
        public ActionResult Delete(Product Product)
        {
            var Result = default(WebResult<string>);
            var Connection = default(DbConnection);

            try
            {
                Connection = new SqlConnection().WithConfigString("ConBD");

                Connection.CreateProcedure("UP_DEL_PRODUCT").
                    WithParameter("Id", Product.Id).
                    ExecuteNonQuery();

                Result = new WebResult<string>("ok");
            }
            catch (Exception Ex)
            {
                Result = new WebResult<string>(Ex.SaveException(), Ex.Message);
            }

            Connection.TryClose();

            return Json(Result);
        }
        public ActionResult SaveDetail(ProductDetail Detail)
        {
            var Result = default(WebResult<ProductDetail>);
            var Connection = default(DbConnection);

            try
            {
                Connection = new SqlConnection().WithConfigString("ConBD");

                SaveDetail(Connection, Detail);

                Result = new WebResult<ProductDetail>(Detail);
            }
            catch (Exception Ex)
            {
                Result = new WebResult<ProductDetail>(Ex.SaveException(), Ex.Message);
            }

            Connection.TryClose();

            return Json(Result);
        }
        public ActionResult DeleteDetail(ProductDetail Detail)
        {
            var Result = default(WebResult<string>);
            var Connection = default(DbConnection);

            try
            {
                Connection = new SqlConnection().WithConfigString("ConBD");

                Connection.CreateProcedure("UP_DEL_PRODUCT_DETAIL").
                    WithParameter("Id", Detail.Id).
                    WithParameter("ProductId", Detail.ProductId).
                    ExecuteNonQuery();

                Result = new WebResult<string>("ok");
            }
            catch (Exception Ex)
            {
                Result = new WebResult<string>(Ex.SaveException(), Ex.Message);
            }

            Connection.TryClose();

            return Json(Result);
        }
    }
}