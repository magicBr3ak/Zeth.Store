using System;

namespace Zeth.Store.Model
{
    public class Inventory
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public DateTime Time { get; set; }
        public decimal Price { get; set; }
        public decimal Count { get; set; }
    }
}
