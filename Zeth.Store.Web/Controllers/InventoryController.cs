using System;
using System.Data;
using System.Data.Common;
using System.Data.SqlClient;
using System.Text;
using System.Web.Mvc;
using Zeth.Core;
using Zeth.Store.Model;

namespace Zeth.Store.Web.Controllers
{
    public class InventoryController : Controller
    {
        public ActionResult List()
        {
            var Result = default(ActionResult);
            var Connection = default(DbConnection);

            try
            {
                Connection = new SqlConnection().WithConfigString("ConBD");

                var Command = Connection.CreateProcedure("UP_LIS_INVENTORY");
                var StringBuilder = new StringBuilder();

                using (var DataReader = Command.ExecuteReader()) StringBuilder.AddDataReader(DataReader, "Table");

                return Content(StringBuilder.ToString(), "text/csv");
            }
            catch (Exception Ex)
            {
                Result = Json(new WebResult<string>(Ex.SaveException(), null));
            }

            Connection.TryClose();

            return Result;
        }
        public ActionResult Save(Inventory Inventory)
        {
            var Result = default(WebResult<Inventory>);
            var Connection = default(DbConnection);
            var Command = default(DbCommand);

            try
            {
                Connection = new SqlConnection().WithConfigString("ConBD");
                Command = Connection.CreateProcedure("UP_INS_INVENTORY").
                    WithParameter<SqlParameter>("Id", x => x.DbType = DbType.Int32).
                    WithParameter("ProductId", Inventory.ProductId).
                    WithParameter<SqlParameter>("Time", x => x.DbType = DbType.DateTime).
                    WithParameter("Count", Inventory.Count).
                    WithParameter("Price", Inventory.Price);

                Command.ExecuteNonQuery();

                Inventory.Id = (int)Command.Parameters["Id"].Value;
                Inventory.Time = (DateTime)Command.Parameters["Time"].Value;

                Result = new WebResult<Inventory>(Inventory);
            }
            catch (Exception Ex)
            {
                Result = new WebResult<Inventory>(Ex.SaveException(), Ex.Message);
            }

            Connection.TryClose();

            return Json(Result);
        }
        public ActionResult Delete(Inventory Inventory)
        {
            var Result = default(WebResult<string>);
            var Connection = default(DbConnection);

            try
            {
                Connection = new SqlConnection().WithConfigString("ConBD");

                Connection.CreateProcedure("UP_DEL_INVENTORY").
                    WithParameter("Id", Inventory.Id).
                    WithParameter("ProductId", Inventory.ProductId).
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