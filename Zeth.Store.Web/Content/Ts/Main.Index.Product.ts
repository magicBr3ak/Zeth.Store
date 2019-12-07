namespace WorkerDOM {

    //#region Interfaces
    export interface IProductObject {
        Id: number;
        Barcode: string;
        Name: string;
        MoneyInput: number;
        MoneyOutput: number;
        Price: number;
        Count: number;
        Frequency: number;
        Active: boolean;

        DefaultName: string;
        Items: Array<IProductDetailObject>;
    }
    export interface IProductDetailObject {
        Id: number;
        ProductId: number;
        Name: string;
        Count: number;
        PricePercentage: number;
        PriceOffset: number;
        Active: boolean;
    }
    interface IProductFilterObject {
        Filter: string;
    }
    interface IProductClass {
        Name: string;
        Price: string;

        DefaultName: string;
    }
    interface IProductDetailClass {
        Name: string;
        Count: string;
        PricePercentage: string;
        PriceOffset: string;
    }
    interface IProductData {
        Visible: boolean;
        Object: IProductFilterObject;
        Table: ICsvParseResult<IProductObject>;
        DetailTable: ICsvParseResult<IProductDetailObject>;

        New();
        Edit(Item: IProductObject);
        Delete(Item: IProductObject);

        ItemsView(): Array<IProductObject>;
        OnFilter();
        CreateFilter(element: HTMLElement);

        ToMoney(value: number): string;
    }
    interface IModalData {
        Object: IProductObject;
        Class: IProductClass;

        Add();
        Edit(item: IProductDetailObject);
        Delete(item: IProductDetailObject);
        Save();
        Cancel();

        DetailPrice(item: IProductDetailObject): string;

        IsNew(): boolean;
        CreateBarcode(element: HTMLElement);
    }
    interface IDetailModalData {
        Parent: IProductObject;
        Object: IProductDetailObject;
        Class: IProductDetailClass;

        Save();
        Cancel();

        IsNew(): boolean;
        CreateName(element: HTMLElement);

        ProductName(id: number): string;
    }
    //#endregion

    //#region Main
    function ProductController($data: IProductData, $worker: IViewWorker, $services: IReadOnlyDictionary<any>, $params: Array<any>) {

        var $modal: IModalService = $services.get('modal');
        var $wait: IWaitService = $services.get('wait');
        var $http: IHttpService = $services.get('http');
        var $csv: ICsvService = $services.get('csv');
        var $args: IMainIndexArgs = $params[0];

        var mdWorker: IModalWorker;
        var mdDataWorker: IModalData;
        var refreshTableItems = false;
        var refreshItemViewId: number;
        var filterElement: HTMLElement;

        function fnInstance() {
            $args.PanelContainer['Product'] = fnSetVisible;
            $args.ModalProduct = fnModal;

            $data.Table = $args.Product;
            $data.Object = { Filter: '' };
            $data.Visible = false;

            $data.ToMoney = $args.ToMoney;
            $args.DetailPrice = fnDetailPrice;

            $worker.setEventListener('newProduct', fnOnNew, $args.Event);
            $worker.setEventListener('updateProduct', fnOnUpdate, $args.Event);
            $worker.setEventListener('deleteProduct', fnOnDelete, $args.Event);
        }
        function fnInstanceModal() {
            if (mdWorker == null) {
                mdDataWorker = <IModalData>{};
                mdWorker = $modal.create('ProductModal', [$args, mdDataWorker]);
            }
        }
        function fnSetVisible(value: boolean) {
            $data.Visible = value;
            $worker.refresh('Visible');

            if (value === true) {
                if (refreshTableItems) {
                    fnRefreshItemsView();
                }
                filterElement.focus();
            }
        }
        function fnRefreshItemsView() {
            refreshTableItems = false;
            $worker.refresh('ItemsView');
            refreshItemViewId = null;
        }
        function fnOnNew(item: IProductObject) {
            $data.Table.Items.unshift(item);

            if ($data.Visible) fnRefreshItemsView();
            else refreshTableItems = true;
        }
        function fnOnUpdate(item: IProductObject, ref: IProductObject) {
            var index = $data.Table.Items.indexOf(ref);

            $data.Table.Items[index] = item;
            item.Items = ref.Items;

            if ($data.Visible) fnRefreshItemsView();
            else refreshTableItems = true;
        }
        function fnOnDelete(item: IProductObject) {
            var index = $data.Table.Items.indexOf(item);

            $data.Table.Items.splice(index, 1);

            if ($data.Visible) fnRefreshItemsView();
            else refreshTableItems = true;
        }
        function fnModal(item: IProductObject) {
            fnInstanceModal();

            mdDataWorker.Object = item;

            mdWorker.show();
        }
        function fnDetailPrice(item: IProductObject, detail: IProductDetailObject): string {
            var value: number;

            if (detail.PricePercentage > 0) value = detail.Count * item.Price * (100.0 + detail.PricePercentage) / 100.0;
            else value = (detail.Count * item.Price) + detail.PriceOffset;

            return $args.ToMoney(value);
        }

        $data.New = function () {
            fnModal(<IProductObject>{ Id: 0 });
        };
        $data.Edit = function (item: IProductObject) {
            fnModal(item);
        };
        $data.Delete = function (item: IProductObject) {
            $args.ShowConfirm('Esta seguro de borrar el producto "' + item.Name + '" permanentemente?', function (value: boolean) {
                if (value != true) return;

                var frm = new FormData();

                for (var key in item) frm.append(key, item[key]);

                $http.post($args.Url + 'Product/Delete', frm).then(
                    function (data: any) {
                        $wait.set(false);

                        if ($http.hasError(data)) {
                            $args.ShowError($http.getError(data), 'Fallo al eliminar el producto');
                        }
                        else {
                            $args.Event.invoke('deleteProduct', [item]);
                        }
                    },
                    function (error: Error) {
                        $wait.set(false);
                        $args.ShowError(error.message);
                    });
            });
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

            result.sort(function (a: IProductObject, b: IProductObject) { return a.Id - b.Id; });

            return result;
        }

        fnInstance();
    }
    //#endregion

    //#region Modal
    function ProductModalController($data: IModalData, $worker: IViewWorker, $services: IReadOnlyDictionary<any>, $params: Array<any>) {
        var $modal: IModalService = $services.get('modal');
        var $http: IHttpService = $services.get('http');
        var $wait: IWaitService = $services.get('wait');
        var $args: IMainIndexArgs = $params[0];
        var $param: IModalData = $params[1];

        var mdWorker: IModalWorker;
        var mdDataWorker: IDetailModalData;
        var barcodeElement: HTMLElement;

        function fnInstance() {
            $data.Object = <IProductObject>{};
            $data.Class = {
                Name: $args.ClassOk,
                Price: $args.ClassOk,
                DefaultName: $args.ClassOk
            };

            fnInstanceObject();

            $worker.setEventListener('beforeShow', fnRefreshData);
            $worker.setEventListener('afterShow', fnOnAfterShow);
        }
        function fnInstanceModal() {
            if (mdWorker == null) {
                mdDataWorker = <IDetailModalData>{ Parent: $param.Object };
                mdWorker = $modal.create('ProductDetailModal', [$args, mdDataWorker]);
            }
        }
        function fnInstanceObject() {
            $data.Object.Id = 0;
            $data.Object.Barcode = '';
            $data.Object.Count = 0;
            $data.Object.MoneyInput = 0;
            $data.Object.MoneyOutput = 0;
            $data.Object.Name = '';
            $data.Object.Price = 0;
            $data.Object.Active = true;

            $data.Object.Items = [];
            $data.Object.DefaultName = 'Normal';
        }
        function fnRefreshData() {
            var key: string;

            fnInstanceObject();

            for (key in $param.Object) $data.Object[key] = $param.Object[key];

            if (mdWorker) mdDataWorker.Parent = $param.Object;

            $worker.refresh('Object');
            $worker.refresh('IsNew');
        }
        function fnOnAfterShow() {
            barcodeElement.focus();
        }

        $data.Add = function () {
            fnInstanceModal();

            mdDataWorker.Parent = $param.Object;
            mdDataWorker.Object = <IProductDetailObject>{ Id: 0, ProductId: $param.Object.Id };

            mdWorker.show();
        };
        $data.Edit = function (item: IProductDetailObject) {
            fnInstanceModal();

            mdDataWorker.Parent = $param.Object;
            mdDataWorker.Object = item;

            mdWorker.show();
        };
        $data.Delete = function (item: IProductDetailObject) {
            if (item.PriceOffset == 0 && item.PricePercentage == 0) {
                $args.ShowError('No puede eliminar este detalle');
            }
            else {
                $args.ShowConfirm('Esta seguro de borrar el producto "' + item.Name + '" permanentemente?', function (value: boolean) {
                    if (value != true) return;

                    var frm = new FormData();
                    var items: Array<IProductDetailObject>;

                    for (var key in item) frm.append(key, item[key]);

                    $http.post($args.Url + 'Product/DeleteDetail', frm).then(
                        function (data: any) {
                            $wait.set(false);

                            if ($http.hasError(data)) {
                                $args.ShowError($http.getError(data), 'Fallo al eliminar el producto');
                            }
                            else {
                                items = $data.Object.Items;
                                items.splice(items.indexOf(item), 1);
                                $worker.refresh('Object.Items');
                            }
                        },
                        function (error: Error) {
                            $wait.set(false);
                            $args.ShowError(error.message);
                        });
                });
            }
        };
        $data.Save = function () {
            var hasError: boolean = false;
            var key: string;
            var frm: FormData;

            if ($data.Object.Name.trim() == '') {
                $data.Class.Name = $args.ClassError;
                hasError = true;
            }
            else $data.Class.Name = $args.ClassOk;

            if (isNaN($data.Object.Price)) {
                $data.Class.Price = $args.ClassError;
                hasError = true;
            }
            else $data.Class.Price = $args.ClassOk;

            if ($data.Object.DefaultName.trim() == '') {
                $data.Class.DefaultName = $args.ClassError;
                hasError = true;
            }
            else $data.Class.DefaultName = $args.ClassOk;

            $worker.refresh('Class');

            if (!hasError) {
                frm = new FormData();

                $data.Object.Name = $data.Object.Name.trim().toUpperCase();
                $data.Object.DefaultName = $data.Object.DefaultName.trim().toUpperCase();
                $data.Object.Barcode = $data.Object.Barcode ? $data.Object.Barcode.trim() : '';

                frm.append('Id', <any>$data.Object.Id);
                frm.append('Barcode', <any>$data.Object.Barcode);
                frm.append('Name', <any>$data.Object.Name);
                frm.append('Price', <any>$data.Object.Price);
                frm.append('Active', <any>$data.Object.Active);
                frm.append('DefaultName', <any>$data.Object.DefaultName);

                $wait.set(true);

                $http.post($args.Url + 'Product/Save', frm).then(
                    function (data: any) {
                        $wait.set(false);

                        if ($http.hasError(data)) {
                            $args.ShowError($http.getError(data), 'Fallo al guardar el producto');
                        }
                        else {
                            if ($data.IsNew()) {
                                $param.Object = data.Result;
                                $args.Event.invoke('newProduct', [data.Result]);
                                $args.ModalInventory(<IInventoryObject>{ ProductId: $param.Object.Id });
                            }
                            else {
                                $args.Event.invoke('updateProduct', [data.Result, $param.Object]);
                                $data.Cancel();
                            }
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
        }

        $data.DetailPrice = function (item: IProductDetailObject) {
            return $args.DetailPrice($param.Object, item);
        }

        $data.IsNew = function (): boolean {
            return $data.Object.Id == 0;
        };
        $data.CreateBarcode = function (element: HTMLElement) {
            barcodeElement = element;
        }

        fnInstance();
    }
    //#endregion

    //#region DetailModal
    function ProductDetailModalController($data: IDetailModalData, $worker: IViewWorker, $services: IReadOnlyDictionary<any>, $params: Array<any>) {
        var $modal: IModalService = $services.get('modal');
        var $http: IHttpService = $services.get('http');
        var $wait: IWaitService = $services.get('wait');
        var $args: IMainIndexArgs = $params[0];
        var $param: IDetailModalData = $params[1];

        var nameElement: HTMLElement;

        function fnInstance() {
            $data.Object = <IProductDetailObject>{};
            $data.Class = {
                Name: $args.ClassOk,
                Count: $args.ClassOk,
                PriceOffset: $args.ClassOk,
                PricePercentage: $args.ClassOk
            };

            $data.ProductName = $args.ProductName;

            fnInstanceObject();

            $worker.setEventListener('beforeShow', fnRefreshData);
            $worker.setEventListener('afterShow', fnOnAfterShow);
        }
        function fnInstanceObject() {
            $data.Object.Id = 0;
            $data.Object.ProductId = 0;
            $data.Object.Name = '';
            $data.Object.Count = 1;
            $data.Object.PriceOffset = 0;
            $data.Object.PricePercentage = 0;
            $data.Object.Active = true;
        }
        function fnRefreshData() {
            var key: string;

            fnInstanceObject();

            for (key in $param.Object) $data.Object[key] = $param.Object[key];

            $worker.refresh('Object');
            $worker.refresh('IsNew');
        }
        function fnOnAfterShow() {
            nameElement.focus();
        }

        $data.Save = function () {
            var hasError: boolean = false;
            var key: string;
            var frm: FormData;
            var items: Array<IProductDetailObject>;

            if ($data.Object.Name.trim() == '') {
                $data.Class.Name = $args.ClassError;
                hasError = true;
            }
            else $data.Class.Name = $args.ClassOk;

            if (isNaN($data.Object.Count) || (+$data.Object.Count) <= 0) {
                $data.Class.Count = $args.ClassError;
                hasError = true;
            }
            else $data.Class.Count = $args.ClassOk;

            if (isNaN($data.Object.PricePercentage)) {
                $data.Class.PricePercentage = $args.ClassError;
                hasError = true;
            }
            else $data.Class.PricePercentage = $args.ClassOk;

            if (isNaN($data.Object.PriceOffset)) {
                $data.Class.PriceOffset = $args.ClassError;
                hasError = true;
            }
            else $data.Class.PriceOffset = $args.ClassOk;

            if (!hasError) {
                if (((+$data.Object.PricePercentage) * (+$data.Object.PriceOffset)) > 0) {
                    $data.Class.PricePercentage = $args.ClassError;
                    $data.Class.PriceOffset = $args.ClassError;
                    hasError = true;
                }
                else {
                    $data.Class.PricePercentage = $args.ClassOk;
                    $data.Class.PriceOffset = $args.ClassOk;
                }
            }

            $worker.refresh('Class');

            if (!hasError) {
                frm = new FormData();

                $data.Object.Name = $data.Object.Name.trim().toUpperCase();

                for (var key in $data.Object) frm.append(key, $data.Object[key]);

                $wait.set(true);

                $http.post($args.Url + 'Product/SaveDetail', frm).then(
                    function (data: any) {
                        $wait.set(false);

                        if ($http.hasError(data)) {
                            $args.ShowError($http.getError(data), 'Fallo al guardar el detalle del producto');
                        }
                        else {
                            items = $param.Parent.Items;

                            if ($data.IsNew()) {
                                items.unshift(data.Result);
                            }
                            else {
                                items[items.indexOf($param.Object)] = data.Result;
                            }

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
        }

        $data.IsNew = function (): boolean {
            return $data.Object.Id == 0;
        };
        $data.CreateName = function (element: HTMLElement) {
            nameElement = element;
        }

        fnInstance();
    }
    //#endregion

    //#region Instance
    addController({
        name: 'Product',
        controller: ProductController,
        params: {
            services: ['modal', 'wait', 'http', 'csv']
        }
    });
    addController({
        name: 'ProductModal',
        controller: ProductModalController,
        params: {
            services: ['modal', 'http', 'wait']
        }
    });
    addController({
        name: 'ProductDetailModal',
        controller: ProductDetailModalController,
        params: {
            services: ['modal', 'http', 'wait']
        }
    });
    //#endregion
}