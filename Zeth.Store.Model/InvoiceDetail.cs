namespace Zeth.Store.Model
{
    public class InvoiceDetail
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public int ProductId { get; set; }
        public int DetailId { get; set; }
        public decimal Count { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal TotalCost { get; set; }
        public decimal TotalCount { get; set; }
    }
}
