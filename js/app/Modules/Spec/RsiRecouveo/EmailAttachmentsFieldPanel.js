
Ext.define('Optima5.Modules.Spec.RsiRecouveo.EmailAttachmentsFieldPanel',{
	extend:'Ext.panel.Panel',
	
	mixins: ['Ext.form.field.Field'],
	
	extend:'Ext.panel.Panel',
	
	newTitle: 'Saisie nouveau',
	fieldLabel: 'textfield',
	fieldXtype: 'textfield',
	filterAdrType: '',
	
    store: null,
	height: 150,
	border: false,
	
    initComponent: function() {



        var store = Ext.create('Ext.data.Store', {
            fields: ['name', 'size', 'file', 'status','mediaId']
        });



		Ext.apply(this,{
			layout: 'fit',
			items: [{
                multiSelect: true,
                xtype: 'grid',
                id: 'UploadGrid',
                columns: [{
                    header: 'Name',
                    dataIndex: 'name',
                    flex: 2
                }, {
                    header: 'Size',
                    dataIndex: 'size',
                    flex: 1,
                    renderer: Ext.util.Format.fileSize
                }, {
                    header: 'Status',
                    dataIndex: 'status',
                    flex: 1,
                    renderer: this.rendererStatus
                }],

                viewConfig: {
                    emptyText: 'Drop Files Here',
                    deferEmptyText: false
                },
                store: store,

                listeners: {

                    drop: {
                        element: 'el',
                        fn: 'drop'
                    },

                    dragstart: {
                        element: 'el',
                        fn: 'addDropZone'
                    },

                    dragenter: {
                        element: 'el',
                        fn: 'addDropZone'
                    },

                    dragover: {
                        element: 'el',
                        fn: 'addDropZone'
                    },

                    dragleave: {
                        element: 'el',
                        fn: 'removeDropZone'
                    },

                    dragexit: {
                        element: 'el',
                        fn: 'removeDropZone'
                    },

                },

                noop: function(e) {
                    e.stopEvent();
                },

                addDropZone: function(e) {
                    if (!e.browserEvent.dataTransfer || Ext.Array.from(e.browserEvent.dataTransfer.types).indexOf('Files') === -1) {
                        return;
                    }

                    e.stopEvent();

                    this.addCls('drag-over');
                },

                removeDropZone: function(e) {
                    var el = e.getTarget(),
                        thisEl = this.getEl();

                    e.stopEvent();


                    if (el === thisEl.dom) {
                        this.removeCls('drag-over');
                        return;
                    }

                    while (el !== thisEl.dom && el && el.parentNode) {
                        el = el.parentNode;
                    }

                    if (el !== thisEl.dom) {
                        this.removeCls('drag-over');
                    }

                },

                drop: function(e) {
                    e.stopEvent();
                    Ext.Array.forEach(Ext.Array.from(e.browserEvent.dataTransfer.files), function(file) {
                        store.add({
                            file: file,
                            name: file.name,
                            size: file.size,
                            status: 'Ready'

                        });
                    });
                    
                },

                tbar: [{    
                    text: "Selectionner un fichier",
                    /*
                    handler: function() {
                        this.addSelectedFiles();
                    },
                    scope: this
                    */
                    menu: [{
                    xtype: 'form',
                    dock: 'top',
                    frame: true,
                    defaults: {
                            anchor: '100%',
                            allowBlank: false,
                            msgTarget: 'side',
                            labelWidth: 50
                    },
                    //bodyPadding: '0 0 0 0',
                    items: [{
                        xtype: 'filefield',
                        width: 450,
                        emptyText: 'Selectionnez un fichier',
                        fieldLabel: 'Fichier',
                        name: 'file-filename',
                        buttonText: '',
                    },
                    {
                        xtype: 'button',
                        text: 'Ajouter',
                        handler: function(){
                            this.handleUpload(store);
                        },
                        scope: this

                    }]
                   }]
                },

                {
                    text: "Upload",
                    handler: function() {
                        for (var i = 0; i < store.data.items.length; i++) {
                            if (!(store.getData().getAt(i).data.status === "Uploaded")) {
                                store.getData().getAt(i).data.status = "Uploading";
                                store.getData().getAt(i).commit();
                                
                                this.doUpload(store, i);
                            }
                        }

                    },
                    scope: this

                }, {
                    text: "Tout supprimer",
                    handler: function() {
                        store.reload();
                    }
                }, {
                    text: "Supprimer les uploads",
                    handler: function() {
                        for (var i = 0; i < store.data.items.length; i++) {
                            var record = store.getData().getAt(i);
                            if ((record.data.status === "Uploaded")) {
                                store.remove(record);
                                i--;
                            }
                        }
                    }
                }, {
                    text: "Supprimer les fichiers choisis",
                    handler: function() {
                        store.remove(Ext.getCmp('UploadGrid').getSelection());
                    }
                }
                ]


            }]
		});
		this.callParent() ;
	},

    handleUpload: function(store) {
        var formPanelCnt = this.down('menu'),
            formPanel = formPanelCnt.down('form'),
            form = formPanel.getForm() ;
        if(form.isValid()){

            var ajaxParams = this.optimaModule.getConfiguredAjaxParams() ;
            Ext.apply( ajaxParams, {
                _moduleId: 'spec_rsi_recouveo',
                _action: 'mail_uploadEmailAttachment'
            }) ;
            var msgbox = Ext.Msg.wait('Uploading document...');
            form.submit({

                url: Optima5.Helper.getApplication().desktopGetBackendUrl(),

                params: ajaxParams,
                success : function(form,action){

                    msgbox.close() ;
                    Ext.menu.Manager.hideAll();
                    var ajaxData = Ext.JSON.decode(action.response.responseText).data ;

                    store.add({
                        file: ajaxData.path,
                        name: ajaxData.filename,
                        size: ajaxData.size,
                        status: 'Uploaded',
                        mediaId: ajaxData.mediaId

                    });
                    console.dir(store.getData());
                },
                failure: function(form, action) {


                    msgbox.close() ;
                    var msg = 'Erreur' ;
                    if( action.response.responseText ) {
                        msg = Ext.JSON.decode(action.response.responseText).error ;
                    }
                    Ext.Msg.alert('Erreur',msg) ;
                },
                scope: this
            });
        }

    },
    rendererStatus: function(value, metaData, record, rowIndex, colIndex, store) {
        var color = "grey";
        if (value === "Ready") {
            color = "blue";
        } else if (value === "Uploading") {
            color = "orange";
        } else if (value === "Uploaded") {
            color = "green";
        } else if (value === "Error") {
            color = "red";
        }
        metaData.tdStyle = 'color:' + color + ";";
        return value;
    },

    doUpload: function(store, i) {

        var fd = new FormData();
        Ext.Object.each( this.optimaModule.getConfiguredAjaxParams(), function(k,v) {
            fd.append(k,v) ;
        } ) ;

        fd.append("_moduleId",'spec_rsi_recouveo');
        fd.append("_action",'doc_uploadFile');


        fd.append('file', store.getData().getAt(i).data.file);

        var xhr = new XMLHttpRequest();
       
        xhr.open("POST", Optima5.Helper.getApplication().desktopGetBackendUrl(), true);
        
       

        xhr.setRequestHeader("serverTimeDiff", 0);

        xhr.onreadystatechange = function() {

            if (xhr.readyState == 4 && xhr.status == 200) {

      
                //handle the answer, in order to detect any server side error
                if (Ext.decode(xhr.responseText).success) {

                    store.getData().getAt(i).data.status = "Uploaded";
                    store.getData().getAt(i).data.mediaId = Ext.decode(xhr.responseText).data;
                } else {
                    store.getData().getAt(i).data.status = "Error";

                }
                store.getData().getAt(i).commit();
            } else if (xhr.readyState == 4 && xhr.status == 404) {

                store.getData().getAt(i).data.status = "Error";
                store.getData().getAt(i).commit();
            }
        };
        
       // Initiate a multipart/form-data upload
        xhr.send(fd);
        console.dir(store.getData());

    },

	handleView: function(gridrecord) {
		this.optimaModule.createWindow({
			width:1200,
			height:800,
			resizable:true,
			maximizable:false,
			layout:'fit',
			items:[Ext.create('Optima5.Modules.Spec.RsiRecouveo.EnvDocPreviewPanel',{
				optimaModule: this.optimaModule,
				_mediaId: gridrecord.getId()
			})]
		}) ;
	},
	
    doUploadBySelection: function() {

    }
}) ;


