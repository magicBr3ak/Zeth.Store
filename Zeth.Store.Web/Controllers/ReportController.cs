using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Data.SqlClient;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Web.Mvc;
using Zeth.Core;
using Zeth.Store.Model;

namespace Zeth.Store.Web.Controllers
{
    public class ReportController : Controller
    {
        public ActionResult List(Report Report)
        {
            var Result = default(ActionResult);
            var Connection = default(DbConnection);

            try
            {
                Connection = new SqlConnection().WithConfigString("ConBD");

                var Command = Connection.CreateCommand();
                var StringBuilder = new StringBuilder();
                var CommandText = System.IO.File.ReadAllText(Server.MapPath("~\\App_Data\\RPT_BASE.txt"));
                var CommandData = string.Empty;
                var Line = Report.Id;
                var LineText = string.Empty;
                var LineData = new List<string>();
                var Header = new CsvBuilderHeaderData() { HeaderName = "Bind", HeaderData = LineData };

                using (var TFile = System.IO.File.Open(Server.MapPath("~\\App_Data\\RPT_DATA.txt"), FileMode.Open, FileAccess.Read))
                using (var Reader = new StreamReader(TFile))
                {
                    while (!Reader.EndOfStream)
                    {
                        if ((LineText = Reader.ReadLine()).StartsWith(Line)) break;                        
                    }
                }

                LineData.AddRange(LineText.Split(new string[] { "\\^" }, StringSplitOptions.RemoveEmptyEntries));

                Command.CommandType = CommandType.Text;
                Command.CommandText = string.Format(CommandText, LineData[1], LineData[2]);

                LineData.RemoveRange(0, 3);
                LineData.AddRange(new string[] { "Row.Venta:ToMoney", "Row.Compra:ToMoney", "Row.Cantidad" });

                Command.WithParameter("StartTime", Report.StartTime.FromJsTime()).WithParameter("EndTime", Report.EndTime.FromJsTime());

                using (var DataReader = Command.ExecuteReader()) StringBuilder.AddDataReader(DataReader, "Table", Header);

                return Content(StringBuilder.ToString(), "text/csv");
            }
            catch (Exception Ex)
            {
                Result = Json(new WebResult<string>(Ex.SaveException(), Ex.Message));
            }

            Connection.TryClose();

            return Result;
        }
    }
}