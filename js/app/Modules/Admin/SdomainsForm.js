Ext.define('Optima5.Modules.Admin.SdomainsForm' ,{
	extend: 'Ext.panel.Panel',
			  
	requires: ['Ext.ux.dams.Icon48Picker','Optima5.Modules.Admin.CardHeader'] ,
			 
			  
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Admin:SdomainsForm','No module reference ?') ;
		}
		
		Ext.apply(me,{
			layout: 'card'
		});
		
		this.callParent() ;
		
		// console.dir( me.query('combobox') ) ;
		me.on('destroy',function() {
			if( me.loadMask ) {
				me.loadMask.destroy()
			}
		},me) ;
	},
	
	calcLayout: function() {
		var me = this ;
		var formAttributes = me.getComponent('mFormAttributes') ;
		formAttributes.query('#overwrite_msg')[0].setVisible( !formAttributes.getForm().findField('overwrite_is_locked').getValue() );
	},
	
	loadRecord: function( adminSdomainRecord ) {
		var me = this ;
		if( adminSdomainRecord != null ) {
			me.isNew = false ;
			me.sdomainId = adminSdomainRecord.getId() ;
		} else {
			me.isNew = true ;
		}
		
		
		var modules = [] , key , val ;
		var op5modulesLib = Optima5.Helper.getModulesLib() ;
		Ext.Array.each(op5modulesLib.modulesGetAll() , function(m) {
			if( m.get('moduleType') != 'sdomain' ) {
				return ;
			}
			// console.dir(m) ;
			key = m.getId() ;
			val = m.get('moduleId') + ' :: ' + m.get('moduleName') ;
			modules.push([key,val]);
		}); 
		
		var icons = {} , key, val ;
		var op5iconsLib = Optima5.Helper.getIconsLib() ;
		Ext.Array.each(op5iconsLib.iconsGetAll() , function(i) {
			key = i.getId() ;
			val = op5iconsLib.iconGetCls48( i.getId() )  ;
			icons[key] = val ;
		}); 
		
		
		var localComboSdomains = [] ;
		if( me.sdomainsStore ) {
			var localComboSdomains = [{id:'',txt:'- Local Sdomain -'}] ;
			me.sdomainsStore.each( function(sdomainRecord){
				if( sdomainRecord.get('sdomain_id') == me.sdomainId ) {
					return ;
				}
				localComboSdomains.push({
					id: sdomainRecord.get('sdomain_id'),
					txt: sdomainRecord.get('sdomain_id')+' :: '+sdomainRecord.get('sdomain_name')
				}) ;
			}) ;
		}
		
		
		var formAttributes = Ext.create('Ext.form.Panel',{
			itemId:'mFormAttributes',
			border: false,
			frame:false,
			bodyPadding: 10,
			bodyCls: 'ux-noframe-bg',
			defaults: {
				//anchor: '100%'
			},
			layout: 'anchor',
			fieldDefaults: {
				labelAlign: 'left',
				labelSeparator: ''
				//labelWidth: 125
			},
			tbar:[{
				iconCls:'op5-sdomains-menu-submit',
				text:'Save',
				handler: function() {
					me.saveRecord() ;
				},
				scope:me
			},{
				iconCls:'op5-sdomains-menu-actions',
				text:'Actions',
				hidden: me.isNew,
				menu:[{
					iconCls:'op5-sdomains-menu-updateschema',
					text:'Update schema',
					hidden : me.isNew,
					handler: function() {
						Ext.Msg.confirm('SQL update','Update SQL schema ?',function(btn) {
							if( btn=='yes' ) {
								me.doUpdateSchema() ;
							}
						},me) ;
					},
					scope:me
				},{
					iconCls:'op5-sdomains-menu-export',
					text:'Export / Dump',
					hidden : me.isNew,
					handler: function() {
						me.getLayout().setActiveItem('mCardExport') ;
					},
					scope:me
				},{
					iconCls:'op5-sdomains-menu-import',
					text:'Import (overwrite)',
					hidden : me.isNew || adminSdomainRecord.get('overwrite_is_locked'),
					handler: function() {
						me.getLayout().setActiveItem('mCardImport') ;
					},
					scope:me
				},{
					iconCls:'op5-sdomains-menu-delete',
					text:'Delete',
					hidden : me.isNew || adminSdomainRecord.get('overwrite_is_locked'),
					handler: function() {
						me.getLayout().setActiveItem('mCardDelete') ;
					},
					scope:me
				}]
			}],
			items:[{
				xtype:'textfield',
				name:'sdomain_id',
				fieldLabel:'Sdomain Code',
				width: 175,
				readOnly: me.isNew ? false : true,
				value: me.isNew ? null : adminSdomainRecord.get('sdomain_id_forDisplay')
			},{
				xtype: 'combobox',
				anchor:'100%',
				fieldLabel: 'Module Type',
				name: 'module_id',
				forceSelection: true,
				editable: false,
				store: modules,
				value: me.isNew ? null : adminSdomainRecord.get('module_id'),
				readOnly: !(me.isNew)
			},{
				xtype:'textfield',
				name:'sdomain_name',
				fieldLabel:'Sdomain Desc',
				anchor:'100%',
				value: me.isNew ? null : adminSdomainRecord.get('sdomain_name')
			},{
				xtype:'fieldset',
				title: 'Write protection',
				items:[{
					xtype:'checkboxfield',
					name:'overwrite_is_locked',
					fieldLabel:'Overwrite locked',
					inputValue:1,
					uncheckedValue:0,
					checked : me.isNew ? false : adminSdomainRecord.get('overwrite_is_locked')
				},{
					xtype:'component',
					itemId:'overwrite_msg',
					html:'Warning : open for restore/clone overwrite',
					style: 'color:#FF0000; font-weight:bold',
					padding: '0 0 5 10',
					hidden:true
				}]
			},{
				xtype:'damsicon48picker',
				store: icons,
				name:'icon_code',
				fieldLabel:'Desktop Icon',
				value: me.isNew ? null : adminSdomainRecord.get('icon_code')
			}]
		});
		formAttributes.getForm().getFields().each(function(field) {
			field.on('change',function(){
				me.calcLayout() ;
			},me) ;
		},me) ;
		
		
		var cardExport = Ext.create('Ext.panel.Panel',{
			itemId:'mCardExport',
			border: false,
			frame:false,
			bodyCls: 'ux-noframe-bg',
			bodyPadding: "0 10px",
			layout: {
				type: 'vbox',
				align: 'center'
			},
			tbar:[{
				iconCls:'op5-sdomains-menu-back',
				text:'Back',
				handler: function() {
					me.getLayout().setActiveItem('mFormAttributes') ;
				},
				scope:me
			}],
			items:[Ext.create('Optima5.Modules.Admin.CardHeader',{
				width:'100%',
				data:{
					iconCls:'op5-sdomains-icon-export',
					title: 'Export Sdomain',
					caption: 'Download sdomain as OP5 data file'
				}
			}),{
				xtype:'container',
				padding: "24 0 0 0",
				items:[{
					xtype: 'button',
					padding: '0 16px',
					scale: 'large',
					text: 'Download',
					handler: me.doExport,
					scope: me
				}]
			},{
			}]
		}) ;
		
		var cardImport = Ext.create('Ext.panel.Panel',{
			itemId:'mCardImport',
			border: false,
			frame:false,
			bodyCls: 'ux-noframe-bg',
			bodyPadding: "0 10px",
			layout: {
				type: 'vbox',
				align: 'center'
			},
			tbar:[{
				iconCls:'op5-sdomains-menu-back',
				text:'Back',
				handler: function() {
					me.getLayout().setActiveItem('mFormAttributes') ;
				},
				scope:me
			}],
			setMode: function( mode ) {
				this.getComponent('cUploadForm').setVisible( mode=='file' ) ;
				this.getComponent('cLocalForm').setVisible( mode=='local' ) ;
				this.getComponent('cRemoteForm').setVisible( mode=='remote' ) ;
			},
			items:[Ext.create('Optima5.Modules.Admin.CardHeader',{
				width:'100%',
				data:{
					iconCls:'op5-sdomains-icon-import',
					title: 'Import Sdomain',
					caption: 'Overwrite sdomain from OP5 data (file/remote)'
				}
			}),{
				xtype:'form',
				itemId:'cDummyForm',
				border: false,
				frame:false,
				bodyCls: 'ux-noframe-bg',
				padding: "0 0 0 0",
				width:'100%',
				layout:'anchor',
				fieldDefaults: {
					labelAlign: 'left',
					labelSeparator: '',
					labelWidth: 90
				},
				items: [{
					xtype: 'fieldset',
					width: '100%',
					title: 'Input source',
					items:[{
						xtype      : 'fieldcontainer',
						defaultType: 'radiofield',
						defaults: {
							flex: 1,
							listeners: {
								change: function( field, value ) {
									if( field.getName()=='import_mode' && value == true ) {
										// console.log('mode = '+field.inputValue) ;
										var cardImport = field.up('form').up() ;
										cardImport.setMode( field.inputValue ) ;
										return ;
									}
								},
								scope: me
							}
						},
						layout: 'hbox',
						items: [
							{
								boxLabel  : 'File upload',
								name      : 'import_mode',
								inputValue: 'file'
							}, {
								boxLabel  : 'Local Sdomain',
								name      : 'import_mode',
								inputValue: 'local'
							}, {
								boxLabel  : 'Remote server',
								name      : 'import_mode',
								inputValue: 'remote'
							}
						]
					}]
				}]
			},{
				xtype:'form',
				itemId:'cUploadForm',
				hidden: true,
				border: false,
				frame:false,
				bodyCls: 'ux-noframe-bg',
				padding: "8 0 0 0",
				width:'100%',
				layout:'anchor',
				items:[{
					xtype: 'fieldset',
					title: 'From local file',
					items:[{
						xtype: 'filefield',
						allowBlank: false,
						anchor:'100%',
						emptyText: 'Select local OP5 file',
						name: 'op5file',
						buttonText: '',
						buttonConfig: {
							iconCls: 'upload-icon'
						}
					},{
						xtype:'container',
						width:'100%',
						style:{textAlign:'right'},
						padding: "0 6px 6px 0",
						items:[{
							xtype: 'button',
							padding: '0 16px',
							scale: 'small',
							text: 'Ok',
							handler: me.doImportUpload,
							scope: me
						}]
					}]
				}]
			},{
				xtype:'form',
				itemId:'cLocalForm',
				hidden: true,
				border: false,
				frame:false,
				bodyCls: 'ux-noframe-bg',
				padding: "8 0 0 0",
				width:'100%',
				layout:'anchor',
				items:[{
					xtype: 'fieldset',
					title: 'From local Sdomain',
					items:[{
						xtype: 'combobox',
						itemId: 'fSdomainField',
						anchor:'100%',
						name: 'src_sdomain_id',
						fieldLabel: 'Src Sdomain',
						forceSelection: true,
						editable: false,
						store: {
							fields: ['id', 'txt'],
							data : localComboSdomains
						},
						queryMode: 'local',
						displayField: 'txt',
						valueField: 'id',
						allowBlank: false
					},{
						xtype:'container',
						width:'100%',
						style:{textAlign:'right'},
						padding: "0 6px 6px 0",
						items:[{
							xtype: 'button',
							padding: '0 16px',
							scale: 'small',
							text: 'Ok',
							handler: me.doImportLocal,
							scope: me
						}]
					}]
				}]
			},{
				xtype:'form',
				itemId:'cRemoteForm',
				hidden: true,
				border: false,
				frame:false,
				bodyCls: 'ux-noframe-bg',
				padding: "8 0 0 0",
				width:'100%',
				layout:'anchor',
				fieldDefaults: {
					labelAlign: 'left',
					labelSeparator: '',
					labelWidth: 90
				},
				setSdomains: function( data ) {
					this.getForm().getFields().each( function(f) {
						switch( f.getName() ) {
							case 'fetch_url' :
							case 'fetch_login_domain' :
							case 'fetch_login_user' :
							case 'fetch_login_pass' :
								f.setReadOnly(true) ;
								break ;
						}
					},this) ;
					this.query('#fSearchContainer')[0].setVisible(false) ;
					this.query('#fSdomainField')[0].setVisible(true) ;
					this.query('#fSdomainField')[0].allowBlank = false ;
					this.query('#fSdomainField')[0].getStore().loadData( data ) ;
					this.query('#fSubmitContainer')[0].setVisible(true) ;
				},
				setNull: function() {
					this.getForm().reset() ;
					this.getForm().getFields().each( function(f) {
						switch( f.getName() ) {
							case 'fetch_url' :
							case 'fetch_login_domain' :
							case 'fetch_login_user' :
							case 'fetch_login_pass' :
								f.setReadOnly(false) ;
								break ;
						}
					},this) ;
					this.query('#fSearchContainer')[0].setVisible(true) ;
					this.query('#fSdomainField')[0].setVisible(false) ;
					this.query('#fSdomainField')[0].allowBlank = true ;
					this.query('#fSubmitContainer')[0].setVisible(false) ;
				},
				items:[{
					xtype: 'fieldset',
					title: 'From remote source',
					items:[{
						xtype: 'textfield',
						anchor:'100%',
						emptyText: 'Server URL',
						fieldLabel: 'Server URL',
						name: 'fetch_url',
						allowBlank: false
					},{
						xtype: 'textfield',
						width:'100',
						emptyText: 'Login domain',
						fieldLabel: 'Domain',
						name: 'fetch_login_domain',
						allowBlank: false
					},{
						xtype:'fieldcontainer',
						anchor:'100%',
						fieldLabel:'Administrator',
						layout:'hbox',
						items:[{
							xtype: 'textfield',
							flex:1,
							emptyText: 'Username',
							name: 'fetch_login_user',
							allowBlank: false
						},{
							xtype:'splitter'
						},{
							xtype: 'textfield',
							flex:1,
							emptyText: 'Password',
							name: 'fetch_login_pass',
							inputType: 'password',
							allowBlank: false
						}]
					},{
						xtype:'container',
						itemId:'fSearchContainer',
						width:'100%',
						style:{textAlign:'right'},
						padding: "0 6px 6px 0",
						items:[{
							xtype: 'button',
							padding: '0 16px',
							scale: 'small',
							text: 'Search',
							handler: me.importRemoteQuerySdomains,
							scope: me
						}],
						hidden:false
					},{
						xtype: 'combobox',
						itemId: 'fSdomainField',
						anchor:'100%',
						name: 'fetch_src_sdomain',
						fieldLabel: 'Src Sdomain',
						forceSelection: true,
						editable: false,
						store: {
							fields: ['id', 'txt'],
							data : []
						},
						queryMode: 'local',
						displayField: 'txt',
						valueField: 'id',
						hidden:true
					},{
						xtype:'container',
						itemId:'fSubmitContainer',
						width:'100%',
						style:{textAlign:'right'},
						padding: "0 6px 6px 0",
						items:[{
							xtype: 'button',
							padding: '0 16px',
							scale: 'small',
							text: 'Reset',
							handler: function(btn) {
								btn.up('form').setNull() ;
							}
						},{
							xtype: 'button',
							padding: '0 16px',
							scale: 'small',
							text: 'Ok',
							handler: me.importRemoteQueryDo,
							scope: me
						}],
						hidden:true
					}]
				}]
			}]
		}) ;
		
		var cardDelete = Ext.create('Ext.panel.Panel',{
			itemId:'mCardDelete',
			border: false,
			frame:false,
			bodyCls: 'ux-noframe-bg',
			bodyPadding: "0 10px",
			layout: {
				type: 'vbox',
				align: 'center'
			},
			tbar:[{
				iconCls:'op5-sdomains-menu-back',
				text:'Back',
				handler: function() {
					me.getLayout().setActiveItem('mFormAttributes') ;
				},
				scope:me
			}],
			setEnabled: function( bool ) {
				this.getComponent('pCheckContainer').setVisible( bool ) ;
				this.getComponent('pButton').setVisible( bool ) ;
			},
			items:[Ext.create('Optima5.Modules.Admin.CardHeader',{
				width:'100%',
				data:{
					iconCls:'op5-sdomains-icon-delete',
					title: 'Delete Sdomain',
					caption: 'Permanently delete all associated data'
				}
			}),{
				xtype:'form',
				itemId:'pDummyForm',
				border: false,
				frame:false,
				bodyCls: 'ux-noframe-bg',
				padding: "8 0 0 0",
				width:'100%',
				layout:'anchor',
				fieldDefaults: {
					labelAlign: 'left',
					labelSeparator: '',
					labelWidth: 90
				},
				items: [{
					xtype: 'fieldset',
					width: '100%',
					title: 'Delete mode',
					items:[{
						xtype      : 'fieldcontainer',
						defaultType: 'radiofield',
						defaults: {
							flex: 1,
							listeners: {
								change: function( field, value ) {
									if( field.getName()=='delete_mode' && value == true ) {
										// console.log('mode = '+field.inputValue) ;
										var cardDelete = field.up('form').up() ;
										cardDelete.setEnabled( (field.inputValue && field.inputValue.length>0) ) ;
										return ;
									}
								},
								scope: me
							}
						},
						layout: 'hbox',
						items: [
							{
								boxLabel  : 'Truncate all data stores',
								name      : 'delete_mode',
								inputValue: 'truncate'
							}, {
								boxLabel  : 'Drop (delete) Sdomain',
								name      : 'delete_mode',
								inputValue: 'drop'
							}
						]
					}]
				}]
			},{
				xtype:'container',
				itemId:'pCheckContainer',
				hidden:true,
				padding: "8 0 8 0",
				layout:'hbox',
				items:[{
					xtype:'checkbox',
					itemId:'pCheckbox'
				},{
					xtype:'component',
					style:{color:'#CC0000',fontWeight:'bold'},
					html:'Confirm deletion of current sdomain',
					padding:'2px 6px'
				}]
			},{
				xtype: 'button',
				itemId:'pButton',
				hidden:true,
				padding: '0 16px',
				scale: 'large',
				text: 'Delete',
				handler: function( btn ) {
					if( btn.up('panel').getComponent('pCheckContainer').getComponent('pCheckbox').getValue() ) {
						me.doDelete();
					}
				},
				scope:me
			}]
		}) ;
		
		
		me.removeAll() ;
		me.add(formAttributes) ;
		me.add(cardExport) ;
		me.add(cardImport) ;
		me.add(cardDelete) ;
		me.calcLayout() ;
		//me.getLayout().setActiveItem(0) ;
	},
	saveRecord: function() {
		var me = this ;
		
		if( !me.isNew ) {
			if( me.tool_checkModuleRunning() ) {
				return ;
			}
		}
		
		me.loadMask = Ext.create('Ext.LoadMask',{
			target: me.getComponent('mFormAttributes'),
			msg:'Saving...'
		});
		me.loadMask.show() ;
		
		var values = me.getComponent('mFormAttributes').getValues() ;
		if( me.isNew ) {
			values['_is_new'] = 1 ;
		} else {
			values['sdomain_id'] = me.sdomainId ;
		}
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params:Ext.apply(values,{
				_action: 'sdomains_setSdomain'
			}),
			callback: function() {
				me.loadMask.destroy() ;
			},
			success : function(response) {
				var responseObj = Ext.decode(response.responseText) ;
				if( responseObj.success == false ) {
					if( responseObj.errors ) {
						me.getComponent('mFormAttributes').getForm().markInvalid(responseObj.errors) ;
					}
					if( responseObj.msg != null ) {
						Ext.Msg.alert('Failed', responseObj.msg);
					}
				}
				else {
					me.optimaModule.postCrmEvent('sdomainchange',{
						sdomainId: values.sdomain_id
					}) ;
				}
			},
			failure: function(form,action){
				if( action.result && action.result.msg )
					Ext.Msg.alert('Failed', action.result.msg);
			},
			scope: me
		}) ;
	},
	doDelete:function(){
		var me = this,
			dModeForm = me.getComponent('mCardDelete').getComponent('pDummyForm'),
			dMode = dModeForm.getValues().delete_mode ;
		
		if( !me.isNew ) {
			if( me.tool_checkModuleRunning() ) {
				return ;
			}
		}
		
		var action ;
		switch( dMode ) {
			case 'truncate' :
				action = 'sdomains_truncateSdomain' ;
				break ;
			case 'drop' :
				action = 'sdomains_deleteSdomain' ;
				break ;
			default :
				return ;
		}
		var params = {
			sdomain_id:me.sdomainId,
			_action: action
		} ;
		
		me.loadMask = Ext.create('Ext.LoadMask',{
			target: me.getComponent('mCardDelete'),
			msg:'Deleting...'
		});
		me.loadMask.show() ;
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params:params,
			success : function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Delete failed. Unknown error');
				}
				else {
					me.optimaModule.postCrmEvent('sdomainchange',{
						sdomainId: params.sdomain_id
					}) ;
				}
			},
			scope: me
		}) ;
	},
	doUpdateSchema: function() {
		var me = this ;
		
		if( !me.isNew ) {
			if( me.tool_checkModuleRunning() ) {
				return ;
			}
		}
		
		var msgbox = Ext.Msg.wait('Updating SQL schema. Please Wait.');
		
		var values = {sdomain_id:me.sdomainId} ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params:Ext.apply(values,{
				_action: 'sdomains_updateSchema'
			}),
			success : function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Delete failed. Unknown error');
				}
				else {
					me.optimaModule.postCrmEvent('sdomainchange',{
						sdomainId: values.sdomain_id
					}) ;
				}
			},
			callback: function() {
				msgbox.close() ;
			},
			scope: me
		}) ;
	},
	doExport: function() {
		var me = this ;
		
		var msgbox = Ext.Msg.wait('Export in progress. Please Wait.');
		
		var values = {sdomain_id:me.sdomainId} ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params:Ext.apply(values,{
				_action: 'sdomains_export'
			}),
			success : function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Delete failed. Unknown error');
					return ;
				}
				if( Ext.decode(response.responseText).empty == true ) {
					Ext.Msg.alert('End', 'Sdomain has no data');
					return ;
				}
				
				var dlParams = me.optimaModule.getConfiguredAjaxParams() ;
				Ext.apply(dlParams,{
					_action: 'sdomains_exportDL',
					transaction_id: Ext.decode(response.responseText).transaction_id
				}) ;
				Ext.create('Ext.ux.dams.FileDownloader',{
					renderTo: Ext.getBody(),
					requestParams: dlParams,
					requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
					requestMethod: 'POST'
				}) ;
			},
			callback: function() {
				msgbox.close() ;
			},
			scope: me
		}) ;
	},
	doImportUpload: function() {
		var me = this,
			  uploadForm = me.getComponent('mCardImport').getComponent('cUploadForm'),
			  baseForm = uploadForm.getForm() ;
			  
		if( !me.isNew ) {
			if( me.tool_checkModuleRunning() ) {
				return ;
			}
		}
		
		if( baseForm.isValid() ) {
			var msgbox = Ext.Msg.wait('Uploading...');
			
			var ajaxParams = me.optimaModule.getConfiguredAjaxParams() ;
			Ext.apply( ajaxParams, {
				_action:'sdomains_import_upload',
				sdomain_id:me.sdomainId
			}) ;
			
			baseForm.submit({
				url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
				params: ajaxParams,
				success : function(fp, o){
					msgbox.close() ;
					me.optimaModule.postCrmEvent('sdomainchange',{
						sdomainId: me.sdomainId
					}) ;
				},
				failure: function(fp, o) {
					msgbox.close() ;
					Ext.Msg.alert('Error',Ext.decode(o.response.responseText).error || 'Undefined error') ;
				},
				scope: me
			});
		}
	},
	
	doImportLocal: function() {
		var me = this,
			  importLocalForm = me.getComponent('mCardImport').getComponent('cLocalForm'),
			  baseForm = importLocalForm.getForm() ;
			  
		if( !me.isNew ) {
			if( me.tool_checkModuleRunning() ) {
				return ;
			}
		}
		
		if( baseForm.isValid() ) {
			var msgbox = Ext.Msg.wait('Remote cloning in progress...');
			
			var ajaxParams = {
				_action:'sdomains_importLocal_do',
				src_sdomain_id:baseForm.findField('src_sdomain_id').getValue(),
				dst_sdomain_id:me.sdomainId
			} ;
			
			me.optimaModule.getConfiguredAjaxConnection().request({
				timeout: (300 * 1000),
				params:ajaxParams,
				success : function(response) {
					var responseObj = Ext.decode(response.responseText) ;
					if( responseObj.success == false ) {
						return ;
					}
					me.optimaModule.postCrmEvent('sdomainchange',{
						sdomainId: me.sdomainId
					}) ;
				},
				callback: function() {
					msgbox.close() ;
				},
				scope: me
			}) ;
		}
	},
	
	importRemoteQuerySdomains: function() {
		var me = this,
			remoteForm = me.getComponent('mCardImport').getComponent('cRemoteForm'),
			baseForm = remoteForm.getForm() ;
			ajaxParams = {} ;
		
		if( baseForm.isValid() ) {
			remoteForm.getEl().mask('Please wait') ;
			
			Ext.apply(ajaxParams,{
				_action:'sdomains_importRemote_getSdomains',
				sdomain_id:me.sdomainId
			}) ;
			Ext.apply(ajaxParams, baseForm.getValues()) ;
			
			me.optimaModule.getConfiguredAjaxConnection().request({
				params:ajaxParams,
				success : function(response) {
					var responseObj = Ext.decode(response.responseText) ;
					
					baseForm.setValues( responseObj.values ) ;
					
					if( responseObj.success == false ) {
						baseForm.markInvalid( responseObj.errors ) ;
					} else {
						var data = [{id:'',txt:'- select Sdomain -'}] ;
						Ext.Array.each( responseObj.sdomains, function(sdomain) {
							data.push({
								id: sdomain.sdomain_id,
								txt: (sdomain.sdomain_id + ' :: ' + sdomain.sdomain_name)
							}) ;
						},me) ;
						remoteForm.setSdomains( data ) ;
					}
				},
				callback: function() {
					remoteForm.getEl().unmask() ;
				},
				scope: me
			}) ;
		}
	},
	importRemoteQueryDo: function() {
		var me = this,
			remoteForm = me.getComponent('mCardImport').getComponent('cRemoteForm'),
			baseForm = remoteForm.getForm() ;
			ajaxParams = {} ;
		
		if( !me.isNew ) {
			if( me.tool_checkModuleRunning() ) {
				return ;
			}
		}
		
		if( baseForm.isValid() ) {
			var msgbox = Ext.Msg.wait('Remote cloning in progress...');
			
			Ext.apply(ajaxParams,{
				_action:'sdomains_importRemote_do',
				sdomain_id:me.sdomainId
			}) ;
			Ext.apply(ajaxParams, baseForm.getValues()) ;
			
			me.optimaModule.getConfiguredAjaxConnection().request({
				timeout: (10 * 60 * 1000),
				params:ajaxParams,
				success : function(response) {
					var responseObj = Ext.decode(response.responseText) ;
					if( responseObj.success == false ) {
						return ;
					}
					me.optimaModule.postCrmEvent('sdomainchange',{
						sdomainId: me.sdomainId
					}) ;
				},
				callback: function() {
					msgbox.close() ;
				},
				scope: me
			}) ;
		}
	},
	
	tool_checkModuleRunning: function() {
		var me = this ;
		// Check for sdomain open windows
		if( !me.isNew ) {
			var optimaApp = me.optimaModule.app ,
				runningInstance = null ;
			optimaApp.eachModuleInstance( function(moduleInstance) {
				if( moduleInstance.sdomainId != null && moduleInstance.sdomainId.toUpperCase() === me.sdomainId.toUpperCase() ) {
					runningInstance = moduleInstance ;
					return false ;
				}
			},me); 
			if( runningInstance != null ) {
				Ext.Msg.alert('Module running', 'Close all instances of '+me.sdomainId+' on desktop before applying changes');
				return true ;
			}
			return false ;
		}
	}
});