/*
Ext.define('Optima5.Modules.Spec.RsiRecouveo.AttachmentsFieldPanel',{
    extend:'Ext.panel.Panel',
    
    mixins: ['Ext.form.field.Field'],
    
    extend:'Ext.panel.Panel',
    
    newTitle: 'Saisie nouveau',
    fieldLabel: 'textfield',
    fieldXtype: 'textfield',
    filterAdrType: '',
    
    store: null,
    
    height: 150,
    border: false,
    
    initComponent: function() {
        this.store = Ext.create('Ext.data.Store',{
            model: 'RsiRecouveoEnvelopeDocumentModel',
            data: [],
            filters: [{
                property: 'is_deleted',
                operator:'eq',
                value: false
            }],
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json'
                }
            }
        }) ;
        Ext.apply(this,{
            layout: 'border',
            items: [{
                itemId: 'pNorth',
                region: 'north',
                bodyCls: 'ux-noframe-bg',
                bodyPadding: 8,
                height: 140,
                title: this.newTitle,
                collapsible: true,
                collapsed: true,
                xtype: 'panel',
                floatable: false,
                layout: 'fit',
                items: [{
                    xtype: 'form',
                    border: false,
                    bodyCls: 'ux-noframe-bg',
                    layout: 'anchor',
                    items: [{
                        anchor: '100%',
                        fieldLabel: 'Description',
                        xtype: 'textfield',
                        name: 'doc_desc',
                        allowBlank: false
                    },{
                        anchor: '100%',
                        xtype: 'filefield',
                        emptyText: 'Choisir fichier local',
                        fieldLabel: 'Fichier',
                        name: 'doc_src',
                        buttonText: '',
                        buttonConfig: {
                            iconCls: 'upload-icon'
                        },
                        allowBlank: false
                    }],
                    buttons: [{
                        xtype: 'button',
                        text: 'OK',
                        handler: function( btn ) {
                            this.handleUpload() ;
                        },
                        scope: this
                    }]
                }]
            },{
                region: 'center',
                flex: 1,
                xtype: 'grid',
                store: this.store,
                columns: [{
                    align: 'center',
                    xtype:'actioncolumn',
                    width:60,
                    disabledCls: 'x-item-invisible',
                    items: [{
                        icon: 'images/op5img/ico_delete_16.gif',
                        tooltip: 'Effacer',
                        handler: function(grid, rowIndex, colIndex, item, e) {
                            var rec = grid.getStore().getAt(rowIndex);
                            this.handleDelete(rec) ;
                        },
                        scope: this,
                        disabledCls: 'x-item-invisible',
                        isDisabled: function(view,rowIndex,colIndex,item,record ) {
                            return false ;
                        }
                    },{
                        icon: 'images/modules/rsiveo-edit-16.gif',
                        tooltip: 'Visualisation',
                        handler: function(grid, rowIndex, colIndex, item, e) {
                            var rec = grid.getStore().getAt(rowIndex);
                            this.handleView(rec) ;
                        },
                        scope: this,
                        disabledCls: 'x-item-invisible',
                        isDisabled: function(view,rowIndex,colIndex,item,record ) {
                            return false ;
                        }
                    }]
                },{
                    text: 'Description',
                    dataIndex: 'doc_desc',
                    flex: 1,
                    menuDisabled: true,
                    sortable: false,
                    renderer: function(value) {
                        return Ext.util.Format.nl2br( Ext.String.htmlEncode( value ) ) ;
                    }
                },{
                    text: 'Pages',
                    dataIndex: 'doc_pagecount',
                    width: 48,
                    menuDisabled: true,
                    sortable: false,
                    renderer: function(value) {
                        return Ext.util.Format.nl2br( Ext.String.htmlEncode( value ) ) ;
                    }
                }]
            }]
        });
        this.callParent() ;
    },
    handleDelete: function(gridrecord) {
        // remote delete tmp + local store delete
        var mediaId = gridrecord.getId() ;
        Ext.Msg.confirm('Suppression','Supprimer pièce jointe '+gridrecord.get('doc_desc')+' ?',function(btn) {
            if( btn=='yes' ) {
                this.doDelete(mediaId) ;
            }
        },this) ;
    },
    doDelete: function(mediaId) {
        this.optimaModule.getConfiguredAjaxConnection().request({
            params: {
                _moduleId: 'spec_rsi_recouveo',
                _action: 'doc_delete',
                envdoc_media_id: Ext.JSON.encode([mediaId])
            },
            success: function(response) {
                if( Ext.JSON.decode(response.responseText).success ) {
                    this.store.remove( this.store.getById(mediaId) ) ;
                }
            },
            scope: this
        }) ;
    },
    doDeleteAll: function() {
        var arrMediaIds = [] ;
        this.store.each(function(gridrecord) {
            if( gridrecord.get('envdoc_filerecord_id') ) {
                return ;
            }
            arrMediaIds.push( gridrecord.getId() ) ;
        }) ;
        this.optimaModule.getConfiguredAjaxConnection().request({
            params: {
                _moduleId: 'spec_rsi_recouveo',
                _action: 'doc_delete',
                envdoc_media_id: Ext.JSON.encode(arrMediaIds)
            },
            success: function(response) {
                if( Ext.JSON.decode(response.responseText).success ) {
                    this.store.removeAll() ;
                }
            },
            scope: this
        }) ;
    },
    handleView: function(gridrecord) {
        this.optimaModule.createWindow({
            width:1200,
            height:800,
            resizable:true,
            maximizable:false,
            layout:'fit',
            items:[Ext.create('Optima5.Modules.Spec.RsiRecouveo.EnvDocPreviewPanel',{
                optimaModule: this.optimaModule,
                _mediaId: gridrecord.getId()
            })]
        }) ;
    },
    
    handleUpload: function() {
        var formPanelCnt = this.down('#pNorth'),
            formPanel = formPanelCnt.down('form'),
            form = formPanel.getForm() ;
        if(form.isValid()){
            console.log("is valid");
            var ajaxParams = this.optimaModule.getConfiguredAjaxParams() ;
            Ext.apply( ajaxParams, {
                _moduleId: 'spec_rsi_recouveo',
                _action: 'doc_uploadFile'
            }) ;
            console.dir(this.optimaModule.getConfiguredAjaxParams());
            var msgbox = Ext.Msg.wait('Uploading document...');
            form.submit({

                url: Optima5.Helper.getApplication().desktopGetBackendUrl(),

                params: ajaxParams,
                success : function(form,action){
                    console.log("success");
                    msgbox.close() ;
                    Ext.menu.Manager.hideAll();
                    var ajaxData = Ext.JSON.decode(action.response.responseText).data ;
                    this.onAfterUpload( ajaxData ) ;
                },
                failure: function(form, action) {
                    console.log("failure");
                    console.log(Optima5.Helper.getApplication().desktopGetBackendUrl());
                    msgbox.close() ;
                    var msg = 'Erreur' ;
                    if( action.response.responseText ) {
                        msg = Ext.JSON.decode(action.response.responseText).error ;
                    }
                    Ext.Msg.alert('Erreur',msg) ;
                },
                scope: this
            });
        }
    },
    onAfterUpload: function( recordData ) {
        var formPanelCnt = this.down('#pNorth'),
            formPanel = formPanelCnt.down('form'),
            form = formPanel.getForm() ;
        form.reset() ;
        formPanelCnt.collapse() ;
              
        this.store.add(recordData) ;
    },
    
    
    getValue: function() {
        var data = [] ;
        this.store.each(function(gridrecord) {
            data.push( gridrecord.getData() ) ;
        }) ;
        return data ;
    },
    getSubmitData: function() {
        var retObj = {} ;
        retObj[this.getName()] = Ext.JSON.encode(this.getValue()) ;
        return retObj ;
    }
}) ;
*/
