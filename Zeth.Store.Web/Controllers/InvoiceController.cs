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
    public class InvoiceController : Controller
    {
        public ActionResult New()
        {
            var Result = default(WebResult<Invoice>);
            var Connection = default(DbConnection);
            var Command = default(DbCommand);
            var Invoice = default(Invoice);

            try
            {
                Invoice = new Invoice();
                Connection = new SqlConnection().WithConfigString("ConBD");

                Command = Connection.CreateProcedure("UP_INS_INVOICE").
                    WithParameter<SqlParameter>("Id", x => x.DbType = DbType.Int32).
                    WithParameter<SqlParameter>("Time", x => x.DbType = DbType.DateTime);

                Command.ExecuteNonQuery();

                Invoice.Id = (int)Command.Parameters["Id"].Value;
                Invoice.Time = (DateTime)Command.Parameters["Time"].Value;

                Result = new WebResult<Invoice>(Invoice);
            }
            catch (Exception Ex)
            {
                Result = new WebResult<Invoice>(Ex.SaveException(), Ex.Message);
            }

            Connection.TryClose();

            return Json(Result);
        }
        public ActionResult SaveDetail(InvoiceDetail Detail)
        {
            var Result = default(WebResult<InvoiceDetail>);
            var Connection = default(DbConnection);
            var Command = default(DbCommand);

            try
            {
                Connection = new SqlConnection().WithConfigString("ConBD");

                Command = Connection.CreateProcedure("UP_INS_INVOICE_DETAIL").
                    WithParameter<SqlParameter>("Id", x => x.SqlDbType = SqlDbType.Int).
                    WithParameter("InvoiceId", Detail.InvoiceId).
                    WithParameter("ProductId", Detail.ProductId).
                    WithParameter("DetailId", Detail.DetailId).
                    WithParameter("Count", Detail.Count).
                    WithParameter<SqlParameter>("UnitPrice", x => x.SqlDbType = SqlDbType.Float).
                    WithParameter<SqlParameter>("TotalPrice", x => x.SqlDbType = SqlDbType.Float).
                    WithParameter<SqlParameter>("TotalCost", x => x.SqlDbType = SqlDbType.Float).
                    WithParameter<SqlParameter>("TotalCount", x => x.SqlDbType = SqlDbType.Float);

                Command.ExecuteNonQuery();

                Detail.Id = Convert.ToInt32(Command.Parameters["Id"].Value);
                Detail.UnitPrice = Convert.ToDecimal(Command.Parameters["UnitPrice"].Value);
                Detail.TotalPrice = Convert.ToDecimal(Command.Parameters["TotalPrice"].Value);
                Detail.TotalCost = Convert.ToDecimal(Command.Parameters["TotalCost"].Value);
                Detail.TotalCount = Convert.ToDecimal(Command.Parameters["TotalCount"].Value);

                Result = new WebResult<InvoiceDetail>(Detail);
            }
            catch (Exception Ex)
            {
                Result = new WebResult<InvoiceDetail>(Ex.SaveException(), Ex.Message);
            }

            Connection.TryClose();

            return Json(Result);
        }
        public ActionResult DeleteDetail(InvoiceDetail Detail)
        {
            var Result = default(WebResult<string>);
            var Connection = default(DbConnection);

            try
            {
                Connection = new SqlConnection().WithConfigString("ConBD");

                Connection.CreateProcedure("UP_DEL_INVOICE_DETAIL").
                    WithParameter("Id", Detail.Id).
                    WithParameter("InvoiceId", Detail.InvoiceId).
                    WithParameter("ProductId", Detail.ProductId).
                    WithParameter("DetailId", Detail.DetailId).
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
        public ActionResult Save(Invoice Invoice)
        {
            var Result = default(WebResult<Invoice>);
            var Connection = default(DbConnection);
            var Command = default(DbCommand);

            try
            {
                Connection = new SqlConnection().WithConfigString("ConBD");

                Connection.CreateProcedure("UP_EXE_INVOICE").
                    WithParameter("Id", Invoice.Id).
                    WithParameter("Time", (Invoice.Time = DateTime.Now)).
                    ExecuteNonQuery();

                Invoice = new Invoice();

                Command = Connection.CreateProcedure("UP_INS_INVOICE").
                    WithParameter<SqlParameter>("Id", x => x.DbType = DbType.Int32).
                    WithParameter<SqlParameter>("Time", x => x.DbType = DbType.DateTime);

                Command.ExecuteNonQuery();

                Invoice.Id = (int)Command.Parameters["Id"].Value;
                Invoice.Time = (DateTime)Command.Parameters["Time"].Value;

                Result = new WebResult<Invoice>(Invoice);
            }
            catch (Exception Ex)
            {
                Result = new WebResult<Invoice>(Ex.SaveException(), Ex.Message);
            }

            Connection.TryClose();

            return Json(Result);
        }
        public ActionResult Rollback(Invoice Invoice)
        {
            var Result = default(WebResult<string>);
            var Connection = default(DbConnection);

            try
            {
                Connection = new SqlConnection().WithConfigString("ConBD");

                Connection.CreateProcedure("UP_RBK_INVOICE").
                    WithParameter("Id", Invoice.Id).
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