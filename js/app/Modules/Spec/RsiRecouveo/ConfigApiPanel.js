Ext.define('RsiRecouveoEdiApiKeyModel', {
	extend: 'Ext.data.Model',
	idProperty: 'apikey_code',
	fields: [
		{name: 'apikey_code',  type: 'string'},
		{name: 'apikey_date',   type: 'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'apikey_hex',   type: 'string'}
	]
});



Ext.define('RsiRecouveoEdiApiLogResult', {
    extend: 'Ext.data.Model',
    idProperty: 'apikey_name',
    fields: [
        {name: 'apilog_keycode',  type: 'string'},
        {name: 'apilog_date',  type: 'date', dateFormat:'Y-m-d H:i:s'},
        {name: 'apilog_method',   type: 'string'},
        {name: 'apilog_success',   type: 'boolean'},
        {name: 'apilog_count',   type: 'int'}
    ]
});




Ext.define('Optima5.Modules.Spec.RsiRecouveo.ConfigApiPanel',{
	extend: 'Ext.tab.Panel',
	requires: [],
	
	tabPosition: 'left',
	tabRotation: 0,
	
	initComponent: function() {
		Ext.apply(this,{
            items:[{
                xtype:'panel',
                title:'API Key',
					layout: {
						type: 'hbox',
						align:'stretch'
					},
                items:[{
                            xtype:'grid',
									itemId: 'keysGrid',
                            layout:'fit',
                            flex:1,


									viewConfig: {
										enableTextSelection: true
									},
									listeners: {
										itemcontextmenu: this.onKeysGridContextMenu,
										scope: this
									},
                            store: {
                                model: 'RsiRecouveoEdiApiKeyModel',
											proxy: this.optimaModule.getConfiguredAjaxProxy({
												extraParams : {
													_moduleId: 'spec_rsi_recouveo',
													_action: 'edi_getApiKeys',
												},
												reader: {
													type: 'json',
													rootProperty: 'data',
												}
											}),
											autoLoad: true
                                    },
                                            columns: [

                                                {
                                                    text: 'Key Name',
                                                    dataIndex: 'apikey_code',
                                                    width: 150,

                                                },
                                                {   text: 'Created',
                                                    dataIndex: 'apikey_date',
                                                    width: 150,
																	renderer: Ext.util.Format.dateRenderer('d/m/Y H:i'),
                                                },
                                                {   text: 'Key string',
                                                    dataIndex: 'apikey_hex',
                                                    width: 300

                                                }

                                                ],




                                    }, {
                                            xtype:'form',
															itemId: 'keysForm',
                                                        border: 2,
                                                        bodyPadding: 10,
                                                        bodyCls: 'ux-noframe-bg',
                                            width:300,
                                            title:'Create API',
                                            collapsible:true,
                                            collapseDirection: 'right',
                                            layout:'anchor',
                                                        fieldDefaults: {
																			  labelAlign: 'top',
                                                            labelWidth: 150,
                                                            anchor: '100%'
                                                        },
                                            items: [{
                                                //padding:10,
															  allowBlank: false,
                                                xtype: 'textfield',
                                                fieldLabel: 'Code',
                                                labelClsExtra:'op5-spec-rsiveo-formapi-textfieldlabel',
                                                name: 'apikey_code',
																anchor: '50%'
                                            },{
                                               //padding:10,
                                                xtype: 'textfield',
                                                fieldLabel: 'Code',
                                                labelClsExtra:'op5-spec-rsiveo-formapi-textfieldlabel',
                                                name: 'apikey_hex'
                                            },{
                                                xtype: 'button',
                                                text: 'Create key',
                                                margin: "20 10 0 10",
																handler: this.handleCreateKey,
                                                scope: this
                                              }],
                                         }]
                  
                            },{
                                xtype:'grid',
                                layout:'fit',
                                title:'Log Result',
                                width:700,
                                cls:'op5-spec-rsiveo-formapi',
                                flex:1.5,


                store: {
                                model: 'RsiRecouveoEdiApiLogResult',
                                proxy: this.optimaModule.getConfiguredAjaxProxy({
                                    extraParams : {
                                        _moduleId: 'spec_rsi_recouveo',
                                        _action: 'edi_getApiLogResult',
                                    },
                                    reader: {
                                        type: 'json',
                                        rootProperty: 'data',
                                    }
                                }),
                                autoLoad: true
                        },
                                columns: [

                                    {
                                        text: 'Key Name',
                                        dataIndex: 'apilog_keycode',
                                        width: 150

                                    },
                                    {   text: 'Date',
                                        dataIndex: 'apilog_date',
                                        width: 150

                                    },
                                    {   text: 'Method',
                                        dataIndex: 'apilog_method',
                                        width: 120

                                    },
                                    {   text: 'Ok ?',
                                        dataIndex: 'apilog_success',
                                        width: 100

                                    },
                                    {   text: 'Count(records)',
                                        dataIndex: 'apilog_count',
                                        width: 150
                                    }


                                ]
                     }]



        });
		this.callParent() ;

	},
	
	
	doLoadList: function() {
		//ajaxRequest,


        // callback : onLoadList
	},
	onLoadList: function( ajaxData ) {
		// rework the data
		
		// push array of data to the grid


	},
	
	
	handleCreateKey: function() {
		var keysForm = this.down('#keysForm'),
			hexField = keysForm.getForm().findField('apikey_hex'),
			hexValue = hexField.getValue() ;
		if( !Ext.isEmpty(hexValue) && hexValue.trim().length==0 ) {
			hexField.reset() ;
			hexValue = '' ;
		}
		
		if( Ext.isEmpty(hexValue) ) {
			var hexStr = '' ;
			for( var i=0 ; i<32 ; i++ ) {
				var binStr = '' ;
				for( var j=0 ; j<4 ; j++ ) {
					binStr += Math.round(Math.random())
				}
				hexStr += parseInt(binStr, 2).toString(16).toUpperCase() ;
			}
			hexField.setValue(hexStr) ;
			return ;
		}
		
		// validate ?
		hexValue = hexValue.toUpperCase().trim() ;
		hexField.setValue(hexValue) ;
		
		if( !RegExp(/[0-9A-F]{32}/g).test(hexValue) ) {
			hexField.markInvalid('Format de la clé : 128-bit hexa') ;
			return ;
		}
		if( !keysForm.getForm().isValid() ) {
			return ;
		}
		
		//Ajax
		var formValues = keysForm.getForm().getValues() ;
        this.optimaModule.getConfiguredAjaxConnection().request({
            params: {
                _moduleId: 'spec_rsi_recouveo',
                _action: 'edi_createApiKey',
                data: Ext.JSON.encode(formValues)
            },
            success: function(response) {
                var ajaxResponse = Ext.decode(response.responseText) ;
                if( ajaxResponse.success == false ) {
                    Ext.MessageBox.alert('Error',ajaxResponse.error) ;
                    return ;
                }
                this.down('#keysForm').getForm().reset() ;
					 this.down('#keysGrid').getStore().load() ;
            },
            callback: function() {
            },
            scope: this
        }) ;
	},
	handleDeleteKey: function( keyCode, confirm=false ) {
		if( !confirm ) {
			var msg = 'Suppr. API Key "'+keyCode+'"' ;
			Ext.MessageBox.confirm('Attention',msg, function(btn) {
				if( btn=='yes') {
					this.handleDeleteKey(keyCode,true) ;
				}
			},this) ;
			return 
		}
		var formValues = {
			apikey_code: keyCode,
			_delete: true
		} ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
					_moduleId: 'spec_rsi_recouveo',
					_action: 'edi_createApiKey',
					data: Ext.JSON.encode(formValues)
			},
			success: function(response) {
					var ajaxResponse = Ext.decode(response.responseText) ;
					if( ajaxResponse.success == false ) {
						Ext.MessageBox.alert('Error','Error') ;
						return ;
					}
					this.down('#keysForm').getForm().reset() ;
					this.down('#keysGrid').getStore().load() ;
			},
			callback: function() {
			},
			scope: this
		}) ;
	},
	
	onKeysGridContextMenu: function(view, record, item, index, event) {
		var treeContextMenuItems = new Array() ;
		treeContextMenuItems.push({
			iconCls: 'icon-bible-delete',
			text: 'Suppr. API Key "'+record.get('apikey_code')+'"',
			handler : function() {
				this.handleDeleteKey(record.get('apikey_code')) ;
			},
			scope : this
		});
		var treeContextMenu = Ext.create('Ext.menu.Menu',{
			items : treeContextMenuItems,
			listeners: {
				hide: function(menu) {
					Ext.defer(function(){menu.destroy();},10) ;
				}
			}
		}) ;
		treeContextMenu.showAt(event.getXY());
	}
});
