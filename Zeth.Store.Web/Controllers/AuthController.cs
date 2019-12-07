using System;
using System.Data.Common;
using System.Data.SqlClient;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using System.Text;
using System.Web;
using System.Web.Mvc;
using Zeth.Core;
using Zeth.Store.Model;

namespace Zeth.Store.Web.Controllers
{
    public class AuthController : Controller
    {
        public ActionResult GenerateToken()
        {
            var Result = default(WebResult<string>);
            var Connection = default(DbConnection);

            try
            {
                var Token = 0;

                Connection = new SqlConnection().WithConfigString("ConBD");
                Token = (int)Connection.CreateProcedure("UP_AUTH_GENERATE_TOKEN").
                    WithParameter("@Username", Request.Form["Username"]).
                    WithParameter("@Password", Request.Form["Password"]).
                    ExecuteScalar();

                if (Token > 0)
                {
                    this.SetUserInfo(new UserWebInfo() { Token = Token, Username = Request.Form["Username"] });
                    Result = new WebResult<string>("ok");
                }
                else Result = new WebResult<string>(null, "Datos de sesión incorrectos");
            }
            catch (Exception Ex)
            {
                Result = new WebResult<string>(Ex.SaveException(), null);
            }

            Connection.TryClose();

            return Json(Result);
        }
        public ActionResult ClearToken()
        {
            var Result = default(WebResult<string>);

            if (this.HasUserInfo())
            {
                try
                {
                    var Cookie = Request.Cookies[Constants.USER_INFO_COOKIE_KEY];

                    Cookie.Expires = DateTime.Now.AddDays(-1);

                    Response.Cookies.Add(Cookie);

                    Result = new WebResult<string>("ok");
                }
                catch (Exception Ex)
                {
                    Result = new WebResult<string>(Ex.SaveException(), null);
                }
            }
            else Result = new WebResult<string>("ok");

            return Json(Result);
        }
    }
}