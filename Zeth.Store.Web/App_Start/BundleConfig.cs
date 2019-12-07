using System.Web.Optimization;

namespace Zeth.Store.Web
{
    public class BundleConfig
    {
        public static void RegisterBundles(BundleCollection Bundles)
        {
            Bundles.Add(new ScriptBundle("~/Js/AuthLogin").Include(
                        "~/Content/Js/WorkerDOM.Core.js",
                        "~/Content/Js/WorkerDOM.Debug.js",
                        "~/Content/Js/Auth.Login.js"));
            Bundles.Add(new StyleBundle("~/Css/AuthLogin").Include(
                      "~/Content/Css/Site.css"));

            Bundles.Add(new ScriptBundle("~/Js/MainIndex").Include(
                        "~/Content/Js/WorkerDOM.Core.js",
                        "~/Content/Js/WorkerDOM.Debug.js",
                        "~/Content/Js/Main.Index.*"));
            Bundles.Add(new StyleBundle("~/Css/MainIndex").Include(
                      "~/Content/Css/Site.css",
                      "~/Content/Css/MainIndex.css"));
        }
    }
}
