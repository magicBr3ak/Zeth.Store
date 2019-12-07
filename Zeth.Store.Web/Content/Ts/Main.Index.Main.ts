namespace WorkerDOM {

    //#region Interfaces
    export interface IWebResult<T> {
        HasError: boolean;
        ErrorMessage: string;
        ErrorId: string;
        Result: T;
    }
    interface IMainData {
        Args: IMainIndexArgs;

        Open(element: HTMLElement);
        Logout();
        Refresh();

        CreateIcon(element: HTMLElement);
    }
    export interface IMainIndexArgs {
        LoginUrl: string,
        Url: string,
        ClassOk: string,
        ClassError: string,

        Event: IEventService;
        PanelContainer: any;
        Product: ICsvParseResult<IProductObject>;
        Inventory: ICsvParseResult<IInventoryObject>;

        ModalProduct(item: IProductObject);
        ModalInventory(item: IInventoryObject);

        ShowError(msg: string, title?: string);
        ShowText(msg: string, title?: string);
        ShowConfirm(msg: string, callback: Function, title?: string);

        DateToISOString(value: Date): string;
        DateToString(value: any): any;
        ProductName(value: any): string;
        ToMoney(value: any): any;
        DetailPrice(item: IProductObject, detail: IProductDetailObject): string;
    }
    //#endregion

    //#region Main
    function MainController($data: IMainData, $worker: IViewWorker, $services: IReadOnlyDictionary<any>) {

        var $modal: IModalService = $services.get('modal');
        var $wait: IWaitService = $services.get('wait');
        var $http: IHttpService = $services.get('http');
        var $event: IEventService = $services.get('event');
        var $csv: ICsvService = $services.get('csv');
        var $args: IMainIndexArgs = {
            LoginUrl: (<HTMLInputElement>document.getElementById('loginUrl')).value,
            Url: (<HTMLInputElement>document.getElementById('url')).value,
            ClassOk: 'frm-row',
            ClassError: 'frm-row state-error',
            ShowError: fnShowError,
            ShowText: fnShowText,
            ShowConfirm: fnShowConfirm,
            DateToISOString: fnDateToISOSTring,
            DateToString: fnDateToString,
            ProductName: fnProductName,
            ToMoney: fnToMoney,
            Event: $event,
            PanelContainer: {},
            Product: { Items: [], Headers: [] },
            ModalProduct: null,
            Inventory: { Items: [], Headers: [] },
            ModalInventory: null,
            DetailPrice: null
        }

        var mdMsgWorker: IModalWorker;
        var mdMsgData: IMessageBoxData;
        var iconContainer: any = {};
        var refreshId = null;
        var constant = 60000;

        function fnInstance() {
            $data.Args = $args;

            fnRefreshProducts();

            $worker.setEventListener('afterCreate', fnAfterCreate);
        }
        function fnInstanceMessage() {
            if (mdMsgWorker == null) {
                mdMsgData = <IMessageBoxData>{};
                mdMsgWorker = $modal.create('MessageBox', [mdMsgData]);
            }
        }
        function fnShowMessage(msg: string, title: string) {
            fnInstanceMessage();

            mdMsgData.Callback = null;
            mdMsgData.HasCancel = false;
            mdMsgData.Message = msg;
            mdMsgData.Title = title;

            mdMsgWorker.show();
        }
        function fnShowError(msg: string, title?: string) {
            fnShowMessage(msg, title ? title : 'Error del Sistema');
        }
        function fnShowText(msg: string, title?: string) {
            fnShowMessage(msg, title ? title : 'Mensaje del Sistema');
        }
        function fnShowConfirm(msg: string, callback: Function, title?: string) {
            fnInstanceMessage();

            mdMsgData.Callback = callback;
            mdMsgData.HasCancel = true;
            mdMsgData.Message = msg;
            mdMsgData.Title = title ? title : 'Confirmación';

            mdMsgWorker.show();
        }
        function fnDateToISOSTring(value: Date): string {
            if (value == null) return '';
            else return (value.getDate() > 9 ? value.getDate() : '0' + value.getDate()) + '/' +
                (value.getMonth() > 8 ? (value.getMonth() + 1) : '0' + (value.getMonth() + 1)) + '/' +
                value.getFullYear() + ' - ' + (value.getHours() > 9 ? value.getHours() : '0' + value.getHours()) + ':' +
                (value.getMinutes() > 9 ? value.getMinutes() : '0' + value.getMinutes());
        }
        function fnDateToString(value: any): any {
            if (value == null) return '';
            else if (value.getDate) {
                return (value.getDate() > 9 ? value.getDate() : '0' + value.getDate()) + '/' +
                    (value.getMonth() > 8 ? (value.getMonth() + 1) : '0' + (value.getMonth() + 1)) + '/' +
                    value.getFullYear();
            }
            else if (typeof (value) == 'string') {
                try {
                    value = value.split('/');

                    if (value.length != 3 || isNaN(value[0]) || isNaN(value[1]) || isNaN(value[2])) return null;

                    return new Date(+value[2], +value[1] - 1, +value[0]);
                }
                catch (e) {
                    return null;
                }
            }
            else return '';
        }
        function fnProductName(item: any) {
            if ($args.Product == null) return '';

            if (item.ProductName == null || item.ProductName.trim() == '') {
                var Items: Array<IProductObject> = $args.Product.Items;

                item.ProductName = '';

                for (var i = 0; i < Items.length; i++) {
                    if (Items[i].Id == item.ProductId) {
                        item.ProductName = Items[i].Name;
                        break;
                    }
                }
            }

            return item.ProductName;
        }
        function fnToMoney(value: any) {
            if (value == null) return null;

            if (typeof (value) == 'string') {
                return (+value);
            }
            else if (typeof (value) == 'number') {
                return isNaN(value) ? '' : (+value).toFixed(2);
            }

            return value;
        }
        function fnAfterCreate() {
            var key: string = window.localStorage.getItem('currentPanel');

            if (key && iconContainer[key]) $data.Open(iconContainer[key]);
            else if (iconContainer.Product) $data.Open(iconContainer.Product);

            $wait.set(false);

            refreshId = setTimeout(fnAutoRefresh, constant * 15);
        }
        function fnAutoRefresh() {
            var lastTime: Date = $http.sendLog.time;
            var currentTime: Date = new Date();

            if ((currentTime.getTime() - lastTime.getTime()) > constant * 5) {
                fnRefreshProducts();
                refreshId = setTimeout(fnAutoRefresh, constant * 15);
            }
            else {
                refreshId = setTimeout(fnAutoRefresh, constant);
            }
        }
        function fnRefreshProducts() {
            var csvData: any = {};

            $wait.set(true);

            $http.post($args.Url + 'Product/List').then(
                function (data: any) {
                    if ($http.hasError(data)) {
                        $args.ShowError($http.getError(data), 'Fallo al obtener la data de productos');
                        $wait.set(false);
                    }
                    else {
                        $csv.split(data, csvData);

                        fnLoadDetails(csvData);

                        $args.Product = csvData.Table;

                        if ($worker.created == false) $worker.create();
                        else $wait.set(false);
                    }
                },
                function (error: Error) {
                    $args.ShowError(error.message);
                    $wait.set(false);
                });
        }
        function fnLoadDetails(container: any) {
            var items: Array<IProductObject> = container.Table.Items;
            var details: Array<IProductDetailObject> = container.DetailTable.Items.slice(0);
            var item: IProductObject;
            var detail: IProductDetailObject;
            var i: number = 0;

            if (details.length > 0) {
                detail = details.shift();

                while (details.length > 0 || detail != null) {
                    item = items[i];
                    item.Items = [];

                    while (detail != null && detail.ProductId == item.Id) {
                        item.Items.push(detail);
                        detail = details.shift();
                    }

                    i++;
                }
            }
        }

        $data.Open = function (element: HTMLElement) {
            var dataAttr: string = element.getAttribute('w-data');
            var key: string;
            if (dataAttr) {
                for (var key in $args.PanelContainer) {
                    $args.PanelContainer[key].call(null, false);
                }
                if ($args.PanelContainer[dataAttr]) {
                    window.localStorage.setItem('currentPanel', dataAttr);
                    $args.PanelContainer[dataAttr].call(null, true);
                }

                for (key in iconContainer) iconContainer[key].style.backgroundColor = '#4267b2';

                element.style.backgroundColor = '#35528c';
            }
        };
        $data.Logout = function () {
            fnShowConfirm('Esta seguro de cerrar sesión?', function (value: boolean) {
                if (value == true) {
                    $wait.set(true);

                    $http.post($args.Url + 'Auth/ClearToken').then(
                        function (data: string) {
                            if ($http.hasError(data)) {
                                $wait.set(false);
                                $args.ShowError($http.getError(data), 'Fallo al iniciar sesión');
                            }
                            else {
                                window.location.href = $args.LoginUrl;
                            }
                        },
                        function (error: Error) {
                            $wait.set(false);
                            $args.ShowError(error.message);
                        });
                }
            });
        };
        $data.Refresh = function () {
            window.location = window.location;
        };

        $data.CreateIcon = function (element: HTMLElement) {
            var dataAttr: string = element.getAttribute('w-data');

            iconContainer[dataAttr] = element;
        };

        fnInstance();
    }
    //#endregion

    //#region Instance
    addController({
        name: 'Main',
        controller: MainController,
        params: {
            autoCreate: false,
            services: ['modal', 'event', 'wait', 'http', 'csv']
        }
    });
    //#endregion

}