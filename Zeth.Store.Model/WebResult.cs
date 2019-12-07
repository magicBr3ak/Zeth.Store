namespace Zeth.Store.Model
{
    public class WebResult<T>
    {
        public bool HasError { get; set; }
        public string ErrorId { get; set; }
        public string ErrorMessage { get; set; }
        public T Result { get; set; }

        public WebResult(T result)
        {
            HasError = false;
            Result = result;
        }
        public WebResult(string errorId, string errorMessage)
        {
            HasError = true;
            ErrorId = errorId;
            ErrorMessage = errorMessage;
        }
    }
}
