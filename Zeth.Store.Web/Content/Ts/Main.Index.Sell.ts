namespace WorkerDOM {

    //#region Interfaces
    export interface IInvoiceObject {
        Id: number;
        Time: Date;
    }
    export interface IInvoiceDetailObject {
        Id: number;
        InvoiceId: number;
        ProductId: number;
        DetailId: number;
        Count: number;
        UnitPrice: number;
        TotalPrice: number;
        TotalCost: number;
        TotalCount: number;

        DisplayName: string;
    }
    interface IInvoiceDetailClass {
        Count: string;
    }
    interface IInvoiceConfirmData {
        Object: IInvoiceConfirmObject;
        Class: IInvoiceConfirmClass;

        Save();
        Cancel();
        Numeric(element: HTMLElement);

        CreateMoneyInput(element: HTMLElement);
        OnMoneyInput();

        ToMoney(value: number): string;
    }
    interface IInvoiceConfirmObject {
        TotalPrice: number;
        MoneyInput: number;
        MoneyOutput: number;
    }
    interface IInvoiceConfirmClass {
        MoneyInput: string;
    }
    interface ISellFilter {
        Filter: string;
    }
    interface ISellData {
        Visible: boolean;
        Object: ISellFilter;
        Invoice: IInvoiceObject;
        Items: Array<IInvoiceDetailObject>

        New();
        Save();
        Add(item: IProductObject);
        Delete(item: IInvoiceDetailObject);
        CleanFilter();

        ItemsView(): Array<IProductObject>;
        TotalPrice(): number;
        OnFilter();
        CreateFilter(element: HTMLElement);

        DateToISOString(value: Date);
        ProductName(id: number);
        ToMoney(value: number): string;
    }
    interface IModalData {
        Product: IProductObject;
        Object: IInvoiceDetailObject;
        Class: IInvoiceDetailClass;
        Details: Array<IProductDetailObject>;

        Save();
        Cancel();
        Numeric(element: HTMLElement);

        OnDetailIdChange();
        OnCountChange();

        CreateDetail(element: HTMLElement);

        ToMoney(value: number): string;
        ProductName(id: number): string;
    }
    //#endregion

    //#region Main
    function SellController($data: ISellData, $worker: IViewWorker, $services: IReadOnlyDictionary<any>, $params: Array<any>) {

        var $modal: IModalService = $services.get('modal');
        var $wait: IWaitService = $services.get('wait');
        var $http: IHttpService = $services.get('http');
        var $args: IMainIndexArgs = $params[0];

        var mdWorker: IModalWorker;
        var mdDataWorker: IModalData;
        var mdConfirmWorker: IModalWorker;
        var mdConfirmDataWorker: IInvoiceConfirmData;
        var refreshItemViewId: number;
        var filterElement: HTMLElement;

        function fnInstance() {
            $args.PanelContainer['Sell'] = fnSetVisible;

            $data.Visible = false;
            $data.ToMoney = $args.ToMoney;
            $data.DateToISOString = $args.DateToISOString;
            $data.ProductName = $args.ProductName;
            $data.Object = { Filter: '' };
            $data.Invoice = { Id: 0, Time: new Date() };
            $data.Items = [];

            $worker.setEventListener('newInvoiceDetail', fnOnNew, $args.Event);
        }
        function fnInstanceModal() {
            if (mdWorker == null) {
                mdDataWorker = <IModalData>{ Object: {} };
                mdWorker = $modal.create('SellModal', [$args, mdDataWorker]);
            }
        }
        function fnInstanceConfirmModal() {
            if (mdConfirmWorker == null) {
                mdConfirmDataWorker = <IInvoiceConfirmData>{ Object: {} };
                mdConfirmWorker = $modal.create('SellConfirmModal', [$args, mdConfirmDataWorker, fnSave]);
            }
        }
        function fnSetVisible(value: boolean) {
            $data.Visible = value;
            $worker.refresh('Visible');

            if (value === true) {
                if ($data.Invoice.Id == 0) $data.New();
                else {
                    $data.Object.Filter = '';
                    $worker.refresh('Object');
                    $worker.refresh('ItemsView');
                    filterElement.focus();
                }
            }
        }
        function fnOnNew(item: IInvoiceDetailObject) {
            $data.Items.unshift(item);

            $data.Object.Filter = '';

            fnRefreshItems();

            $worker.refresh('TotalPrice');

            $data.CleanFilter();
        }
        function fnRefreshItemsView() {
            $worker.refresh('ItemsView');
            refreshItemViewId = null;
        }
        function fnRefreshItems() {
            $data.Items.sort(function (a: IInvoiceDetailObject, b: IInvoiceDetailObject) { return b.Id - a.Id });
            $worker.refresh('Items');
        }
        function fnSave() {
            var frm: FormData = new FormData();
            var key: string;

            for (var key in $data.Invoice) frm.append(key, $data.Invoice[key]);

            $wait.set(true);

            $http.post($args.Url + 'Invoice/Save', frm).then(
                function (data: any) {
                    if ($http.hasError(data)) {
                        $args.ShowError($http.getError(data), 'Fallo al crear la venta');
                    }
                    else {
                        $args.Event.invoke('saveInvoice', [$data.Invoice, $data.Items]);

                        $data.Invoice.Id = 0;
                        $data.Invoice.Time = new Date();
                        $data.Items = [];

                        data.Result.Time = new Date(parseInt(data.Result.Time.substr(6)));
                        for (key in data.Result) $data.Invoice[key] = data.Result[key];

                        $args.ShowText('La venta se guardo exitosamente');
                    }

                    $worker.refresh('Invoice');
                    $worker.refresh('Items');
                    $worker.refresh('TotalPrice');
                    $worker.refresh('ItemsView');

                    $wait.set(false);
                },
                function (error: Error) {
                    $args.ShowError(error.message);
                });
        }
        function fnCompareProductId(a: IProductObject, b: IProductObject): number {
            return a.Id - b.Id;
        }
        function fnCompareProductFrequency(a: IProductObject, b: IProductObject): number {
            if (b.Frequency > a.Frequency) return 1;
            else if (b.Frequency == a.Frequency) return fnCompareProductId(a, b);
            else return -1;
        }
        function fnCompareProductBarcode(a: IProductObject, b: IProductObject): number {
            if (b.Barcode) {
                if (a.Barcode) return fnCompareProductFrequency(a, b);
                else return -1;
            }
            else {
                if (a.Barcode) return 1;
                else return fnCompareProductFrequency(a, b);
            }
        }

        $data.New = function () {
            var key: string;

            $wait.set(true);

            $http.post($args.Url + 'Invoice/New').then(
                function (data: any) {
                    $data.Invoice.Id = 0;
                    $data.Invoice.Time = new Date();
                    $data.Items = [];

                    if ($http.hasError(data)) {
                        $args.ShowError($http.getError(data), 'Fallo al crear la venta');
                    }
                    else {
                        data.Result.Time = new Date(parseInt(data.Result.Time.substr(6)));
                        for (key in data.Result) $data.Invoice[key] = data.Result[key];
                    }

                    $worker.refresh('Invoice');
                    $worker.refresh('Items');
                    $worker.refresh('ItemsView');
                    $worker.refresh('TotalPrice');

                    $wait.set(false);

                    filterElement.focus();
                },
                function (error: Error) {
                    $args.ShowError(error.message);
                });
        };
        $data.Add = function (item: IProductObject) {
            fnInstanceModal();

            mdDataWorker.Product = item;
            mdDataWorker.Object.InvoiceId = $data.Invoice.Id;
            mdDataWorker.Object.ProductId = item.Id;

            mdWorker.show();
        };
        $data.Delete = function (item: IInvoiceDetailObject) {
            var frm = new FormData();

            for (var key in item) frm.append(key, item[key]);

            $http.post($args.Url + 'Invoice/DeleteDetail', frm).then(
                function (data: any) {
                    $wait.set(false);

                    if ($http.hasError(data)) {
                        $args.ShowError($http.getError(data), 'Fallo al eliminar el producto');
                    }
                    else {
                        $data.Items.splice($data.Items.indexOf(item), 1);
                        fnRefreshItems();
                        $worker.refresh('TotalPrice');
                    }
                },
                function (error: Error) {
                    $wait.set(false);
                    $args.ShowError(error.message);
                });
        };
        $data.Save = function () {
            if ($data.Items.length == 0) {
                $args.ShowError('No se puede guardar una venta que no tiene productos');
            }
            else {
                fnInstanceConfirmModal();

                mdConfirmDataWorker.Object.TotalPrice = $data.TotalPrice();

                mdConfirmWorker.show();
            }
        };
        $data.CleanFilter = function () {
            $data.Object.Filter = '';
            $worker.refresh('Object');
            $worker.refresh('ItemsView');

            filterElement.focus();
        };

        $data.OnFilter = function () {
            if (refreshItemViewId != null) clearTimeout(refreshItemViewId);

            refreshItemViewId = setTimeout(fnRefreshItemsView, 200);
        };
        $data.CreateFilter = function (element: HTMLElement) {
            filterElement = element;
        };

        $data.ItemsView = function (): Array<IProductObject> {
            var result: Array<IProductObject> = [];
            var items: Array<IProductObject> = $args.Product.Items;
            var item: IProductObject;
            var i: number = 0;
            var filter: any = $data.Object.Filter.trim().toUpperCase();

            if (filter == '') {
                result = items.slice(0);
            }
            else {
                for (i = 0; i < items.length; i++) {
                    item = items[i];

                    if (isNaN(filter)) {
                        if (item.Name.indexOf(filter) > -1) result.push(item);
                    }
                    else if (filter == item.Barcode.trim()) {
                        result.push(item);
                    }
                }
            }

            result.sort(fnCompareProductBarcode);

            if (result.length == 1 && filter != '' && !isNaN(filter)) {
                setTimeout(function () { $data.Add(result[0]); }, 100);
            }

            return result;
        }
        $data.TotalPrice = function (): number {
            var result: number = 0;
            var i: number = 0;

            for (i = 0; i < $data.Items.length; i++) result += $data.Items[i].TotalPrice;

            return result;
        }

        fnInstance();
    }
    //#endregion

    //#region Modal
    function SellModalController($data: IModalData, $worker: IViewWorker, $services: IReadOnlyDictionary<any>, $params: Array<any>) {
        var $modal: IModalService = $services.get('modal');
        var $http: IHttpService = $services.get('http');
        var $wait: IWaitService = $services.get('wait');
        var $args: IMainIndexArgs = $params[0];
        var $param: IModalData = $params[1];

        var detailElement: HTMLElement;

        function fnInstance() {
            $data.Object = <IInvoiceDetailObject>{ InvoiceId: 0, ProductId: 0, UnitPrice: 0 };
            $data.Class = {
                Count: $args.ClassOk
            };
            $data.Details = [];

            $data.ToMoney = $args.ToMoney;
            $data.ProductName = $args.ProductName;

            fnInstanceObject();

            $worker.setEventListener('beforeShow', fnRefreshData);
        }
        function fnInstanceObject() {
            $data.Object.DisplayName = '';
            $data.Object.Id = 0;
            $data.Object.DetailId = 0;
            $data.Object.TotalPrice = 0;
            $data.Object.Count = 1;
        }
        function fnRefreshData() {
            var key: string;
            var detail: IProductDetailObject;

            $data.Details = $param.Product.Items;

            fnInstanceObject();

            for (key in $param.Object) $data.Object[key] = $param.Object[key];

            detail = $data.Details[$data.Details.length - 1];

            $data.Object.DetailId = detail.Id;
            $data.Object.UnitPrice = +$args.DetailPrice($param.Product, detail);
            $data.Object.TotalPrice = $data.Object.UnitPrice * $data.Object.Count;
            $data.Object.DisplayName = $param.Product.Name + ' - ' + detail.Name;

            $worker.refresh('Details');
            $worker.refresh('Object');

            detailElement.focus();
        }

        $data.Save = function () {
            var hasError: boolean = false;
            var key: string;
            var frm: FormData;

            if (isNaN($data.Object.Count) || (+$data.Object.Count) <= 0) {
                $data.Class.Count = $args.ClassError;
                hasError = true;
            }
            else $data.Class.Count = $args.ClassOk;

            $worker.refresh('Class');

            if (!hasError) {
                frm = new FormData();

                for (var key in $data.Object) frm.append(key, $data.Object[key]);

                $wait.set(true);

                $http.post($args.Url + 'Invoice/SaveDetail', frm).then(
                    function (data: IWebResult<IInvoiceDetailObject>) {
                        $wait.set(false);

                        if ($http.hasError(data)) {
                            $args.ShowError($http.getError(data), 'Fallo al guardar el producto');
                        }
                        else {
                            data.Result.DisplayName = $data.Object.DisplayName;

                            $args.Event.invoke('newInvoiceDetail', [data.Result]);
                            $data.Cancel();
                        }
                    },
                    function (error: Error) {
                        $wait.set(false);
                        $args.ShowError(error.message);
                    });
            }
        };
        $data.Cancel = function () {
            $modal.instance.hide();
        };
        $data.Numeric = function (element: HTMLElement) {
            var value: any = element.getAttribute('w-data');

            if (isNaN(value)) {
                switch (value) {
                    case 'del':
                        value = '' + $data.Object.Count;
                        if (value.length == 1) {
                            $data.Object.Count = 0;
                        }
                        else if (value.length > 0) {
                            value = value.substring(0, value.length - 1);
                            $data.Object.Count = parseInt(value);
                        }
                        break;
                    case 'clr':
                        $data.Object.Count = 0;
                        break;
                }
            }
            else {
                value = '' + $data.Object.Count + value;
                $data.Object.Count = parseInt(value);
            }

            $data.Object.TotalPrice = $data.Object.Count * $data.Object.UnitPrice;
            $worker.refresh('Object.Count');
            $worker.refresh('Object.TotalPrice');
        };

        $data.OnDetailIdChange = function () {
            var details: Array<IProductDetailObject> = $param.Product.Items;
            var detail: IProductDetailObject;
            var i: number;

            for (i = 0; i < details.length; i++) {
                detail = details[i];

                if ($data.Object.DetailId == detail.Id) {
                    $data.Object.UnitPrice = +$args.DetailPrice($param.Product, detail);
                    $data.Object.TotalPrice = $data.Object.UnitPrice * $data.Object.Count;
                    $data.Object.DisplayName = $param.Product.Name + ' - ' + detail.Name;
                    $worker.refresh('Object.UnitPrice');
                    $worker.refresh('Object.TotalPrice');
                    $worker.refresh('Object.DisplayName');
                    return;
                }
            }
        };
        $data.OnCountChange = function () {
            $data.Object.TotalPrice = $data.Object.Count * $data.Object.UnitPrice;
            $worker.refresh('Object.TotalPrice');
        };

        $data.CreateDetail = function (element: HTMLElement) {
            detailElement = element;
        };

        fnInstance();
    }
    //#endregion

    //#region ConfirmModal
    function SellConfirmModalController($data: IInvoiceConfirmData, $worker: IViewWorker, $services: IReadOnlyDictionary<any>, $params: Array<any>) {
        var $modal: IModalService = $services.get('modal');
        var $args: IMainIndexArgs = $params[0];
        var $param: IInvoiceConfirmData = $params[1];
        var $callback: Function = $params[2];

        var moneyInputElement: HTMLInputElement;

        function fnInstance() {
            $data.Object = <IInvoiceConfirmObject>{};
            $data.Class = { MoneyInput: $args.ClassOk };

            $data.ToMoney = $args.ToMoney;

            fnInstanceObject();

            $worker.setEventListener('beforeShow', fnRefreshData);
            $worker.setEventListener('afterShow', fnOnAfterShow);
        }
        function fnInstanceObject() {
            $data.Object.TotalPrice = 0;
            $data.Object.MoneyInput = 0;
            $data.Object.MoneyOutput = 0;
        }
        function fnRefreshData() {
            var key: string;

            fnInstanceObject();

            for (key in $param.Object) $data.Object[key] = $param.Object[key];

            $data.Object.MoneyInput = $data.Object.TotalPrice;

            $worker.refresh('Object');
        }
        function fnOnAfterShow() {
            moneyInputElement.focus();
        }

        $data.Save = function () {
            var hasError: boolean = false;
            var key: string;

            if (isNaN($data.Object.MoneyInput) || (+$data.Object.MoneyInput) <= 0) {
                $data.Class.MoneyInput = $args.ClassError;
                hasError = true;
            }
            else $data.Class.MoneyInput = $args.ClassOk;

            $worker.refresh('Class');

            if (!hasError) {
                $data.Cancel();
                $callback();
            }
        };
        $data.Cancel = function () {
            $modal.instance.hide();
        };
        $data.Numeric = function (element: HTMLElement) {
            var value: any = element.getAttribute('w-data');
            var refresh: boolean = true;

            if (isNaN(value)) {
                switch (value) {
                    case 'del':
                        value = '' + moneyInputElement.value;
                        if (value.length < 2) {
                            $data.Object.MoneyInput = 0;
                        }
                        else if (value[value.length - 2] == '.') {
                            moneyInputElement.value = value.substring(0, value.length - 1);
                            refresh = false;
                        }
                        else {
                            value = value.substring(0, value.length - 1);
                            $data.Object.MoneyInput = parseFloat(value);
                        }
                        break;
                    case 'clr':
                        $data.Object.MoneyInput = 0;
                        break;
                    case 'cop':
                        $data.Object.MoneyInput = $data.Object.TotalPrice;
                        break;
                    case 'dot':
                        moneyInputElement.value = moneyInputElement.value + '.';
                        refresh = false;
                        break;
                }

                if (refresh) {
                    $data.Object.MoneyOutput = $data.Object.MoneyInput - $data.Object.TotalPrice;
                    $worker.refresh('Object.MoneyInput');
                    $worker.refresh('Object.MoneyOutput');
                }
            }
            else {
                value = '' + $data.Object.MoneyInput + value;

                $data.Object.MoneyInput = parseFloat(value);
                $data.Object.MoneyOutput = $data.Object.MoneyInput - $data.Object.TotalPrice;

                $worker.refresh('Object.MoneyInput');
                $worker.refresh('Object.MoneyOutput');
            }
        };

        $data.CreateMoneyInput = function (element: HTMLInputElement) {
            moneyInputElement = element;
        };
        $data.OnMoneyInput = function () {
            if (!isNaN($data.Object.MoneyInput)) {
                $data.Object.MoneyOutput = $data.Object.MoneyInput - $data.Object.TotalPrice;
                $worker.refresh('Object.MoneyOutput');
            }
        };

        fnInstance();
    }
    //#endregion

    //#region Instance
    addController({
        name: 'Sell',
        controller: SellController,
        params: {
            services: ['modal', 'wait', 'http']
        }
    });
    addController({
        name: 'SellModal',
        controller: SellModalController,
        params: {
            services: ['modal', 'http', 'wait']
        }
    });
    addController({
        name: 'SellConfirmModal',
        controller: SellConfirmModalController,
        params: {
            services: ['modal']
        }
    });
    //#endregion

}