using System;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using System.Web;
using System.Web.Mvc;

namespace Zeth.Store.Model
{
    public static class Constants
    {
        public const string USER_INFO_COOKIE_KEY = "4i3x129s";

        public static void SetUserInfo(this Controller Controller, UserWebInfo UserInfo)
        {
            var Cookie = new HttpCookie(USER_INFO_COOKIE_KEY) { Expires = DateTime.Now.AddYears(1) };
            var Formatter = new BinaryFormatter();
            var Stream = new MemoryStream();

            Formatter.Serialize(Stream, UserInfo);
            Cookie.Value = Convert.ToBase64String(Stream.ToArray());

            Stream.Dispose();

            Controller.Response.Cookies.Set(Cookie);
        }
        public static UserWebInfo GetUserInfo(this Controller Controller)
        {
            var Cookie = Controller.Request.Cookies[USER_INFO_COOKIE_KEY];
            var Formatter = new BinaryFormatter();
            var Stream = new MemoryStream(Convert.FromBase64String(Cookie.Value));
            var UserInfo = (UserWebInfo)Formatter.Deserialize(Stream);

            Stream.Dispose();

            return UserInfo;
        }
        public static bool HasUserInfo(this Controller Controller)
        {
            return Controller.Request.Cookies[USER_INFO_COOKIE_KEY] != null;
        }
    }
}
