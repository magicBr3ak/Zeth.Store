namespace Zeth.Store.Model
{
    public class ProductDetail
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string Name { get; set; }
        public decimal Count { get; set; }
        public decimal PricePercentage { get; set; }
        public decimal PriceOffset { get; set; }
        public bool Active { get; set; }
    }
}
