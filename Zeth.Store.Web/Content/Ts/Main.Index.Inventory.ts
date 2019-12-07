namespace WorkerDOM {

    //#region Interfaces
    export interface IInventoryObject {
        Id: number;
        ProductId: number;
        Time: Date;
        Price: number;
        Count: number;

        ProductName: string;
    }
    interface IInventoryFilterObject {
        Filter: string;
    }
    interface IInventoryClass {
        ProductId: string;
        Count: string;
        Price: string;
    }
    interface IInventoryData {
        Visible: boolean;
        Object: IInventoryFilterObject;
        Table: ICsvParseResult<IInventoryObject>;

        New();
        Delete(Item: IInventoryObject);

        ItemsView(): Array<IInventoryObject>;
        OnFilter();
        CreateFilter(element: HTMLElement);

        DateToISOString(Value: Date);
        ProductName(Id: number);
        ToMoney(value: number): string;
    }
    interface IModalData {
        IsNewProduct: boolean;
        Object: IInventoryObject;
        Class: IInventoryClass;
        Products: Array<IProductObject>

        Save();
        Cancel();

        CreateProduct(element: HTMLElement);
        CreatePrice(element: HTMLElement);

        IsNew(): boolean;
    }
    //#endregion

    //#region Main
    function InventoryController($data: IInventoryData, $worker: IViewWorker, $services: IReadOnlyDictionary<any>, $params: Array<any>) {

        var $modal: IModalService = $services.get('modal');
        var $wait: IWaitService = $services.get('wait');
        var $http: IHttpService = $services.get('http');
        var $csv: ICsvService = $services.get('csv');
        var $args: IMainIndexArgs = $params[0];

        var mdWorker: IModalWorker;
        var mdDataWorker: IModalData;
        var refreshTableItems = true;
        var refreshItemViewId: number;
        var filterElement: HTMLElement;

        function fnInstance() {
            $args.PanelContainer['Inventory'] = fnSetVisible;
            $args.ModalInventory = fnModal;

            $data.Table = { Headers: null, Items: [] };
            $data.Object = { Filter: '' };
            $data.Visible = false;

            $data.DateToISOString = $args.DateToISOString;
            $data.ProductName = $args.ProductName;
            $data.ToMoney = $args.ToMoney;

            $worker.setEventListener('newInventory', fnOnNew, $args.Event);
            $worker.setEventListener('deleteInventory', fnOnDelete, $args.Event);
            $worker.setEventListener('updateProduct', fnOnUpdateProduct, $args.Event);
            $worker.setEventListener('deleteProduct', fnOnDeleteProduct, $args.Event);
        }
        function fnInstanceModal() {
            if (mdWorker == null) {
                mdDataWorker = <IModalData>{ };
                mdWorker = $modal.create('InventoryModal', [$args, mdDataWorker]);
            }
        }
        function fnSetVisible(value: boolean) {
            $data.Visible = value;
            $worker.refresh('Visible');

            if (value === true) {
                if (refreshTableItems == true) {
                    $wait.set(true);

                    $http.post($args.Url + 'Inventory/List').then(
                        function (data: any) {
                            if ($http.hasError(data)) {
                                $args.ShowError($http.getError(data), 'Fallo al obtener la data de inventario');
                                $data.Visible = false;
                                $worker.refresh('Visible');
                            }
                            else {
                                $csv.split(data, $data);
                                $args.Inventory = $data.Table;
                                fnRefreshItemsView();
                            }
                            $wait.set(false);
                        },
                        function (error: Error) {
                            $args.ShowError(error.message);
                            $data.Visible = false;
                            $worker.refresh('Visible');
                            $wait.set(false);
                        });
                }
                else {
                    fnRefreshItemsView();
                }
            }
        }
        function fnRefreshItemsView() {
            refreshTableItems = false;
            $worker.refresh('ItemsView');
            refreshItemViewId = null;
        }
        function fnOnNew(item: IInventoryObject) {
            $data.Table.Items.unshift(item);

            if ($data.Visible) fnRefreshItemsView();
            else refreshTableItems = true;
        }
        function fnOnDelete(item: IInventoryObject) {
            var Index = $data.Table.Items.indexOf(item);

            $data.Table.Items.splice(Index, 1);

            if ($data.Visible) fnRefreshItemsView();
            else refreshTableItems = true;
        }
        function fnOnUpdateProduct(item: IProductObject, ref: IProductObject) {
            if (item.Name != ref.Name) {
                refreshTableItems = true;
            }
        }
        function fnOnDeleteProduct(item: IProductObject) {
            refreshTableItems = true;
        }
        function fnModal(item: IInventoryObject) {
            fnInstanceModal();

            mdDataWorker.Object = item;

            mdWorker.show();
        }

        $data.New = function () {
            fnModal(<IInventoryObject>{ Id: 0 });
        };
        $data.Delete = function (Item: IInventoryObject) {
            $args.ShowConfirm('Esta seguro de borrar el inventario del producto "' + $args.ProductName(Item.ProductId) + '" permanentemente?', function (value: boolean) {
                if (value != true) return;

                var frm = new FormData();

                for (var key in Item) frm.append(key, Item[key]);

                $http.post($args.Url + 'Inventory/Delete', frm).then(
                    function (data: any) {
                        $wait.set(false);

                        if ($http.hasError(data)) {
                            $args.ShowError($http.getError(data), 'Fallo al eliminar el inventario');
                        }
                        else {
                            $args.Event.invoke('deleteInventory', [Item]);
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
        $data.ItemsView = function (): Array<IInventoryObject> {
            var result: Array<IInventoryObject> = [];
            var items: Array<IInventoryObject> = $args.Inventory.Items;
            var item: IInventoryObject;
            var i: number = 0;
            var filter: any = $data.Object.Filter.trim().toUpperCase();

            if (filter == '') {
                result = items.slice(0);
            }
            else {
                for (i = 0; i < items.length; i++) {
                    item = items[i];

                    if (item.ProductName != null && item.ProductName.indexOf(filter) > -1) {
                        result.push(item);
                    }
                }
            }

            result.sort(function (a: IInventoryObject, b: IInventoryObject) { return a.Id - b.Id; });

            return result;
        }

        fnInstance();
    }
    //#endregion

    //#region Modal
    function InventoryModalController($data: IModalData, $worker: IViewWorker, $services: IReadOnlyDictionary<any>, $params: Array<any>) {
        var $modal: IModalService = $services.get('modal');
        var $http: IHttpService = $services.get('http');
        var $wait: IWaitService = $services.get('wait');
        var $args: IMainIndexArgs = $params[0];
        var $param: IModalData = $params[1];

        var productElement: HTMLElement;
        var priceElement: HTMLElement;

        function fnInstance() {
            $data.IsNewProduct = false;
            $data.Object = <IInventoryObject>{};
            $data.Class = {
                ProductId: $args.ClassOk,
                Count: $args.ClassOk,
                Price: $args.ClassOk
            };
            $data.Products = [];

            fnInstanceObject();

            $worker.setEventListener('beforeShow', fnRefreshData);
            $worker.setEventListener('afterShow', fnOnAfterShow);
        }
        function fnInstanceObject() {
            $data.Object.Id = 0;
            $data.Object.ProductId = 0;
            $data.Object.Count = 0;
            $data.Object.Price = 0;
        }
        function fnRefreshData() {
            var key: string;

            fnInstanceObject();

            for (key in $param.Object) $data.Object[key] = $param.Object[key];

            $data.IsNewProduct = $data.Object.ProductId > 0;
            $data.Products = $args.Product.Items;

            $worker.refresh('Products');
            $worker.refresh('IsNew');
            $worker.refresh('IsNewProduct');
            $worker.refresh('Object');
        }
        function fnOnAfterShow() {
            if ($data.IsNewProduct) priceElement.focus();
            else productElement.focus();
        }

        $data.Save = function () {
            var hasError: boolean = false;
            var key: string;
            var frm: FormData;

            if (isNaN($data.Object.ProductId) || $data.Object.ProductId == 0) {
                $data.Class.ProductId = $args.ClassError;
                hasError = true;
            }
            else $data.Class.ProductId = $args.ClassOk;

            if (isNaN($data.Object.Count) || $data.Object.Count < 0) {
                $data.Class.Count = $args.ClassError;
                hasError = true;
            }
            else $data.Class.Count = $args.ClassOk;

            if (isNaN($data.Object.Price) || $data.Object.Price <= 0) {
                $data.Class.Price = $args.ClassError;
                hasError = true;
            }
            else $data.Class.Price = $args.ClassOk;

            $worker.refresh('Class');

            if (!hasError) {
                frm = new FormData();

                for (var key in $data.Object) frm.append(key, $data.Object[key]);

                $wait.set(true);

                $http.post($args.Url + 'Inventory/Save', frm).then(
                    function (data: IWebResult<IInventoryObject>) {
                        $wait.set(false);

                        if ($http.hasError(data)) {
                            $args.ShowError($http.getError(data), 'Fallo al guardar el inventario');
                        }
                        else {
                            data.Result.Time = new Date(parseInt((<any>data.Result.Time).substr(6)));
                            $args.Event.invoke('newInventory', [data.Result]);
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

        $data.CreateProduct = function (element: HTMLElement) {
            productElement = element;
        };
        $data.CreatePrice = function (element: HTMLElement) {
            priceElement = element;
        };

        $data.IsNew = function (): boolean {
            return $data.Object.Id == 0;
        }

        fnInstance();
    }
    //#endregion

    //#region Instance
    addController({
        name: 'Inventory',
        controller: InventoryController,
        params: {
            services: ['modal','wait','http','csv']
        }
    });
    addController({
        name: 'InventoryModal',
        controller: InventoryModalController,
        params: {
            services: ['modal', 'http', 'wait']
        }
    });
    //#endregion

}