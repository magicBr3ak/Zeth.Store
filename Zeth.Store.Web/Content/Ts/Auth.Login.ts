namespace WorkerDOM {

    //#region Interfaces
    interface IUserData {
        Username: string;
        Password: string;
    }
    interface IUserClass {
        Username: string;
        Password: string;
    }
    interface IMain {
        Object: IUserData;
        Class: IUserClass;
        Login();
    }
    interface IArgs {
        Url: string,
        MainUrl: string,
        ClassOk: string,
        ClassError: string,
        ShowError(Msg: string, Title?: string);
        ShowMessage(Msg: string, Title?: string);
        ShowConfirm(Msg: string, Callback: Function, Title?: string);
    }
    //#endregion

    //#region Main
    function MainController($data: IMain, $worker: IViewWorker, $services: IReadOnlyDictionary<any>) {

        var $modal: IModalService = $services.get('modal');
        var $http: IHttpService = $services.get('http');
        var $wait: IWaitService = $services.get('wait');
        var $args: IArgs = {
            Url: (<HTMLInputElement>document.getElementById('url')).value,
            MainUrl: (<HTMLInputElement>document.getElementById('mainUrl')).value,
            ClassOk: 'frm-row',
            ClassError: 'frm-row state-error',
            ShowError: function (Msg: string, Title?: string) {
                fnShowMessage(Msg, Title ? Title : 'Error del Sistema');
            },
            ShowMessage: function (Msg: string, Title?: string) {
                fnShowMessage(Msg, Title ? Title : 'Mensaje del Sistema');
            },
            ShowConfirm: function (Msg: string, Callback: Function, Title?: string) {
                fnInstanceMessage();

                mdMsgData.Callback = Callback;
                mdMsgData.HasCancel = true;
                mdMsgData.Message = Msg;
                mdMsgData.Title = Title ? Title : 'Confirmación';

                mdMsgWorker.show();
            }
        }

        var mdMsgWorker: IModalWorker;
        var mdMsgData: IMessageBoxData;

        function fnInstance() {
            $data.Object = { Username: '', Password: '' };
            $data.Class = { Username: $args.ClassOk, Password: $args.ClassOk };
        }
        function fnInstanceMessage() {
            if (mdMsgWorker == null) {
                mdMsgData = <IMessageBoxData>{};
                mdMsgWorker = $modal.create('MessageBox', [mdMsgData]);
            }
        }
        function fnShowMessage(Msg: string, Title: string) {
            fnInstanceMessage();

            mdMsgData.Callback = null;
            mdMsgData.HasCancel = false;
            mdMsgData.Message = Msg;
            mdMsgData.Title = Title;

            mdMsgWorker.show();
        }

        $data.Login = function () {
            var hasError: boolean = false;
            var key: string;
            var frm: FormData;

            if ($data.Object.Username.trim() == '') {
                $data.Class.Username = $args.ClassError;
                hasError = true;
            }
            else $data.Class.Username = $args.ClassOk;

            if ($data.Object.Password.trim() == '') {
                $data.Class.Password = $args.ClassError;
                hasError = true;
            }
            else $data.Class.Password = $args.ClassOk;

            $worker.refresh('Class');

            if (!hasError) {
                frm = new FormData();
                for (var key in $data.Object) frm.append(key, $data.Object[key]);

                $wait.set(true);

                $http.post($args.Url + 'Auth/GenerateToken', frm).then(
                    function (data: string) {
                        if ($http.hasError(data)) {
                            $args.ShowError($http.getError(data), 'Fallo al iniciar sesión');
                            $wait.set(false);
                        }
                        else {
                            window.location.href = $args.MainUrl;
                        }
                    },
                    function (error: Error) {
                        $args.ShowError(error.message);
                        $wait.set(false);
                    });
            }
        }

        fnInstance();
    }
    //#endregion

    //#region Instance
    addController({
        name: 'Main',
        controller: MainController,
        params: {
            services: ['modal','http','wait']
        }
    });
    //#endregion

}