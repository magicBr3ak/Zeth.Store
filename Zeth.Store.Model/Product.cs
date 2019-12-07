using System.Collections.Generic;

namespace Zeth.Store.Model
{
    public class Product
    {
        public int Id { get; set; }
        public string Barcode { get; set; }
        public string Name { get; set; }
        public decimal MoneyInput { get; set; }
        public decimal MoneyOutput { get; set; }
        public decimal Price { get; set; }
        public decimal Count { get; set; }
        public bool Active { get; set; }

        public string DefaultName { get; set; }
        public List<ProductDetail> Items { get; set; }
    }
}
