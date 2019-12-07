namespace WorkerDOM {

    //#region Interfaces
    interface IReportData {
        Object: IReportObject;
        Visible: boolean;
        Table: any;
        Args: IMainIndexArgs;

        OnFilter();

        DateToString(value: Date);
    }
    interface IReportTableData {
        Table: any;

        DateToISOString(value: Date);
        DateToString(value: Date);
        ProductName(value: any);
        ToMoney(value: number): string;
        Earning(value: any): string;
    }
    interface IReportObject {
        Id: string;
        StartTime: Date;
        EndTime: Date;
    }
    //#endregion

    //#region Main
    function ReportController($data: IReportData, $worker: IViewWorker, $services: IReadOnlyDictionary<any>, $params: Array<any>) {

        var $modal: IModalService = $services.get('modal');
        var $wait: IWaitService = $services.get('wait');
        var $http: IHttpService = $services.get('http');
        var $csv: ICsvService = $services.get('csv');
        var $args: IMainIndexArgs = $params[0];

        var filterId = null;

        function fnInstance() {
            $args.PanelContainer['Report'] = fnSetVisible;

            $data.Visible = false;
            $data.Object = { Id: 'Producto', StartTime: new Date(), EndTime: new Date() };
            $data.Args = $args;

            $data.DateToString = $args.DateToString;
        }
        function fnSetVisible(value: boolean) {
            $data.Visible = value;
            $worker.refresh('Visible');

            if (value === true) {
                if ($data.Table == null) fnRefreshItems();
            }
        }
        function fnRefreshItems() {
            var frm: FormData = new FormData();
            var key: string;

            frm.append('Id', $data.Object.Id);
            frm.append('StartTime', <any>$data.Object.StartTime.getTime());
            frm.append('EndTime', <any>$data.Object.EndTime.getTime());

            $wait.set(true);

            $http.post($args.Url + 'Report/List', frm).then(
                function (data: any) {
                    if ($http.hasError(data)) {
                        $args.ShowError($http.getError(data), 'Fallo al obtener la data del reporte');
                        $data.Visible = false;
                        $worker.refresh('Visible');
                    }
                    else {
                        $csv.split(data, $data);
                        $args.Event.invoke('afterReportLoad', [$data.Table]);
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

        $data.OnFilter = function () {
            if (filterId) clearTimeout(filterId);

            filterId = setTimeout(fnRefreshItems, 500);
        }

        fnInstance();
    }
    //#endregion

    //#region Table
    function ReportTableController($data: IReportTableData, $worker: IViewWorker, $services: IReadOnlyDictionary<any>, $params: Array<any>) {

        var $args: IMainIndexArgs = $params[0];

        function fnInstance() {
            $data.ToMoney = $args.ToMoney;
            $data.DateToISOString = $args.DateToISOString;
            $data.DateToString = $args.DateToString;

            $data.Table = {
                Headers: [],
                Items: []
            };

            $worker.setEventListener('afterReportLoad', fnRefreshItems, $args.Event);
        }
        function fnRefreshItems(value: any) {
            $data.Table = value;
            $worker.create();
        }

        $data.ProductName = function (value: any) {
            value.ProductId = value.Producto;
            return $args.ProductName(value);
        }
        $data.Earning = function (value: any) {
            return $args.ToMoney(value.Venta - value.Compra);
        }

        fnInstance();
    }
    //#endregion

    //#region Instance
    addController({
        name: 'Report',
        controller: ReportController,
        params: {
            services: ['modal','wait','http','csv']
        }
    });
    addController({
        name: 'ReportTable',
        controller: ReportTableController,
        params: {
            autoCreate: false,
            services: []
        }
    });
    //#endregion

}