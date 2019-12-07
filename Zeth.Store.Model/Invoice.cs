using System;

namespace Zeth.Store.Model
{
    public class Invoice
    {
        public int Id { get; set; }
        public DateTime Time { get; set; }
        public decimal Money { get; set; }
        public string Client { get; set; }
        public bool Finished { get; set; }
    }
}
