using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Data.SqlClient;
using System.Web.Mvc;
using Zeth.Core;
using Zeth.Store.Model;

namespace Zeth.Store.Web.Controllers
{
    public class MainController : Controller
    {
        public ActionResult Index()
        {
            if (this.HasUserInfo())
            {
                var UserAccess = new Dictionary<string, bool>();
                var Connection = default(DbConnection);
                var Command = default(DbCommand);
                var UserInfo = default(UserWebInfo);
                var Result = default(ActionResult);

                try
                {
                    UserInfo = this.GetUserInfo();
                    Connection = new SqlConnection().WithConfigString("ConBD");
                    Command = Connection.CreateProcedure("UP_LIS_USER_ACCESS").WithParameter("@Nickname", UserInfo.Username);

                    using (var DataReader = Command.ExecuteReader())
                    {
                        if (DataReader.HasRows)
                        {
                            var NamePos = DataReader.GetOrdinal("Name");
                            var ValuePos = DataReader.GetOrdinal("Value");

                            while (DataReader.Read())
                            {
                                UserAccess.Add(DataReader.GetString(NamePos), DataReader.GetBoolean(ValuePos));
                            }

                        }
                        else throw new Exception("No tiene permisos definidos");
                    }

                    Result = View(UserAccess);
                }
                catch (Exception Ex)
                {
                    Ex.SaveException(UserInfo.Username);

                    Result = RedirectToAction("Error");
                }

                Connection.TryClose();

                return Result;
            }
            else return View("Login");
        }
        public ActionResult Login()
        {
            if (this.HasUserInfo()) return RedirectToAction("Index", "Main");
            else return View();
        }
    }
}