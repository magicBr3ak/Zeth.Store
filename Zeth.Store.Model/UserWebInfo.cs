using System;
using System.Runtime.Serialization;

namespace Zeth.Store.Model
{
    [Serializable]
    public class UserWebInfo
    {
        #region Variables
        [OptionalField(VersionAdded = 1)]
        private int _Token;
        [OptionalField(VersionAdded = 1)]
        private string _Username;
        #endregion

        #region Properties
        public int Token
        {
            get { return _Token; }
            set { _Token = value; }
        }
        public string Username
        {
            get { return _Username; }
            set { _Username = value; }
        }
        #endregion
    }
}
